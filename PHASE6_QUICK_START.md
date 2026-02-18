# 🚀 Quick Start - Fase 6: Media Capture

## ⚡ Inicio Rápido (10 minutos)

### 1️⃣ Verificar que Fase 5 está corriendo

```bash
# Terminal 1: Backend server
cd backend && npm start

# Resultado esperado:
# [INFO] Servidor escuchando en puerto 3000
# [INFO] Socket.io iniciado
```

---

### 2️⃣ Conectar Dispositivo Android

```bash
# Terminal 2: Deploy APK
cd android/slave-app
./gradlew assembleDebug
adb install -r app/build/outputs/apk/debug/app-debug.apk

# Terminal 3: Ver logs
adb logcat | grep -i "communication\|camera\|location\|audio"
```

**Verificar en logs:**
```
[COMMUNICATION] ✓ Conectado al servidor
[COMMUNICATION] ✓ Dispositivo registrado
```

---

### 3️⃣ Usar en React Native

```typescript
import { useSendCommand } from '@/hooks/useCommunication'

export function MediaScreen({ deviceId }) {
  const { takePhoto, startVideo, stopVideo, getLocation } = useSendCommand()

  // Tomar foto
  const handlePhoto = async () => {
    try {
      const result = await takePhoto(deviceId)
      console.log('✓ Foto:', result.response.imageUrl)
    } catch (error) {
      console.error('✗ Error:', error)
    }
  }

  // Grabar video
  const handleVideo = async () => {
    try {
      const startResult = await startVideo(deviceId, 10)  // 10 segundos
      console.log('✓ Grabando:', startResult.response.sessionId)
      
      setTimeout(async () => {
        const stopResult = await stopVideo(deviceId)
        console.log('✓ Video guardado:', stopResult.response.videoUrl)
      }, 10000)
    } catch (error) {
      console.error('✗ Error:', error)
    }
  }

  // Obtener ubicación
  const handleLocation = async () => {
    try {
      const result = await getLocation(deviceId)
      const { latitude, longitude, accuracy } = result.response
      console.log(`✓ Ubicación: ${latitude}, ${longitude} (±${accuracy}m)`)
    } catch (error) {
      console.error('✗ Error:', error)
    }
  }

  return (
    <View>
      <Button title="📸 Foto" onPress={handlePhoto} />
      <Button title="🎥 Video" onPress={handleVideo} />
      <Button title="📍 Ubicación" onPress={handleLocation} />
    </View>
  )
}
```

---

## 🎯 Ejemplos Prácticos

### Caso 1: Captura Rápida de Fotos

```typescript
const { takePhoto } = useSendCommand()

const captureMultiplePhotos = async (deviceId: string, count: number) => {
  for (let i = 0; i < count; i++) {
    try {
      const result = await takePhoto(deviceId)
      console.log(`✓ Foto ${i + 1}: ${result.response.imageUrl}`)
    } catch (error) {
      console.error(`✗ Foto ${i + 1} falló:`, error)
    }
  }
}

// Usar
await captureMultiplePhotos(deviceId, 5)  // 5 fotos
```

### Caso 2: Video Con Múltiples Calidades

```typescript
const { startVideo, stopVideo } = useSendCommand()

const captureVideoInQuality = async (
  deviceId: string,
  quality: 'low' | 'medium' | 'high',
  duration: number
) => {
  try {
    const startResult = await startVideo(deviceId, duration, quality)
    console.log(`✓ Grabando ${quality}...`)
    
    await new Promise(resolve => setTimeout(resolve, duration * 1000))
    
    const stopResult = await stopVideo(deviceId)
    console.log(`✓ Video ${quality} guardado`)
    
    return stopResult.response.videoUrl
  } catch (error) {
    console.error(`✗ Error en calidad ${quality}:`, error)
  }
}

// Usar
const videos = await Promise.all([
  captureVideoInQuality(deviceId, 'low', 10),
  captureVideoInQuality(deviceId, 'medium', 10),
  captureVideoInQuality(deviceId, 'high', 10),
])
```

### Caso 3: Tracking de Ubicación en Vivo

