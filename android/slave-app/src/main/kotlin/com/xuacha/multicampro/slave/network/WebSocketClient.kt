package com.xuacha.multicampro.slave.network

import android.content.Context
import com.google.gson.Gson
import com.google.gson.JsonObject
import io.socket.client.IO
import io.socket.client.Socket
import io.socket.emitter.Emitter
import com.xuacha.multicampro.slave.utils.Constants
import com.xuacha.multicampro.slave.utils.Logger
import java.net.URISyntaxException

/**
 * Cliente WebSocket para comunicación en tiempo real con servidor de señalización
 * 
 * Responsabilidades:
 * - Conectar con servidor de señalización
 * - Registrar el dispositivo esclavo
 * - Escuchar comandos remotos
 * - Enviar respuestas al controlador
 * - Manejar reconexiones automáticas
 * - Sincronizar estado en tiempo real
 */
class WebSocketClient(private val context: Context) {
    
    private var socket: Socket? = null
    private val gson = Gson()
    private var isConnected = false
    private var deviceId: String = ""
    private var ownerUid: String = ""
    private var accessToken: String = ""
    
    /**
     * Listener para eventos de WebSocket
     */
    interface WebSocketListener {
        fun onConnected()
        fun onDisconnected()
        fun onRemoteCommand(commandType: String, commandData: String?, commandId: String)
        fun onError(message: String)
    }
    
    private var listener: WebSocketListener? = null
    
    /**
     * Conectar con servidor de señalización
     */
    fun connect(
        serverUrl: String,
        deviceId: String,
        ownerUid: String,
        accessToken: String,
        listener: WebSocketListener? = null
    ) {
        this.deviceId = deviceId
        this.ownerUid = ownerUid
        this.accessToken = accessToken
        this.listener = listener
        
        try {
            // Configurar opciones de Socket.io
            val opts = IO.Options()
            opts.reconnection = true
            opts.reconnectionDelay = Constants.SOCKET_RECONNECT_DELAY
            opts.reconnectionDelayMax = Constants.SOCKET_RECONNECT_DELAY_MAX
            opts.reconnectionAttempts = 10
            opts.extraHeaders = mapOf(
                "Authorization" to "Bearer $accessToken"
            )
            
            // Crear socket
            socket = IO.socket(serverUrl, opts)
            
            // ========== LISTENERS ==========
            
            // Conectado al servidor
            socket?.on(Socket.EVENT_CONNECT) {
                Logger.log("✓ Conectado al servidor de señalización")
                isConnected = true
                registerDevice()
                listener?.onConnected()
            }
            
            // Desconectado del servidor
            socket?.on(Socket.EVENT_DISCONNECT) {
                Logger.warn("✗ Desconectado del servidor")
                isConnected = false
                listener?.onDisconnected()
            }
            
            // Error de conexión
            socket?.on(Socket.EVENT_CONNECT_ERROR) { args ->
                val error = if (args.isNotEmpty()) args[0].toString() else "Unknown error"
                Logger.logConnectionError("Error conectando: $error")
                listener?.onError(error)
            }
            
            // Reconectando
            socket?.on(Socket.EVENT_RECONNECT_ATTEMPT) {
                Logger.warn("🔄 Intentando reconectar...")
            }
            
            // Confirmación de registro
            socket?.on("registration-confirmed") { args ->
                if (args.isNotEmpty()) {
                    val data = args[0] as? Map<*, *>
                    val message = data?.get("message") as? String
                    Logger.log("✓ Registro confirmado: $message")
                }
            }
            
            // Comando remoto del controlador
            socket?.on("remote-command") { args ->
                if (args.isNotEmpty()) {
                    val cmdData = args[0] as? Map<*, *>
                    val commandId = cmdData?.get("commandId") as? String ?: ""
                    val commandType = cmdData?.get("commandType") as? String ?: ""
                    val commandData = (cmdData?.get("commandData") as? Map<*, *>)?.let {
                        gson.toJson(it)
                    }
                    
                    Logger.logCommand(commandType, commandData)
                    listener?.onRemoteCommand(commandType, commandData, commandId)
                }
            }
            
            // Error del servidor
            socket?.on("server-error") { args ->
                if (args.isNotEmpty()) {
                    val error = (args[0] as? Map<*, *>)?.get("message") as? String
                        ?: "Unknown server error"
                    Logger.error("Error del servidor: $error")
                    listener?.onError(error)
                }
            }
            
            // Dispositivo no encontrado (permiso denegado)
            socket?.on("error") { args ->
                if (args.isNotEmpty()) {
                    val error = (args[0] as? Map<*, *>)?.get("message") as? String
                        ?: "Unknown error"
                    Logger.error("Error: $error")
                    listener?.onError(error)
                }
            }
            
            // Conectar al servidor
            socket?.connect()
            Logger.log("Conectando a $serverUrl...")
            
        } catch (e: URISyntaxException) {
            Logger.error("URISyntaxException al conectar", e)
            listener?.onError("Invalid server URL: ${e.message}")
        } catch (e: Exception) {
            Logger.error("Error inicializando WebSocket", e)
            listener?.onError(e.message ?: "Unknown error")
        }
    }
    
