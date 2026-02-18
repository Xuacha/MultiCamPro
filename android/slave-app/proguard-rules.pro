# Reglas ProGuard para MultiCamPro Slave

# Mantener clases de la app
-keep class com.xuacha.multicampro.slave.** { *; }

# Mantener servicios
-keep class com.xuacha.multicampro.slave.services.** { *; }
-keep class com.xuacha.multicampro.slave.receivers.** { *; }

# Mantener métodos públicos de actividades
-keep public class com.xuacha.multicampro.slave.MainActivity {
    public <init>();
    public void onCreate(android.os.Bundle);
}

# Mantener clases que con AccessibilityService
-keep class * extends android.accessibilityservice.AccessibilityService { *; }

# Mantener clases de broadcast receiver
-keep class * extends android.content.BroadcastReceiver { *; }

# Mantener servicios
-keep class * extends android.app.Service { *; }

# Firebase
-keep class com.google.firebase.** { *; }
-keep interface com.google.firebase.** { *; }

# Gson
-keep class com.google.gson.** { *; }
-keep class * with { java.lang.annotations.Annotation *; }

# Kotlin
-keep class kotlin.** { *; }
-keep interface kotlin.** { *; }

# OkHttp
-dontwarn okhttp3.**
-keep class okhttp3.** { *; }

# Eventos de accesibilidad
-keep class android.view.accessibility.AccessibilityEvent { *; }

# Desactivar optimizaciones agresivas que pueden romper la funcionalidad
-optimizationpasses 1
-dontoptimize
