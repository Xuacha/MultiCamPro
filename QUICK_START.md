# 🚀 Quick Start - MultiCamPro Fase 5

## ⚡ Inicio Rápido (5 minutos)

### 1️⃣ Iniciar Servidor de Signalización

```bash
cd backend

# Si es la primera vez
npm install
cp .env.example .env

# Editar .env si es necesario (Firebase credentials)
# Luego:
npm start

# Esperado: 
# [timestamp] [INFO] Servidor escuchando en puerto 3000
# [timestamp] [INFO] Socket.io iniciado en http://0.0.0.0:3000
```

**✓ Done**: Servidor corriendo en `http://localhost:3000`

---

### 2️⃣ Conectar Aplicación React Native

```typescript
// En tu componente
import { useCommunication } from '@/hooks/useCommunication'

function MyApp() {
  const { connect, devices, isConnected } = useCommunication()

  useEffect(() => {
    connect(userId, deviceId, accessToken).catch(console.error)
  }, [])

  return (
    <View>
      <Text>{isConnected ? '✓ Conectado' : '✗ Desconectado'}</Text>
      <Text>Dispositivos: {devices.length}</Text>
    </View>
  )
}
```

**✓ Done**: App conectada al servidor

---

### 3️⃣ Enviar Primer Comando

```typescript
import { useSendCommand } from '@/hooks/useCommunication'

function CameraScreen({ deviceId }) {
  const { takePhoto, startVideo } = useSendCommand()

  const handleTakePhoto = async () => {
    try {
      const result = await takePhoto(deviceId)
      console.log('Photo result:', result)
    } catch (error) {
      console.error('Photo failed:', error)
    }
  }

  return <Button title="Tomar Foto" onPress={handleTakePhoto} />
}
```

**✓ Done**: Enviando comandos

---

## 🔌 Conectar Dispositivo Android

```bash
# 1. Compilar app esclava
cd android/slave-app
./gradlew assembleDebug

# 2. Instalar en dispositivo
adb install -r app/build/outputs/apk/debug/app-debug.apk

# 3. Iniciar servicio
adb shell am startservice com.xuacha.multicampro/.CommandReceiverService

# 4. Ver logs
adb logcat | grep COMMUNICATION
```

Esperado en logs:
```
[COMMUNICATION] ✓ Conectado al servidor
[COMMUNICATION] ✓ Dispositivo registrado
```

---

## 📊 Verificar Conectividad

### Terminal 1: Ver dispositivos conectados
```bash
curl http://localhost:3000/api/devices
```

Response:
```json
{
  "devices": [
    {
      "id": "slave-123",
      "model": "Pixel 6",
      "status": "CONNECTED",
      "battery": 85
    }
  ]
}
```

### Terminal 2: Ver server health
```bash
curl http://localhost:3000/health
```

Response:
```json
{
  "uptime": 1234,
  "timestamp": "2024-01-15T10:30:00Z"
}
```

---

## 🎮 Ejemplo Completo: Aplicación de Control