    /**
     * Registrar dispositivo esclavo en el servidor
     */
    private fun registerDevice() {
        try {
            // Obtener información del dispositivo
            val deviceInfo = mapOf(
                "deviceId" to deviceId,
                "ownerUid" to ownerUid,
                "accessToken" to accessToken,
                "model" to android.os.Build.MODEL,
                "manufacturer" to android.os.Build.MANUFACTURER,
                "android" to android.os.Build.VERSION.RELEASE,
                "battery" to 100,  // TODO: obtener batería real
                "capabilities" to listOf("camera", "audio", "gps")
            )
            
            Logger.log("Registrando dispositivo: $deviceId")
            socket?.emit("register-slave", deviceInfo)
        } catch (e: Exception) {
            Logger.error("Error registrando dispositivo", e)
        }
    }
    
    /**
     * Enviar respuesta de comando al servidor
     */
    fun sendCommandResponse(
        commandId: String,
        commandType: String,
        response: Map<String, Any>? = null,
        error: String? = null
    ) {
        try {
            if (!isConnected) {
                Logger.warn("No conectado, no se puede enviar respuesta")
                return
            }
            
            val responseData = mapOf(
                "commandId" to commandId,
                "commandType" to commandType,
                "deviceId" to deviceId,
                "response" to (response ?: emptyMap<String, Any>()),
                "error" to (error ?: ""),
                "timestamp" to System.currentTimeMillis()
            )
            
            socket?.emit("command-response", responseData)
            Logger.logResponse(commandType, "Response sent")
        } catch (e: Exception) {
            Logger.error("Error sending command response", e)
        }
    }
    
    /**
     * Actualizar estado del dispositivo en el servidor
     */
    fun updateStatus(
        status: String,
        battery: Int? = null,
        signal: Int? = null,
        location: Map<String, Double>? = null
    ) {
        try {
            if (!isConnected) {
                Logger.warn("No conectado, no se puede actualizar estado")
                return
            }
            
            val statusUpdate = mutableMapOf(
                "deviceId" to deviceId,
                "status" to status
            )
            
            battery?.let { statusUpdate["battery"] = it }
            signal?.let { statusUpdate["signal"] = it }
            location?.let { statusUpdate["location"] = it }
            
            socket?.emit("update-status", statusUpdate)
            Logger.log("Estado actualizado: $status, Batería: $battery%")
        } catch (e: Exception) {
            Logger.error("Error updating status", e)
        }
    }
    
    /**
     * Solicitar lista de comandos en cola (cuando se reconecta)
     */
    fun requestCommandQueue() {
        try {
            if (!isConnected) {
                return
            }
            
            socket?.emit("get-command-queue", mapOf("deviceId" to deviceId))
            Logger.log("Solicitando comandos en cola...")
        } catch (e: Exception) {
            Logger.error("Error requesting command queue", e)
        }
    }
    
    /**
     * Desconectar del servidor
     */
    fun disconnect() {
        try {
            if (socket?.connected() == true) {
                socket?.disconnect()
                Logger.log("Desconectado del servidor")
            }
            isConnected = false
        } catch (e: Exception) {
            Logger.error("Error desconectando", e)
        }
    }
    
    /**
     * Obtener estado de conexión
     */
    fun isConnected(): Boolean = isConnected
    
    /**
     * Reconectar manualmente
     */
    fun reconnect() {
        try {
            if (socket?.connected() == false) {
                socket?.connect()
                Logger.log("Reconectando al servidor...")
            }
        } catch (e: Exception) {
            Logger.error("Error reconectando", e)
        }
    }
}

// ========== EXTENSIÓN PARA CONSTANTS.kt ==========
// Agregar a Constants.kt:
/*
// WebSocket
const val SOCKET_RECONNECT_DELAY = 5000  // 5 segundos
const val SOCKET_RECONNECT_DELAY_MAX = 30000  // 30 segundos
const val SOCKET_RECONNECT_ATTEMPTS = 10
const val SOCKET_PING_INTERVAL = 25000  // 25 segundos
const val SOCKET_PING_TIMEOUT = 60000  // 60 segundos
*/
