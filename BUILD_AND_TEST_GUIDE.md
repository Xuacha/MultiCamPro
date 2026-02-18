# GUÍA DE COMPILACIÓN Y TESTING - MultiCamPro

## 📦 Compilación de la App Esclava

### Método 1: Línea de Comandos (Recomendado)

```bash
# Navegar al directorio de la app esclava
cd android/slave-app

# Limpiar compilaciones previas
./gradlew clean

# Compilar APK de debug
./gradlew assembleDebug

# Output: app/build/outputs/apk/debug/slave-app-debug.apk

# Compilar APK de release (optimizado)
./gradlew assembleRelease

# Output: app/build/outputs/apk/release/slave-app-release.apk
```

### Método 2: Android Studio

```
1. File → Open
2. Navegar a: /path/to/MultiCamPro/android/slave-app
3. Android Studio abrirá como nuevo proyecto
4. Build → Build Bundle(s) / APK(s) → Build APK(s)
5. Esperar compilación
6. Haz clic en "Locate" para encontrar el APK
```

---

## 📱 Instalación en Dispositivos

### Opción 1: Instalación via ADB

```bash
# Asegúrate que el dispositivo esté conectado
adb devices

# Instalar APK
adb install app/build/outputs/apk/debug/slave-app-debug.apk

# Instalar APK de release
adb install app/build/outputs/apk/release/slave-app-release.apk

# Ver instalación
adb logcat | grep MultiCamPro

# Matar la app
adb shell am force-stop com.xuacha.multicampro.slave

# Iniciar la app
adb shell am start -n com.xuacha.multicampro.slave/.MainActivity
```

### Opción 2: Instalación via Google Play Console (después de testing)

```
1. Ir a Google Play Console
2. Crear aplicación nueva
3. Completar ficha de app
4. Subir APK de release firmado
5. Completar revisión de seguridad (ver GOOGLE_PLAY_SECURITY_STATEMENT.md)
6. Publicar en fase de testing cerrado
```

### Opción 3: Instalación Manual (desarrollo)

```bash
# Conectar dispositivo por USB
# Habilitar USB Debugging en teléfono
# Autorizar conexión en diálogo del teléfono

# Abrir explorador de archivos en PC
# Arrastrar y soltar APK en el almacenamiento del dispositivo
# En el dispositivo: Abrir archivo y instalar
```

---

## 🧪 Testing de la App Esclava

### Test 1: Verificar Instalación

```bash
adb shell pm list packages | grep multicampro
# Output: package:com.xuacha.multicampro.slave
```

### Test 2: Iniciar MainActivity

```bash
adb shell am start -n com.xuacha.multicampro.slave/.MainActivity

# Verificar que se abre la app
# Pantalla debe mostrar: "MultiCamPro Slave v1.0.0"
# Botón: "Habilitar Accesibilidad"
```

### Test 3: Habilitar Accessibilidad

```
MANUAL EN DISPOSITIVO:
1. Abrir app MultiCamPro Slave
2. Tocar botón "Habilitar Accesibilidad"
3. Settings se abre → Accesibilidad
4. Buscar "MultiCamPro"
5. Activar el toggle
6. Confirmar advertencia
7. Volver a app → Verás "✓ Accesibilidad: ACTIVO"
```

### Test 4: Verificar Servicio en Primer Plano

```bash
# Debe haber una notificación persistente (punto gris mínimal)
# En la pantalla del dispositivo, buscar en la barra de notificaciones

# Verificar via logs
adb logcat | grep "SlaveForegroundService\|MultiCamPro"

# Output esperado:
# SlaveForegroundService creado
# Notificación iniciada
```

### Test 5: Verificar Auto-Reinicio

```bash
# Apagar el dispositivo
adb shell reboot

# Esperar a que reinicie (2-3 min)

# Verificar que la app se inició automáticamente
adb shell pm dump com.xuacha.multicampro.slave | grep "receiver"

# O ver manualmente en el dispositivo: buscar notificación de MultiCamPro
```

### Test 6: Verificar Logging

```bash
# Ver logs en tiempo real
adb logcat | grep "MultiCamPro-Slave"

# Extraer archivo de logs del dispositivo
adb pull /storage/emulated/0/Android/data/com.xuacha.multicampro.slave/files/MultiCamPro/logs/

# Abrir con editor de texto
cat logs/multicampro_*.log | tail -100
```

---

## 🔌 Testing de Comunicación (Próxima Fase)

### Cuando se implementen los servicios WebSocket:

```bash
# Terminal 1: Iniciar servidor Node.js
cd backend
npm install
npm start
# Output: "Servidor escuchando en puerto 3000"

# Terminal 2: Ver logs de servidor
tail -f server.log

# Terminal 3: Iniciar app esclava
adb logcat | grep "WebSocket\|Conectando al servidor"

# Esperar a ver:
# "Conectando al servidor de señalización..."
# "✓ Conectado al servidor de señalización"
```

---

## 📊 Compilación Troubleshooting

### Error: `Gradle plugin not found`

```bash
# Solución 1: Limpiar y reconstruir
./gradlew clean
./gradlew assembleDebug

# Solución 2: Actualizar plugins
./gradlew wrapper --gradle-version 8.0
```

### Error: `SDK not found`

```bash
# Asegúrate que tienes SDK 34 instalado
# Android Studio → Tools → SDK Manager

# O actualizar el target en build.gradle:
android {
    compileSdk 34
    targetSdk 34
}
```

### Error: `Permission denied` en build

```bash
# Dar permisos al script gradlew
chmod +x android/slave-app/gradlew

# Reintentar compilación
./gradlew assembleDebug
```

### Error: `Symbol not found` para clases Kotlin

```bash
# Este proyecto necesita Kotlin compilado
# Asegúrate que tienes instalado:
# - Android SDK 21+
# - Kotlin compiler 1.9+

# En build.gradle, verifica:
kotlin {
    jvmTarget = '11'
}

compileOptions {
    sourceCompatibility JavaVersion.VERSION_11
    targetCompatibility JavaVersion.VERSION_11
}
```

---

## 📝 APK Signing para Release

### Crear keystore (primera vez)

```bash
keytool -genkey -v -keystore multicampro.keystore \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -alias multicampro-key

# Te pedirá contraseña y datos personales
# Guardar el .keystore en lugar seguro
```

### Firmar APK para Google Play

```bash
# Actualizar build.gradle con configuración de firma
vim android/slave-app/build.gradle

# Agregar:
# signingConfigs {
#     release {
#         keyStore file("../../multicampro.keystore")
#         keyStorePassword "tu_password"
#         keyAlias "multicampro-key"
#         keyPassword "tu_password"
#     }
# }

# Compilar APK firmado
./gradlew assembleRelease --stacktrace

# Output: app/build/outputs/apk/release/slave-app-release.apk
```

---

## 🚀 Testing en Múltiples Dispositivos

### Setup de Prueba Completa (Simulación)

```bash
# DISPOSITIVO 1 (Esclavo A)
adb -s device1_serial install slave-app-debug.apk
adb -s device1_serial shell am start -n com.xuacha.multicampro.slave/.MainActivity

# DISPOSITIVO 2 (Esclavo B)
adb -s device2_serial install slave-app-debug.apk
adb -s device2_serial shell am start -n com.xuacha.multicampro.slave/.MainActivity

# PC (Controlador)
npm start
# Escanear QR en emulador/dispositivo con Expo Go
# Iniciar sesión con Firebase
# Ver dispositivos conectados en lista
```

---

## 📈 Métricas de Build

```bash
# Ver tamaño del APK
ls -lh app/build/outputs/apk/debug/slave-app-debug.apk

# Ver detalles del APK
aapt dump badging apk/debug/slave-app-debug.apk | grep -E "package:|version"

# Optimizar tamaño (release)
./gradlew assembleRelease -x lint
# ProGuard automaticamente minifica y ofusca el código
```

---

## ✅ Checklist de Testing

- [ ] Compilación exitosa sin errores
- [ ] APK instalable en dispositivo Android 5.0+
- [ ] MainActivity se abre correctamente
- [ ] Botón "Habilitar Accesibilidad" funciona
- [ ] Accessibility Settings se abre
- [ ] Servicio de Accesibilidad se puede habilitar
- [ ] Notificación persistente visible (punto minimal)
- [ ] Servicio sobrevive después de cerrar app
- [ ] App se reinicia automáticamente después de reboot
- [ ] Logs se generan correctamente
- [ ] Firebase Authentication funciona
- [ ] WebSocket se conecta al servidor (futura fase)
- [ ] Comandos se envían correctamente (futura fase)
- [ ] APK de release compila sin errores
- [ ] Release APK es menor a 50MB (con ProGuard)

---

## 🔗 Enlaces Útiles

- [Android Gradle Plugin](https://developer.android.com/studio/releases/gradle-plugin)
- [Kotlin Compiler](https://kotlinlang.org)
- [AccessibilityService API](https://developer.android.com/reference/android/accessibilityservice/AccessibilityService)
- [Android Security & Privacy](https://developer.android.com/privacy-and-security)

---

**Última actualización:** Febrero 2026
