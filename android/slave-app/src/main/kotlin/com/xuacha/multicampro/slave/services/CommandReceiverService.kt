package com.xuacha.multicampro.slave.services

import android.app.Service
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import androidx.core.app.NotificationCompat
import com.xuacha.multicampro.slave.network.WebSocketClient
import com.xuacha.multicampro.slave.utils.Constants
import com.xuacha.multicampro.slave.utils.Logger
import com.xuacha.multicampro.managers.CameraManager
import com.xuacha.multicampro.managers.LocationManager
import com.xuacha.multicampro.managers.AudioManager
import com.xuacha.multicampro.managers.RTMPStreamManager
import com.xuacha.multicampro.managers.StreamQualityManager
import kotlinx.coroutines.*

/**
 * Servicio Receptor de Comandos para MultiCamPro Slave
 * 
 * Responsabilidades:
 * - Conectar con servidor de señalización via WebSocket
 * - Escuchar y procesar comandos del dispositivo controlador
 * - Sincronizar estado del dispositivo en tiempo real
 * - Manejar reconexiones automáticas
 * - Pasar comandos al AccessibilityService para ejecución
 */
class CommandReceiverService : Service(), WebSocketClient.WebSocketListener {
    
    private lateinit var webSocketClient: WebSocketClient
    private var accessibilityServiceInstance: SlaveAccessibilityService? = null
    private var mainHandler = Handler(Looper.getMainLooper())
    
    // ⭐ Media Managers
    private lateinit var cameraManager: CameraManager
    private lateinit var locationManager: LocationManager
    private lateinit var audioManager: AudioManager
    
    // ⭐ Streaming Managers (Phase 7)
    private lateinit var rtmpStreamManager: RTMPStreamManager
    private lateinit var streamQualityManager: StreamQualityManager
    
    private val serviceScope = CoroutineScope(Dispatchers.Main + SupervisorJob())
    
    override fun onCreate() {
        super.onCreate()
        Logger.log("CommandReceiverService creado")
        
        // Inicializar WebSocket client
        webSocketClient = WebSocketClient(this)
        
        // Inicializar Media Managers
        cameraManager = CameraManager(this)
        locationManager = LocationManager(this)
        audioManager = AudioManager(this)
        
        // Inicializar Streaming Managers (Phase 7)
        rtmpStreamManager = RTMPStreamManager(cameraManager, serviceScope)
        streamQualityManager = StreamQualityManager(this, serviceScope)
    }
    
    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        Logger.log("CommandReceiverService iniciado")
        
