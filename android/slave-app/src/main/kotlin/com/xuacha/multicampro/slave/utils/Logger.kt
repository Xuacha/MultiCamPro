package com.xuacha.multicampro.slave.utils

import android.util.Log
import java.io.File
import java.text.SimpleDateFormat
import java.util.*

/**
 * Sistema de logging para MultiCamPro Slave
 * Registra logs en consola y archivo para debugging
 */
object Logger {
    
    private const val TAG = "MultiCamPro-Slave"
    private var logFile: File? = null
    private var isLoggingToFile = false
    private val dateFormat = SimpleDateFormat("yyyy-MM-dd HH:mm:ss.SSS", Locale.US)
    
    /**
     * Inicializa el sistema de logging
     * @param logsDirectory Directorio donde guardar logs
     */
    fun init(logsDirectory: File) {
        try {
            if (!logsDirectory.exists()) {
                logsDirectory.mkdirs()
            }
            val timestamp = SimpleDateFormat("yyyy-MM-dd_HH-mm-ss", Locale.US).format(Date())
            logFile = File(logsDirectory, "multicampro_$timestamp.log")
            isLoggingToFile = true
            log("✓ Sistema de logging inicializado")
        } catch (e: Exception) {
            Log.e(TAG, "Error inicializando logging", e)
        }
    }
    
    /**
     * Log de nivel INFO
     */
    fun log(message: String, tag: String = TAG) {
        val formattedMessage = "[${dateFormat.format(Date())}] $message"
        Log.i(tag, message)
        writeToFile("INFO", formattedMessage)
    }
    
    /**
     * Log de nivel DEBUG
     */
    fun debug(message: String, tag: String = TAG) {
        val formattedMessage = "[${dateFormat.format(Date())}] $message"
        Log.d(tag, message)
        writeToFile("DEBUG", formattedMessage)
    }
    
    /**
     * Log de nivel WARNING
     */
    fun warn(message: String, tag: String = TAG) {
        val formattedMessage = "[${dateFormat.format(Date())}] $message"
        Log.w(tag, message)
        writeToFile("WARN", formattedMessage)
    }
    
    /**
     * Log de nivel ERROR
     */
    fun error(message: String, exception: Exception? = null, tag: String = TAG) {
        val formattedMessage = "[${dateFormat.format(Date())}] $message"
        Log.e(tag, message, exception)
        writeToFile("ERROR", "$formattedMessage${if (exception != null) "\n${exception.stackTraceToString()}" else ""}")
    }
    
    /**
     * Log de comando recibido
     */
    fun logCommand(commandType: String, commandData: String? = null, tag: String = TAG) {
        val message = "→ COMANDO: $commandType${if (commandData != null) " | Data: $commandData" else ""}"
        Log.i(tag, message)
        writeToFile("COMMAND", "[${dateFormat.format(Date())}] $message")
    }
    
    /**
     * Log de respuesta enviada
     */
    fun logResponse(commandType: String, responseData: String? = null, tag: String = TAG) {
        val message = "← RESPUESTA: $commandType${if (responseData != null) " | Data: $responseData" else ""}"
        Log.i(tag, message)
        writeToFile("RESPONSE", "[${dateFormat.format(Date())}] $message")
    }
    
    /**
     * Log de error de conexión
     */
    fun logConnectionError(error: String, tag: String = TAG) {
        val message = "⚠ ERROR CONEXIÓN: $error"
        Log.e(tag, message)
        writeToFile("CONNECTION_ERROR", "[${dateFormat.format(Date())}] $message")
    }
    
    /**
     * Log de evento de batería
     */
    fun logBatteryEvent(level: Int, status: String, tag: String = TAG) {
        val message = "🔋 BATERÍA: $level% | Estado: $status"
        Log.i(tag, message)
        writeToFile("BATTERY", "[${dateFormat.format(Date())}] $message")
    }
    
    /**
     * Log de ubicación
     */
    fun logLocation(latitude: Double, longitude: Double, accuracy: Float, tag: String = TAG) {
        val message = "📍 UBICACIÓN: $latitude, $longitude (±${accuracy}m)"
        Log.i(tag, message)
        writeToFile("LOCATION", "[${dateFormat.format(Date())}] $message")
    }
    
    /**
     * Escribe en archivo de log
     */
    private fun writeToFile(level: String, message: String) {
        if (!isLoggingToFile || logFile == null) return
        
        try {
            logFile?.appendText("[$level] $message\n")
        } catch (e: Exception) {
            Log.e(TAG, "Error escribiendo en archivo de log", e)
        }
    }
    
    /**
     * Limpia logs antiguos (mayor a 7 días)
     */
    fun cleanOldLogs(logsDirectory: File, daysToKeep: Int = 7) {
        try {
            val now = System.currentTimeMillis()
            val cutoffTime = now - (daysToKeep * 24 * 60 * 60 * 1000)
            
            logsDirectory.listFiles()?.forEach { file ->
                if (file.isFile && file.lastModified() < cutoffTime) {
                    file.delete()
                    log("🗑️  Log antiguo eliminado: ${file.name}")
                }
            }
        } catch (e: Exception) {
            error("Error limpiando logs antiguos", e)
        }
    }
}
