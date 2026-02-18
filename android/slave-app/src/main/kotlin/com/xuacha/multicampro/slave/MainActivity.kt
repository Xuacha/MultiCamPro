package com.xuacha.multicampro.slave

import android.app.ActivityManager
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.Bundle
import android.provider.Settings
import android.widget.Button
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import com.xuacha.multicampro.slave.services.SlaveAccessibilityService
import com.xuacha.multicampro.slave.utils.Constants
import com.xuacha.multicampro.slave.utils.Logger

/**
 * Actividad Principal de MultiCamPro Slave
 * Permite al usuario:
 * 1. Verificar que los permisos están habilitados
 * 2. Habilitar Servicio de Accesibilidad
 * 3. Ver estado de la conexión
 * 4. Seleccionar dispositivo controlador
 */
class MainActivity : AppCompatActivity() {
    
    private lateinit var statusTextView: TextView
    private lateinit var enableAccessibilityButton: Button
    private lateinit var statusButton: Button
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)
        
        initializeViews()
        Logger.log("MainActivity creada")
        
        // Verificar permisos al iniciar
        updateAccessibilityStatus()
    }
    
    override fun onResume() {
        super.onResume()
        updateAccessibilityStatus()
    }
    
    /**
     * Inicializa las vistas de la interfaz
     */
    private fun initializeViews() {
        statusTextView = findViewById(R.id.status_text_view)
        enableAccessibilityButton = findViewById(R.id.enable_accessibility_button)
        statusButton = findViewById(R.id.status_button)
        
        // Botón para habilitar Servicio de Accesibilidad
        enableAccessibilityButton.setOnClickListener {
            openAccessibilitySettings()
        }
        
        // Botón para ver estado
        statusButton.setOnClickListener {
            showDeviceStatus()
        }
    }
    
    /**
     * Actualiza el estado del Servicio de Accesibilidad
     */
    private fun updateAccessibilityStatus() {
        val isAccessibilityEnabled = isAccessibilityServiceEnabled()
        val isForegroundServiceRunning = isForegroundServiceRunning()
        
        val statusText = buildString {
            append("═══════════════════════════════\n")
            append("MultiCamPro Slave v${Constants.APP_VERSION}\n")
            append("═══════════════════════════════\n\n")
            append("Estado de Servicios:\n")
            append("🔐 Accesibilidad: ${if (isAccessibilityEnabled) "✓ ACTIVO" else "✗ INACTIVO"}\n")
            append("🎬 Primer Plano: ${if (isForegroundServiceRunning) "✓ ACTIVO" else "✗ INACTIVO"}\n")
            append("\n")
            
            if (!isAccessibilityEnabled) {
                append("⚠️  Necesitas habilitar el Servicio\n")
                append("de Accesibilidad para que la app\n")
                append("funcione correctamente.\n\n")
                append("Toca el botón de abajo para ir a\n")
                append("Configuración > Accesibilidad.\n")
            } else {
                append("✓ La app está lista para usar.\n")
                append("Espera conexión del controlador...\n")
            }
        }
        
        statusTextView.text = statusText
        enableAccessibilityButton.isEnabled = !isAccessibilityEnabled
    }
    
    /**
     * Abre la configuración de Accesibilidad
     */
    private fun openAccessibilitySettings() {
        Logger.log("Abriendo configuración de Accesibilidad")
        try {
            val intent = Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS)
            startActivity(intent)
        } catch (e: Exception) {
            Logger.error("Error abriendo configuración", e)
            statusTextView.text = "Error: No se pudo abrir configuración"
        }
    }
    
    /**
     * Muestra información del dispositivo y estado
     */
    private fun showDeviceStatus() {
        Logger.log("Mostrando estado del dispositivo")
        val statusText = buildString {
            append("═══════════════════════════════\n")
            append("Información del Dispositivo:\n")
            append("═══════════════════════════════\n\n")
            append("Fabricante: ${Build.MANUFACTURER}\n")
            append("Modelo: ${Build.MODEL}\n")
            append("Android: ${Build.VERSION.RELEASE}\n")
            append("API: ${Build.VERSION.SDK_INT}\n")
            append("Device ID: ${Settings.Secure.getString(contentResolver, Settings.Secure.ANDROID_ID)}\n")
            append("\n═══════════════════════════════\n")
            append("Estado de Servicios:\n")
            append("═══════════════════════════════\n\n")
            append("Accesibilidad: ${if (isAccessibilityServiceEnabled()) "✓" else "✗"}\n")
            append("Primer Plano: ${if (isForegroundServiceRunning()) "✓" else "✗"}\n")
        }
        statusTextView.text = statusText
    }
    
    /**
     * Verifica si el Servicio de Accesibilidad está habilitado
     */
    private fun isAccessibilityServiceEnabled(): Boolean {
        return try {
            val componentName = ComponentName(this, SlaveAccessibilityService::class.java)
            val enabledServices = Settings.Secure.getString(
                contentResolver,
                Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES
            )
            enabledServices?.contains(componentName.flattenToString()) ?: false
        } catch (e: Exception) {
            Logger.error("Error verificando Accesibilidad", e)
            false
        }
    }
    
    /**
     * Verifica si el servicio en primer plano está activo
     */
    private fun isForegroundServiceRunning(): Boolean {
        val activityManager = getSystemService(Context.ACTIVITY_SERVICE) as ActivityManager
        val runningServices = activityManager.getRunningServices(Integer.MAX_VALUE)
        return runningServices.any { service ->
            service.service.className == "com.xuacha.multicampro.slave.services.SlaveForegroundService"
        }
    }
}