```typescript
import React, { useEffect } from 'react'
import { View, ScrollView, Button, Text } from 'react-native'
import { useCommunication, useSendCommand } from '@/hooks/useCommunication'

export function ControllerApp({ userId, accessToken }) {
  const { connect, devices, isConnected, sendCommand } = useCommunication()
  const { takePhoto, startVideo, stopVideo } = useSendCommand()

  useEffect(() => {
    // Conectar al servidor
    connect(userId, 'controller-' + userId, accessToken).catch(error => {
      console.error('Connection failed:', error)
    })
  }, [])

  const handleTakePhoto = async (deviceId) => {
    try {
      const result = await takePhoto(deviceId)
      console.log('✓ Foto capturada:', result.response)
    } catch (error) {
      console.error('✗ Error:', error.message)
    }
  }

  const handleStartVideo = async (deviceId) => {
    try {
      await startVideo(deviceId, 30) // 30 segundos
      console.log('✓ Grabación iniciada')
    } catch (error) {
      console.error('✗ Error:', error.message)
    }
  }

  return (
    <ScrollView>
      {/* Estado de Conexión */}
      <View style={{ padding: 16, backgroundColor: isConnected ? '#4CAF50' : '#f44336' }}>
        <Text style={{ color: 'white', fontSize: 16, fontWeight: 'bold' }}>
          {isConnected ? '✓ Conectado' : '✗ Desconectado'}
        </Text>
        <Text style={{ color: 'white' }}>Dispositivos: {devices.length}</Text>
      </View>

      {/* Lista de Dispositivos */}
      {devices.map((device) => (
        <View key={device.id} style={{ padding: 16, borderBottomWidth: 1 }}>
          <Text style={{ fontSize: 16, fontWeight: 'bold' }}>{device.model}</Text>
          <Text>Estado: {device.status}</Text>
          <Text>Batería: {device.battery}%</Text>
          <Text>Señal: {device.signal}/5</Text>

          {/* Controles */}
          <View style={{ marginTop: 12, gap: 8 }}>
            <Button 
              title="📸 Tomar Foto" 
              onPress={() => handleTakePhoto(device.id)}
              disabled={device.status !== 'CONNECTED'}
            />
            <Button 
              title="🎥 Grabar" 
              onPress={() => handleStartVideo(device.id)}
              disabled={device.status !== 'CONNECTED'}
            />
            <Button 
              title="⏹ Detener" 
              onPress={() => stopVideo(device.id)}
              disabled={device.status !== 'CONNECTED'}
            />
          </View>
        </View>
      ))}
    </ScrollView>
  )
}
```

---

## 🐛 Troubleshooting Rápido

### "Connection refused"
```bash
# Verificar servidor está corriendo
lsof -i :3000

# Si no, iniciar en /backend:
npm start
```

### "Device not found"
```bash
# Verificar en Android que se registró
adb logcat | grep "Dispositivo registrado"

# Verificar servidor lo ve
curl http://localhost:3000/api/devices
```

### "Command timeout"
```typescript
// Aumentar timeout (default 10s)
await sendCommand(deviceId, 'TAKE_PHOTO', {}, 15000)

// O usar versión asincrónica
sendCommandAsync(deviceId, 'TAKE_PHOTO')
```

---

## 📚 Documentación Detallada

- **[PHASE5_COMMUNICATION_GUIDE.md](./PHASE5_COMMUNICATION_GUIDE.md)** - Guía técnica completa
- **[PROGRESS.md](./PROGRESS.md)** - Estado del proyecto
- **[PHASE5_VALIDATION_CHECKLIST.md](./PHASE5_VALIDATION_CHECKLIST.md)** - Validación

---

## 🎯 Próximos Pasos

1. **Captura de Media** (Fase 6)
   ```typescript
   await sendCommand(deviceId, 'TAKE_PHOTO', { cameraId: 'front' })
   await sendCommand(deviceId, 'START_VIDEO', { duration: 30 })
   await sendCommand(deviceId, 'GET_LOCATION')
   ```

2. **Streaming RTMP** (Fase 7)
   ```typescript
   await sendCommand(deviceId, 'START_STREAM', { 
     rtmpUrl: 'rtmp://server/live', 
     quality: 'high'
   })
   ```

3. **Dashboard UI** (Fase 8)
   - Preview en tiempo real
   - Control multidispositivo
   - Historial de comandos

---

## 💡 Tips Útiles

### Monitorear servidor en tiempo real
```bash
tail -f logs/server.log | grep COMMUNICATION
```

### Depuración de eventos Socket.io
```typescript
// En React Native service
socket.on('*', (event, data) => {
  console.log(`[Socket.io] Event: ${event}`, data)
})
```

### Test de carga del servidor
```bash
# Necesita Apache Bench: apt install apache2-utils
ab -n 100 -c 10 http://localhost:3000/health
```

---

**¡Listo para comenzar! 🎉**

Si tienes preguntas, revisa la documentación completa en PHASE5_COMMUNICATION_GUIDE.md