```typescript
const { getLocation } = useSendCommand()

const trackLocation = async (deviceId: string, intervalMs = 5000) => {
  const locations: any[] = []
  
  const timer = setInterval(async () => {
    try {
      const result = await getLocation(deviceId)
      const loc = result.response
      
      locations.push({
        latitude: loc.latitude,
        longitude: loc.longitude,
        timestamp: loc.timestamp,
        accuracy: loc.accuracy
      })
      
      console.log(`📍 ${loc.latitude}, ${loc.longitude}`)
    } catch (error) {
      console.error('✗ Error:', error)
    }
  }, intervalMs)
  
  // Detener después de 60 segundos
  setTimeout(() => {
    clearInterval(timer)
    console.log(`✓ Tracking completado: ${locations.length} puntos`)
  }, 60000)
  
  return locations
}

// Usar
const route = await trackLocation(deviceId, 5000)
```

---

## 🧪 Verificación Rápida

### Endpoint: GET /api/devices
```bash
curl http://localhost:3000/api/devices

# Response
{
  "devices": [
    {
      "id": "slave-123",
      "status": "CONNECTED",
      "battery": 85,
      "capabilities": ["CAMERA", "VIDEO", "AUDIO", "GPS"]
    }
  ]
}
```

### Test de Foto
```bash
# Terminal con Node.js
const { io } = require('socket.io-client')

const socket = io('http://localhost:3000')

socket.on('connect', () => {
  socket.emit('send-command', {
    targetDeviceId: 'slave-123',
    commandId: 'test-photo-001',
    commandType: 'TAKE_PHOTO',
    controllerUid: 'test-user'
  })
})

socket.on('command-result', (data) => {
  console.log('✓ Response:', data)
})
```

---

## 🔧 Configuración

### build.gradle (Android)
```gradle
dependencies {
    // Play Services Location (ya incluido)
    implementation 'com.google.android.gms:play-services-location:21.0.1'
    
    // Si necesitas actualizar:
    // implementation 'androidx.camera:camera-core:1.3.0'
}
```

### AndroidManifest.xml
```xml
<!-- Permisos (ya deberían estar) -->
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.RECORD_AUDIO" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
```

---

## 📊 Monitoreo en Tiempo Real

### Ver respuestas de comandos
```bash
# Terminal
tail -f logs/server.log | grep "command-result"

# Output
[COMMAND] ✓ TAKE_PHOTO ejecutado en slave-123
[COMMAND] ⏱️ responseTime: 1234ms
```

### Monitorear batería del dispositivo
```bash
adb shell dumpsys battery | grep level

# Luego enviar GET_BATTERY
curl -X POST http://localhost:3000/api/commands \
  -H "Content-Type: application/json" \
  -d '{
    "deviceId": "slave-123",
    "commandType": "GET_BATTERY"
  }'
```

---

## 🐛 Troubleshooting Rápido

### "Camera permission not granted"
```bash
# Verificar permisos
adb shell pm list permissions | grep camera

# Otorgar permisos
adb shell pm grant com.xuacha.multicampro android.permission.CAMERA
adb shell pm grant com.xuacha.multicampro android.permission.RECORD_AUDIO
```

### "Location timeout"
```bash
# Habilitar GPS en emulador
# En Android Studio → Extended controls → Location → Enabled

# O en dispositivo físico:
adb shell settings put secure location_mode 3  # High accuracy
```

### "File not found after capture"
```kotlin
// Verificar que los directorios existen
adb shell mkdir -p /sdcard/Android/data/com.xuacha.multicampro/files/photos
adb shell mkdir -p /sdcard/Android/data/com.xuacha.multicampro/files/videos
adb shell mkdir -p /sdcard/Android/data/com.xuacha.multicampro/files/audio
```

---

## 📚 Documentación Completa

Para más detalles, ver:
- **[PHASE6_MEDIA_CAPTURE_GUIDE.md](./PHASE6_MEDIA_CAPTURE_GUIDE.md)** - Guía técnica completa
- **[PHASE5_COMMUNICATION_GUIDE.md](./PHASE5_COMMUNICATION_GUIDE.md)** - Comunicación WebRTC
- **[QUICK_START.md](./QUICK_START.md)** - Inicio rápido Fase 5

---

## 🎯 Próximos Pasos

1. **Fase 7: RTMP Streaming** (Próxima)
   ```typescript
   await startStream(deviceId, {
     rtmpUrl: 'rtmp://server/live',
     quality: 'high'
   })
   ```

2. **Fase 8: Controller UI**
   - Dashboard de dispositivos
   - Preview en tiempo real
   - Recording controls

---

**¡Listo para capturar contenido! 🎬**

Si tienes preguntas, revisa la documentación completa en [PHASE6_MEDIA_CAPTURE_GUIDE.md](./PHASE6_MEDIA_CAPTURE_GUIDE.md)
