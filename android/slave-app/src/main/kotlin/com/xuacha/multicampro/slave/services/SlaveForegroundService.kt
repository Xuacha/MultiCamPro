package com.xuacha.multicampro.slave.services

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.Intent
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Color
import android.os.Build
import android.os.IBinder
import androidx.core.app.NotificationCompat
import com.xuacha.multicampro.slave.MainActivity
import com.xuacha.multicampro.slave.R
import com.xuacha.multicampro.slave.utils.Constants
import com.xuacha.multicampro.slave.utils.Logger

/**
 * Servicio en Primer Plano para MultiCamPro Slave
 * 
 * Mantiene la app activa con una notificación persistente ultra-minimalista.
 * La notificación es un simple punto gris de 1x1 pixel que no molesta al usuario.
 * 
 * Este servicio es CRÍTICO para que la app funcione en segundo plano sin ser
 * detenida por el administrador de tareas de Android.
 */
class SlaveForegroundService : Service() {
    
    private lateinit var notificationManager: NotificationManager
    
    override fun onCreate() {
        super.onCreate()
        Logger.log("SlaveForegroundService creado")
        notificationManager = getSystemService(NOTIFICATION_SERVICE) as NotificationManager
        createNotificationChannel()
    }
    
    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        Logger.log("SlaveForegroundService iniciado")
        
        // Crear notificación ultra-minimalista
        val notification = createMinimalNotification()
        
        // Iniciar servicio en primer plano con notificación
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            startForeground(
                Constants.NOTIFICATION_ID,
                notification,
                android.content.pm.ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PROJECTION
            )
        } else {
            startForeground(Constants.NOTIFICATION_ID, notification)
        }
        
        Logger.log("Notificación iniciada")
        
        // Retorna STICKY para que el sistema reinicie el servicio si lo mata
        return START_STICKY
    }
    
    override fun onBind(intent: Intent?): IBinder? = null
    
    override fun onDestroy() {
        super.onDestroy()
        Logger.log("SlaveForegroundService destruido")
    }
    
    /**
     * Crea el canal de notificación (requerido para Android 8+)
     */
    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                Constants.NOTIFICATION_CHANNEL_ID,
                Constants.NOTIFICATION_CHANNEL_NAME,
                NotificationManager.IMPORTANCE_MIN  // Importancia mínima = sin sonido
            ).apply {
                description = "Servicio de MultiCamPro Slave en segundo plano"
                setShowBadge(false)  // No mostrar badge
                enableLights(false)
                enableVibration(false)
                setSound(null, null)  // Sin sonido
            }
            notificationManager.createNotificationChannel(channel)
            Logger.log("Canal de notificación creado")
        }
    }
    
    /**
     * Crea una notificación ultra-minimalista
     * Usa un ícono de 1x1 pixel gris en lugar de uno normal
     */
    private fun createMinimalNotification(): Notification {
        // Crear ícono ultra-pequeño (1x1 pixel gris)
        val tinyIcon = createTinyIcon()
        
        return NotificationCompat.Builder(this, Constants.NOTIFICATION_CHANNEL_ID)
            .setSmallIcon(R.drawable.ic_notification)  // Usar ícono discreto
            .setContentTitle("MultiCamPro")
            .setContentText("Activo")
            .setContentIntent(
                android.app.PendingIntent.getActivity(
                    this,
                    0,
                    Intent(this, MainActivity::class.java),
                    android.app.PendingIntent.FLAG_UPDATE_CURRENT or
                            android.app.PendingIntent.FLAG_IMMUTABLE
                )
            )
            .setAutoCancel(false)
            .setShowWhen(false)
            .setOngoing(true)  // Notificación persistente
            .setPriority(NotificationCompat.PRIORITY_MIN)
            .setSilent(true)  // Sin sonido
            .build()
    }
    
    /**
     * Crea un ícono de 1x1 pixel gris para notificación
     * Esto hace que la notificación sea prácticamente invisible
     */
    private fun createTinyIcon(): Bitmap {
        val bitmap = Bitmap.createBitmap(1, 1, Bitmap.Config.RGB_565)
        val canvas = Canvas(bitmap)
        canvas.drawColor(Color.GRAY)
        return bitmap
    }
}
