package com.xuacha.multicampro.slave

import android.app.Application
import android.content.Intent
import android.os.Build
import com.xuacha.multicampro.slave.services.SlaveForegroundService
import com.xuacha.multicampro.slave.utils.Constants
import com.xuacha.multicampro.slave.utils.Logger
import java.io.File

/**
 * Punto de entrada de la aplicación esclava MultiCamPro
 * Inicializa servicios críticos, logging y configura permisos
 */
class MainApplication : Application() {
    
    override fun onCreate() {
        super.onCreate()
        
        // Inicializar sistema de logging
        val logsDir = File(getExternalFilesDir(null), Constants.LOGS_DIRECTORY)
        Logger.init(logsDir)
        Logger.log("═══════════════════════════════════════════════════")
        Logger.log("🚀 MultiCamPro Slave iniciando...")
        Logger.log("Versión: ${Constants.APP_VERSION}")
        Logger.log("Dispositivo: ${Build.MANUFACTURER} ${Build.MODEL}")
        Logger.log("Android: ${Build.VERSION.RELEASE} (API ${Build.VERSION.SDK_INT})")
        Logger.log("═══════════════════════════════════════════════════")
        
        try {
            // Iniciar servicio en primer plano
            startForegroundService()
            
            // Limpiar logs antiguos
            Logger.cleanOldLogs(logsDir)
            
            Logger.log("✓ Inicialización completada exitosamente")
        } catch (e: Exception) {
            Logger.error("✗ Error durante inicialización", e)
        }
    }
    
    /**
     * Inicia el servicio en primer plano
     * Este servicio mantiene la app activa con una notificación persistente
     */
    private fun startForegroundService() {
        try {
            val intent = Intent(this, SlaveForegroundService::class.java)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                startForegroundService(intent)
            } else {
                startService(intent)
            }
            Logger.log("✓ Servicio en primer plano iniciado")
        } catch (e: Exception) {
            Logger.error("✗ Error iniciando servicio en primer plano", e)
        }
    }
}
