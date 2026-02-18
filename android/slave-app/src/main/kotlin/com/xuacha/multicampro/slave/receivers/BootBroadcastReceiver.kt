package com.xuacha.multicampro.slave.receivers

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Build
import com.xuacha.multicampro.slave.services.SlaveForegroundService
import com.xuacha.multicampro.slave.utils.Logger

/**
 * Receptor de Broadcast para Auto-Reinicio
 * 
 * Se activa cuando el dispositivo se enciende (BOOT_COMPLETED).
 * Automáticamente reinicia los servicios de MultiCamPro Slave.
 * 
 * Esto asegura que la app esté siempre activa aunque el dispositivo se apague.
 */
class BootBroadcastReceiver : BroadcastReceiver() {
    
    override fun onReceive(context: Context?, intent: Intent?) {
        if (intent?.action == Intent.ACTION_BOOT_COMPLETED ||
            intent?.action == "android.intent.action.QUICKBOOT_POWERON") {
            
            Logger.log("═══════════════════════════════════════════════════")
            Logger.log("📱 Dispositivo ENCENDIDO")
            Logger.log("═══════════════════════════════════════════════════")
            Logger.log("Iniciando servicios de MultiCamPro Slave...")
            
            if (context != null) {
                startSlaveServices(context)
            }
        }
    }
    
    /**
     * Inicia los servicios principales después del reinicio
     */
    private fun startSlaveServices(context: Context) {
        try {
            // Iniciar servicio en primer plano
            val serviceIntent = Intent(context, SlaveForegroundService::class.java)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(serviceIntent)
            } else {
                context.startService(serviceIntent)
            }
            
            Logger.log("✓ Servicios iniciados después del reinicio")
        } catch (e: Exception) {
            Logger.error("Error iniciando servicios después del reinicio", e)
        }
    }
}

/**
 * Receptor de Broadcast para Comandos Remotos
 * 
 * Escucha intent broadcasts que contienen comandos
 * del servidor de señalización o del controlador.
 */
class CommandReceiverBroadcast : BroadcastReceiver() {
    
    override fun onReceive(context: Context?, intent: Intent?) {
        if (intent?.action == "com.xuacha.multicampro.COMMAND_ACTION") {
            val commandType = intent?.getStringExtra("command_type")
            val commandData = intent?.getStringExtra("command_data")
            
            Logger.logCommand(commandType ?: "UNKNOWN", commandData)
            
            if (context != null && commandType != null) {
                processCommand(context, commandType, commandData)
            }
        }
    }
    
    /**
     * Procesa un comando recibido
     */
    private fun processCommand(
        context: Context,
        commandType: String,
        commandData: String?
    ) {
        // Este método sería llamado por el servicio receptor de comandos
        Logger.log("Procesando comando: $commandType")
        
        try {
            // TODO: Enviar al CommandReceiverService para procesamiento
        } catch (e: Exception) {
            Logger.error("Error procesando comando remoto", e)
        }
    }
}
