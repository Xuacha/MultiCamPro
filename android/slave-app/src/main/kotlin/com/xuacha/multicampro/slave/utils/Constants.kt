package com.xuacha.multicampro.slave.utils

/**
 * Constantes globales para la app esclava MultiCamPro
 * Configuración, puertos, URLs y valores por defecto
 */
object Constants {
    
    // ========== INFORMACIÓN DE LA APP ==========
    const val APP_NAME = "MultiCamPro Slave"
    const val APP_VERSION = "1.0.0"
    const val PACKAGE_NAME = "com.xuacha.multicampro.slave"
    
    // ========== SERVIDOR DE SIGNALS ==========
    // En producción, cambiar a servidor real
    const val SIGNALING_SERVER_URL = "http://10.0.2.2:3000"  // Emulador: localhost
    // const val SIGNALING_SERVER_URL = "http://192.168.1.100:3000"  // WiFi: cambiar IP
    // const val SIGNALING_SERVER_URL = "http://api.multicampro.com:3000"  // Producción
    const val SIGNALING_SERVER_PORT = 3000
    const val SOCKET_NAMESPACE = "/signals"
    
    // ========== WEBSOCKET ==========
    const val SOCKET_RECONNECT_DELAY = 5000  // 5 segundos
    const val SOCKET_RECONNECT_DELAY_MAX = 30000  // 30 segundos
    const val SOCKET_RECONNECT_ATTEMPTS = 10
    const val SOCKET_PING_INTERVAL = 25000  // 25 segundos
    const val SOCKET_PING_TIMEOUT = 60000  // 60 segundos
    
    // ========== CÓDIGOS DE COMANDOS ==========
    const val COMMAND_TAKE_PHOTO = "TAKE_PHOTO"
    const val COMMAND_START_VIDEO = "START_VIDEO"
    const val COMMAND_STOP_VIDEO = "STOP_VIDEO"
    const val COMMAND_START_STREAM = "START_STREAM"
    const val COMMAND_STOP_STREAM = "STOP_STREAM"
    const val COMMAND_GET_BATTERY = "GET_BATTERY"
    const val COMMAND_GET_LOCATION = "GET_LOCATION"
    const val COMMAND_TOGGLE_FLASHLIGHT = "TOGGLE_FLASHLIGHT"
    const val COMMAND_GET_DEVICE_INFO = "GET_DEVICE_INFO"
    const val COMMAND_SHUTDOWN = "SHUTDOWN"
    
    // ========== NOTIFICACIÓN ==========
    const val NOTIFICATION_CHANNEL_ID = "multicampro_slave_channel"
    const val NOTIFICATION_CHANNEL_NAME = "MultiCamPro Slave"
    const val NOTIFICATION_ID = 1
    // Notificación minimalist: punto gris de 1x1 pixel
    const val NOTIFICATION_TEXT = "MultiCamPro activo"
    const val NOTIFICATION_SMALL_ICON_SIZE = 1  // 1px
    
    // ========== PREFERENCIAS COMPARTIDAS ==========
    const val PREFS_NAME = "multicampro_slave_prefs"
    const val PREF_KEY_DEVICE_ID = "device_id"
    const val PREF_KEY_ACCESS_TOKEN = "access_token"
    const val PREF_KEY_OWNER_UID = "owner_uid"
    const val PREF_KEY_IS_ENABLED = "is_enabled"
    
    // ========== ALMACENAMIENTO ==========
    const val PHOTOS_DIRECTORY = "MultiCamPro/photos"
    const val VIDEOS_DIRECTORY = "MultiCamPro/videos"
    const val LOGS_DIRECTORY = "MultiCamPro/logs"
    
    // ========== CONFIGURACIÓN DE VIDEO ==========
    const val VIDEO_WIDTH = 1280
    const val VIDEO_HEIGHT = 720
    const val VIDEO_FPS = 30
    const val VIDEO_BITRATE = 2500000  // 2.5 Mbps
    
    // ========== CONFIGURACIÓN DE GPS ==========
    const val LOCATION_UPDATE_INTERVAL = 5000  // 5 segundos
    const val LOCATION_FASTEST_UPDATE_INTERVAL = 2000  // 2 segundos
    const val LOCATION_PRIORITY = "HIGH_ACCURACY"
    
    // ========== UMBRALES ==========
    const val BATTERY_LOW_THRESHOLD = 20  // Alertar si batería < 20%
    const val BATTERY_CRITICAL_THRESHOLD = 5  // Crítica < 5%
    const val CONNECTION_TIMEOUT_MS = 30000  // 30 segundos
    const val COMMAND_QUEUE_MAX_SIZE = 100
    
    // ========== INTENTS Y ACCIONES ==========
    const val ACTION_COMMAND = "com.xuacha.multicampro.COMMAND_ACTION"
    const val ACTION_STATUS_UPDATE = "com.xuacha.multicampro.STATUS_UPDATE"
    const val EXTRA_COMMAND_TYPE = "command_type"
    const val EXTRA_COMMAND_DATA = "command_data"
}