        // Iniciar en primer plano para evitar que se mate
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            startForeground(Constants.NOTIFICATION_ID + 1, createServiceNotification())
        }
        
        // Iniciar conexión al servidor de señalización
        connectToSignalingServer()
        
        return START_STICKY
    }
    
    override fun onBind(intent: Intent?): IBinder? = null
    
    override fun onDestroy() {
        super.onDestroy()
        Logger.log("CommandReceiverService destruido")
        webSocketClient.disconnect()
        
        // Limpiar Media Managers
        cameraManager.cleanup()
        locationManager.cleanup()
        audioManager.cleanup()
        
        // Limpiar Streaming Managers (Phase 7)
        rtmpStreamManager.stopStream().also {
            Logger.log("RTMP Stream detenido durante onDestroy")
        }
        
        serviceScope.cancel()
    }
    
    /**
     * Conecta con el servidor de señalización
     */
    private fun connectToSignalingServer() {
        try {
            Logger.log("Conectando al servidor de señalización: ${Constants.SIGNALING_SERVER_URL}")
            
            // Obtener credenciales (normalmente desde Firebase o preferencias)
            val prefs = getSharedPreferences(Constants.PREFS_NAME, Context.MODE_PRIVATE)
            val deviceId = prefs.getString(Constants.PREF_KEY_DEVICE_ID, "android-device-") ?: "android-device-"
            val ownerUid = prefs.getString(Constants.PREF_KEY_OWNER_UID, "") ?: ""
            val accessToken = prefs.getString(Constants.PREF_KEY_ACCESS_TOKEN, "") ?: ""
            
            // Si no hay credenciales, generar temporal
            val finalDeviceId = if (deviceId == "android-device-") {
                "android-device-${android.provider.Settings.Secure.getString(contentResolver, android.provider.Settings.Secure.ANDROID_ID)}"
            } else {
                deviceId
            }
            
            val finalOwnerUid = if (ownerUid.isEmpty()) {
                "temp-user-${System.currentTimeMillis()}"
            } else {
                ownerUid
            }
            
            // Conectar
            webSocketClient.connect(
                Constants.SIGNALING_SERVER_URL,
                finalDeviceId,
                finalOwnerUid,
                accessToken.ifEmpty { "temp-token" },
                listener = this
            )
            
        } catch (e: Exception) {
            Logger.logConnectionError("Error conectando al servidor: ${e.message}")
            scheduleReconnection()
        }
    }
    
    /**
     * Implementación de WebSocketListener
     */
    override fun onConnected() {
        Logger.success("✓ Conectado al servidor de señalización")
        
        // Solicitar comandos en cola si hay desconexión previa
        webSocketClient.requestCommandQueue()
        
        // Actualizar estado del dispositivo
        updateDeviceStatus("CONNECTED")
    }
    
    override fun onDisconnected() {
        Logger.warn("✗ Desconectado del servidor de señalización")
        scheduleReconnection()
    }
    
    override fun onRemoteCommand(commandType: String, commandData: String?, commandId: String) {
        Logger.logCommand(commandType, commandData)
        
        // Procesar comando en AccessibilityService
        processRemoteCommand(commandType, commandData, commandId)
    }
    
    override fun onError(message: String) {
        Logger.error("Error WebSocket: $message")
    }
    
    /**
     * Procesa un comando remoto
     */
    private fun processRemoteCommand(commandType: String, commandData: String?, commandId: String) {
        try {
            // Pasar al AccessibilityService para ejecutar
            when (commandType) {
                Constants.COMMAND_TAKE_PHOTO -> {
                    handleTakePhoto(commandId, commandData)
                }
                Constants.COMMAND_START_VIDEO -> {
                    handleStartVideo(commandId, commandData)
                }
                Constants.COMMAND_STOP_VIDEO -> {
                    handleStopVideo(commandId)
                }
                Constants.COMMAND_START_STREAM -> {
                    handleStartStream(commandId, commandData)
                }
                Constants.COMMAND_STOP_STREAM -> {
                    handleStopStream(commandId)
                }
                Constants.COMMAND_GET_BATTERY -> {
                    handleGetBattery(commandId)
                }
                Constants.COMMAND_GET_LOCATION -> {
                    handleGetLocation(commandId)
                }
                Constants.COMMAND_TOGGLE_FLASHLIGHT -> {
                    handleToggleFlashlight(commandId, commandData)
                }
                Constants.COMMAND_GET_DEVICE_INFO -> {
                    handleGetDeviceInfo(commandId)
                }
                else -> {
                    Logger.warn("Comando desconocido: $commandType")
                    sendError(commandId, commandType, "Unknown command")
                }
            }
        } catch (e: Exception) {
            Logger.error("Error procesando comando", e)
            sendError(commandId, commandType, e.message ?: "Unknown error")
        }
    }
    
    /**
     * Handlers de comandos
     */
    
    private fun handleTakePhoto(commandId: String, commandData: String?) {
        Logger.log("→ Ejecutando: TAKE_PHOTO")
        
        serviceScope.launch {
            try {
                val result = cameraManager.takePhoto(
                    cameraId = extractJsonString(commandData, "cameraId", "back")
                )
                
                result.onSuccess { filePath ->
                    sendResponse(commandId, Constants.COMMAND_TAKE_PHOTO, mapOf(
                        "status" to "success",
                        "imageUrl" to filePath,
                        "timestamp" to System.currentTimeMillis()
                    ))
                    Logger.success("✓ Foto capturada: $filePath")
                }
                
                result.onFailure { error ->
                    sendError(commandId, Constants.COMMAND_TAKE_PHOTO, error.message ?: "Unknown error")
                }
            } catch (e: Exception) {
                Logger.error("Error en handleTakePhoto", e)
                sendError(commandId, Constants.COMMAND_TAKE_PHOTO, e.message ?: "Unknown error")
            }
        }
    }
    
    private fun handleStartVideo(commandId: String, commandData: String?) {
        Logger.log("→ Ejecutando: START_VIDEO")
        
        serviceScope.launch {
            try {
                val duration = extractJsonLong(commandData, "duration")
                val quality = extractJsonString(commandData, "quality", "high")
                val cameraId = extractJsonString(commandData, "cameraId", "back")
                
                val result = cameraManager.startVideo(
                    duration = duration,
                    quality = quality,
                    cameraId = cameraId
                )
                
                result.onSuccess { sessionId ->
                    sendResponse(commandId, Constants.COMMAND_START_VIDEO, mapOf(
                        "status" to "recording",
                        "sessionId" to sessionId,
                        "timestamp" to System.currentTimeMillis()
                    ))
                    Logger.success("✓ Grabación iniciada: $sessionId")
                }
                
                result.onFailure { error ->
                    sendError(commandId, Constants.COMMAND_START_VIDEO, error.message ?: "Unknown error")
                }
            } catch (e: Exception) {
                Logger.error("Error en handleStartVideo", e)
                sendError(commandId, Constants.COMMAND_START_VIDEO, e.message ?: "Unknown error")
            }
        }
    }
    
    private fun handleStopVideo(commandId: String) {
        Logger.log("→ Ejecutando: STOP_VIDEO")
        
        serviceScope.launch {
            try {
                val result = cameraManager.stopVideo()
                
                result.onSuccess { filePath ->
                    sendResponse(commandId, Constants.COMMAND_STOP_VIDEO, mapOf(
                        "status" to "stopped",
                        "videoUrl" to filePath,
                        "timestamp" to System.currentTimeMillis()
                    ))
                    Logger.success("✓ Grabación detenida: $filePath")
                }
                
                result.onFailure { error ->
                    sendError(commandId, Constants.COMMAND_STOP_VIDEO, error.message ?: "Unknown error")
                }
            } catch (e: Exception) {
                Logger.error("Error en handleStopVideo", e)
                sendError(commandId, Constants.COMMAND_STOP_VIDEO, e.message ?: "Unknown error")
            }
        }
    }
    
    private fun handleStartStream(commandId: String, commandData: String?) {
        Logger.log("→ Ejecutando: START_STREAM (Phase 7)")
        
        // Parsear datos del comando (formato JSON esperado)
        try {
            // Estructura esperada: {"rtmpUrl": "...", "quality": "medium", "cameraId": "back"}
            val params = if (!commandData.isNullOrEmpty()) {
                try {
                    JSONObject(commandData)
                } catch (e: Exception) {
                    JSONObject()
                }
            } else {
                JSONObject()
            }
            
            val rtmpUrl = params.optString("rtmpUrl", "rtmp://streaming.server/live/stream")
            val quality = params.optString("quality", "medium")
            val cameraId = params.optString("cameraId", "back")
            
            // Verificar conexión de red
            val networkStatus = streamQualityManager.getNetworkStatus()
            Logger.log("Red detectada: ${networkStatus.type}, Calidad: ${networkStatus.quality}, Bitrate: ${networkStatus.estimatedBitrate} kbps")
            
            // Validar que la red es adecuada para streaming
            if (!streamQualityManager.isNetworkAdequateForStreaming(quality)) {
                val warning = streamQualityManager.getNetworkWarning()
                Logger.log("⚠️ Advertencia de red: $warning")
                
                sendResponse(commandId, Constants.COMMAND_START_STREAM, mapOf(
                    "status" to "warning",
                    "message" to (warning ?: "Network quality is insufficient for streaming"),
                    "recommendedQuality" to streamQualityManager.recommendQuality(),
                    "networkStatus" to mapOf(
                        "type" to networkStatus.type,
                        "quality" to networkStatus.quality,
                        "bitrate" to networkStatus.estimatedBitrate
                    )
                ))
                return
            }
            
            // Iniciar stream RTMP usando coroutina
            serviceScope.launch {
                try {
                    Logger.log("Iniciando stream RTMP hacia: $rtmpUrl con calidad: $quality")
                    val result = rtmpStreamManager.startStream(rtmpUrl, quality, cameraId)
                    
                    when {
                        result.isSuccess -> {
                            val sessionId = result.getOrNull() ?: "unknown"
                            Logger.log("✅ Stream iniciado. Session ID: $sessionId")
                            
                            sendResponse(commandId, Constants.COMMAND_START_STREAM, mapOf(
                                "status" to "success",
                                "sessionId" to sessionId,
                                "rtmpUrl" to rtmpUrl,
                                "quality" to quality,
                                "cameraId" to cameraId,
                                "networkStatus" to mapOf(
                                    "type" to networkStatus.type,
                                    "quality" to networkStatus.quality,
                                    "bitrate" to networkStatus.estimatedBitrate
                                ),
                                "timestamp" to System.currentTimeMillis()
                            ))
                        }
                        result.isFailure -> {
                            val error = result.exceptionOrNull()?.message ?: "Unknown error"
                            Logger.log("❌ Error iniciando stream: $error")
                            
                            sendResponse(commandId, Constants.COMMAND_START_STREAM, mapOf(
                                "status" to "error",
                                "message" to error
                            ))
                        }
                    }
                } catch (e: Exception) {
                    Logger.log("❌ Excepción en START_STREAM: ${e.message}")
                    
                    sendResponse(commandId, Constants.COMMAND_START_STREAM, mapOf(
                        "status" to "error",
                        "message" to (e.message ?: "Unknown error during stream startup")
                    ))
                }
            }
            
        } catch (e: Exception) {
            Logger.log("❌ Error parseando comando START_STREAM: ${e.message}")
            
            sendResponse(commandId, Constants.COMMAND_START_STREAM, mapOf(
                "status" to "error",
                "message" to "Invalid command format: ${e.message}"
            ))
        }
    }
    
    private fun handleStopStream(commandId: String) {
        Logger.log("→ Ejecutando: STOP_STREAM (Phase 7)")
        
        serviceScope.launch {
            try {
                val result = rtmpStreamManager.stopStream()
                
                when {
                    result.isSuccess -> {
                        val info = rtmpStreamManager.getStreamInfo()
                        Logger.log("✅ Stream detenido. Duración: ${info?.get("duration") ?: "N/A"}ms")
                        
                        sendResponse(commandId, Constants.COMMAND_STOP_STREAM, mapOf(
                            "status" to "success",
                            "duration" to (info?.get("duration") ?: 0L),
                            "sessionId" to (info?.get("sessionId") ?: "unknown"),
                            "rtmpUrl" to (info?.get("rtmpUrl") ?: ""),
                            "timestamp" to System.currentTimeMillis()
                        ))
                    }
                    result.isFailure -> {
                        val error = result.exceptionOrNull()?.message ?: "Unknown error"
                        Logger.log("⚠️ Stream ya estaba detenido o error: $error")
                        
                        sendResponse(commandId, Constants.COMMAND_STOP_STREAM, mapOf(
                            "status" to "stopped",
                            "message" to error,
                            "timestamp" to System.currentTimeMillis()
                        ))
                    }
                }
            } catch (e: Exception) {
                Logger.log("❌ Excepción en STOP_STREAM: ${e.message}")
                
                sendResponse(commandId, Constants.COMMAND_STOP_STREAM, mapOf(
                    "status" to "error",
                    "message" to (e.message ?: "Unknown error during stream shutdown")
                ))
            }
        }
    
    private fun handleGetBattery(commandId: String) {
        Logger.log("→ Ejecutando: GET_BATTERY")
        
        try {
            val batteryManager = getSystemService(Context.BATTERY_SERVICE) as android.os.BatteryManager
            val battery = batteryManager.getIntProperty(
                android.os.BatteryManager.BATTERY_PROPERTY_CAPACITY
            )
            
            sendResponse(commandId, Constants.COMMAND_GET_BATTERY, mapOf(
                "battery" to battery,
                "status" to "success",
                "timestamp" to System.currentTimeMillis()
            ))
        } catch (e: Exception) {
            Logger.error("Error en handleGetBattery", e)
            sendError(commandId, Constants.COMMAND_GET_BATTERY, e.message ?: "Unknown error")
        }
    }
    
    private fun handleGetLocation(commandId: String) {
        Logger.log("→ Ejecutando: GET_LOCATION")
        
        serviceScope.launch {
            try {
                val result = locationManager.getCurrentLocation()
                
                result.onSuccess { locationData ->
                    sendResponse(commandId, Constants.COMMAND_GET_LOCATION, locationData)
                    Logger.success("✓ Ubicación obtenida")
                }
                
                result.onFailure { error ->
                    sendError(commandId, Constants.COMMAND_GET_LOCATION, error.message ?: "Unknown error")
                }
            } catch (e: Exception) {
                Logger.error("Error en handleGetLocation", e)
                sendError(commandId, Constants.COMMAND_GET_LOCATION, e.message ?: "Unknown error")
            }
        }
    }
    
    private fun handleToggleFlashlight(commandId: String, commandData: String?) {
        Logger.log("→ Ejecutando: TOGGLE_FLASHLIGHT")
        
        serviceScope.launch {
            try {
                val enabled = extractJsonBoolean(commandData, "enabled", false)
                
                val result = cameraManager.toggleFlash(enabled)
                
                result.onSuccess { state ->
                    sendResponse(commandId, Constants.COMMAND_TOGGLE_FLASHLIGHT, mapOf(
                        "status" to "success",
                        "enabled" to state,
                        "timestamp" to System.currentTimeMillis()
                    ))
                    Logger.success("✓ Flash toggled: $state")
                }
                
                result.onFailure { error ->
                    sendError(commandId, Constants.COMMAND_TOGGLE_FLASHLIGHT, error.message ?: "Unknown error")
                }
            } catch (e: Exception) {
                Logger.error("Error en handleToggleFlashlight", e)
                sendError(commandId, Constants.COMMAND_TOGGLE_FLASHLIGHT, e.message ?: "Unknown error")
            }
        }
    }
    
    private fun handleGetDeviceInfo(commandId: String) {
        Logger.log("→ Ejecutando: GET_DEVICE_INFO")
        
        try {
            val info = mapOf(
                "model" to android.os.Build.MODEL,
                "manufacturer" to android.os.Build.MANUFACTURER,
                "android_version" to android.os.Build.VERSION.RELEASE,
                "api_level" to android.os.Build.VERSION.SDK_INT,
                "available_cameras" to cameraManager.getAvailableCameras(),
                "timestamp" to System.currentTimeMillis()
            )
            sendResponse(commandId, Constants.COMMAND_GET_DEVICE_INFO, info)
            Logger.success("✓ Device info collected")
        } catch (e: Exception) {
            Logger.error("Error en handleGetDeviceInfo", e)
            sendError(commandId, Constants.COMMAND_GET_DEVICE_INFO, e.message ?: "Unknown error")
        }
    }
    
    /**
     * Enviar respuesta al servidor
     */
    private fun sendResponse(commandId: String, commandType: String, response: Map<String, Any>) {
        webSocketClient.sendCommandResponse(commandId, commandType, response)
        Logger.logResponse(commandType, "Response sent")
    }
    
    /**
     * Enviar error al servidor
     */
    private fun sendError(commandId: String, commandType: String, error: String) {
        webSocketClient.sendCommandResponse(commandId, commandType, null, error)
        Logger.error("Error response: $commandType - $error")
    }
    
    /**
     * Actualizar estado del dispositivo
     */
    private fun updateDeviceStatus(status: String, battery: Int? = null) {
        webSocketClient.updateStatus(status, battery)
        Logger.log("Estado actualizado: $status")
    }
    
    /**
     * Crea notificación para servicio en primer plano
     */
    private fun createServiceNotification(): android.app.Notification {
        return NotificationCompat.Builder(this, Constants.NOTIFICATION_CHANNEL_ID)
            .setContentTitle("MultiCamPro")
            .setContentText("Escuchando comandos")
            .setSmallIcon(android.R.drawable.ic_notification_clear_all)
            .setPriority(NotificationCompat.PRIORITY_MIN)
            .setAutoCancel(false)
            .setOngoing(true)
            .build()
    }
    
    /**
     * Programa reconexión automática
     */
    private fun scheduleReconnection() {
        Logger.warn("Programando reconexión en 5 segundos...")
        mainHandler.postDelayed(
            { connectToSignalingServer() },
            Constants.SOCKET_RECONNECT_DELAY.toLong()
        )
    }
    
    /**
     * Funciones de utilidad para JSON parsing
     */
    
    private fun extractJsonString(json: String?, key: String, default: String): String {
        return try {
            if (json == null) default
            else {
                val regex = "\"$key\"\\s*:\\s*\"([^\"]+)\"".toRegex()
                regex.find(json)?.groupValues?.get(1) ?: default
            }
        } catch (e: Exception) {
            default
        }
    }
    
    private fun extractJsonLong(json: String?, key: String): Long? {
        return try {
            if (json == null) null
            else {
                val regex = "\"$key\"\\s*:\\s*(\\d+)".toRegex()
                regex.find(json)?.groupValues?.get(1)?.toLong()
            }
        } catch (e: Exception) {
            null
        }
    }
    
    private fun extractJsonBoolean(json: String?, key: String, default: Boolean): Boolean {
        return try {
            if (json == null) default
            else {
                val regex = "\"$key\"\\s*:\\s*(true|false)".toRegex()
                regex.find(json)?.groupValues?.get(1)?.toBoolean() ?: default
            }
        } catch (e: Exception) {
            default
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
*/
