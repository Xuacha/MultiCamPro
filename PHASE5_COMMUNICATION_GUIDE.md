# Guía Completa - Fase 5: Comunicación WebRTC/Señalización

## 📋 Índice
1. [Visión General](#visión-general)
2. [Arquitectura](#arquitectura)
3. [Instalación](#instalación)
4. [Uso](#uso)
5. [API Reference](#api-reference)
6. [Troubleshooting](#troubleshooting)

---

## 🎯 Visión General

### ¿Qué es esta Fase?

La Fase 5 implementa la infraestructura de comunicación en tiempo real entre:
- **Servidor de Señalización**: Node.js + Socket.io (central hub)
- **Dispositivos Esclavos**: Android (ejecutan comandos)
- **Controladores**: React Native (envían comandos)

### Características Principales

✅ **Comunicación en tiempo real** vía WebSocket  
✅ **Persistencia de comandos** para dispositivos offline  
✅ **Ownership-based access control** (cada usuario solo ve sus dispositivos)  
✅ **Reconnection automática** con exponential backoff  
✅ **Type safety** con TypeScript  
✅ **Production-ready** con logging y error handling  

---

## 🏗️ Arquitectura

### Flujo de Comandos

```
┌─────────────────────────────────────────────────────────┐
│ CONTROLADOR (React Native)                              │
│  - useCommunication() hook                              │
│  - sendCommand(deviceId, commandType)                   │
└─────────────────┬───────────────────────────────────────┘
                  │ WebSocket (Socket.io)
                  │
┌─────────────────▼───────────────────────────────────────┐
│ SERVIDOR DE SEÑALIZACIÓN (Node.js)                      │
│  - Valida propiedad del dispositivo                      │
│  - Enruta comando al esclavo                             │
│  - Encola si está offline                               │
└─────────────────┬───────────────────────────────────────┘
                  │ WebSocket
                  │
┌─────────────────▼───────────────────────────────────────┐
│ DISPOSITIVO ESCLAVO (Android)                            │
│  - Recibe comando                                        │
│  - Ejecuta handler (tomar foto, video, etc)             │
│  - Envía respuesta                                       │
└─────────────────┬───────────────────────────────────────┘
                  │ WebSocket
                  │
┌─────────────────▼───────────────────────────────────────┐
│ CONTROLADOR - Recibe Resultado                          │
│  - Procesa respuesta                                     │
│  - Actualiza UI                                          │
└─────────────────────────────────────────────────────────┘
```

### Componentes

#### 1. Backend Server (`backend/src/server.js`)
- Socket.io server con manejo de dispositivos
- Device registry con Maps en memoria
- Command queues para offline resilience
- REST API para health check y diagnostics

**Eventos Socket.io:**
- `register-slave`: Registrar dispositivo esclavo
- `register-controller`: Registrar controlador
- `send-command`: Enviar comando a esclavo
- `command-response`: Respuesta de esclavo
- `update-status`: Actualización de estado
- `disconnect`: Limpiar recursos

#### 2. Android WebSocket Client (`android/slave-app/.../WebSocketClient.kt`)
- Socket.io client en Kotlin
- Auto-reconnect con backoff exponencial
- Event listeners para 8+ tipos de eventos
- Command response sending

#### 3. React Native Service (`src/services/deviceCommunication.ts`)
- Socket.io client en TypeScript
- Connection management y reconnection
- Event listener registry
- Command sending con timeout

#### 4. React Hook (`src/hooks/useCommunication.ts`)
- `useCommunication()`: Hook principal
- `useSendCommand()`: Hook especializado para comandos
- State management (devices, connection, errors)
- Event listener management

---

## 🚀 Instalación

### Backend Server

```bash
# 1. Instalar dependencias
cd backend
npm install

# 2. Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales de Firebase

# 3. Iniciar servidor
npm start
# O para desarrollo con auto-reload:
npm run dev
```

### Android Slave App

```kotlin
// 1. Agregar dependencia en build.gradle (ya hecho)
// io.socket:socket.io-client:4.5.4

// 2. Iniciar servicio en MainApplication.onCreate()
startForegroundService(Intent(this, CommandReceiverService::class.java))

// 3. El servicio maneja conexión automáticamente
```

### React Native Controller

```bash
# Las dependencias ya están en package.json
npm install

# El hook se usa directamente en componentes:
import { useCommunication } from '@/hooks/useCommunication'
```

---

## 💻 Uso

### Conectar Controlador

```typescript
import { useCommunication } from '@/hooks/useCommunication'

export function ControllerScreen() {
  const { connect, sendCommand, devices, isConnected } = useCommunication()

  useEffect(() => {
    // Conectar después del login
    const handleConnect = async () => {
      try {
        await connect(
          userId,        // De Firebase Auth
          controllerId,  // ID único del dispositivo
          accessToken    // Token JWT/Firebase
        )
      } catch (error) {
        console.error('Connection failed:', error)
      }
    }

    handleConnect()
  }, [])

  return (
    <View>
      <Text>{isConnected ? '✓ Conectado' : '✗ Desconectado'}</Text>
      {devices.map(d => (
        <DeviceItem key={d.id} device={d} onCommand={sendCommand} />
      ))}
    </View>
  )
}
```

### Enviar Comando

```typescript
import { useSendCommand } from '@/hooks/useCommunication'

export function CameraControl({ deviceId }) {
  const { takePhoto, startVideo, stopVideo } = useSendCommand()

  const handleTakePhoto = async () => {
    try {
      const result = await takePhoto(deviceId)
      console.log('Photo saved:', result.response.imageUrl)
    } catch (error) {
      console.error('Failed to take photo:', error)
    }
  }

  return (
    <View>
      <Button title="📸 Tomar Foto" onPress={handleTakePhoto} />
      <Button title="🎥 Grabar" onPress={() => startVideo(deviceId)} />
      <Button title="⏹ Detener" onPress={() => stopVideo(deviceId)} />
    </View>
  )
}
```

### Estado de Dispositivos

```typescript
export function DeviceStatus({ deviceId }) {
  const { devices } = useCommunication()
  
  const device = devices.find(d => d.id === deviceId)

  return (
    <View>
      <Text>Estado: {device?.status}</Text>
      <Text>Batería: {device?.battery}%</Text>
      <Text>Señal: {device?.signal}/5</Text>
      <Text>Última conexión: {device?.lastSeen}</Text>
    </View>
  )
}
```

---

## 📖 API Reference

### Tipos TypeScript

```typescript
// SlaveDeviceInfo
interface SlaveDeviceInfo {
  id: string
  type: 'slave'
  model: string
  platform: string
  osVersion: string
  battery: number      // 0-100
  signal: number       // 0-5
  capabilities: string[] // ['CAMERA', 'VIDEO', 'AUDIO', 'GPS']
  status: 'CONNECTED' | 'DISCONNECTED' | 'BUSY'
  lastSeen: string     // ISO 8601
}

// CommandType
type CommandType =
  | 'TAKE_PHOTO'
  | 'START_VIDEO'
  | 'STOP_VIDEO'
  | 'START_STREAM'
  | 'STOP_STREAM'
  | 'GET_BATTERY'
  | 'GET_LOCATION'
  | 'TOGGLE_FLASHLIGHT'
  | 'GET_DEVICE_INFO'
  | 'RESTART_APP'

// CommandResponse
interface CommandResponse {
  commandId: string
  response?: any    // Resultado de comando
  error?: string    // Mensaje de error si falló
}
```

### Server Events (Socket.io)

```javascript
// CLIENT → SERVER

// Registrar dispositivo esclavo
socket.emit('register-slave', {
  deviceId: 'slave-123',
  ownerUid: 'user-456',
  model: 'Pixel 6',
  osVersion: '13',
  capabilities: ['CAMERA', 'VIDEO']
})

// Registrar controlador
socket.emit('register-controller', {
  controllerId: 'ctrl-789',
  ownerUid: 'user-456',
  platform: 'react-native'
})

// Enviar comando
socket.emit('send-command', {
  targetDeviceId: 'slave-123',
  commandId: 'cmd-001',
  commandType: 'TAKE_PHOTO',
  commandData: { cameraId: 'back' }
})

// Respuesta de comando
socket.emit('command-response', {
  commandId: 'cmd-001',
  response: { imageUrl: '...' }
})

// Actualizar estado
socket.emit('update-status', {
  deviceId: 'slave-123',
  status: 'CONNECTED',
  battery: 85,
  signal: 4
})

// SERVER → CLIENT

// Destino: Esclavo - Comando remoto
socket.on('remote-command', (data) => {
  // { commandId, commandType, commandData }
})

// Destino: Controlador - Resultado de comando
socket.on('command-result', (data) => {
  // { commandId, targetDeviceId, response, error }
})

// Lista de dispositivos actualizada
socket.on('device-list-updated', (data) => {
  // { devices: SlaveDeviceInfo[] }
})

// Dispositivo conectado
socket.on('device-connected', (device) => {
  // SlaveDeviceInfo
})

// Dispositivo desconectado
socket.on('device-disconnected', (data) => {
  // { deviceId }
})
```

### REST API

```bash
# Health Check
GET /health
Response: { uptime: number, timestamp: string }

# Obtener lista de dispositivos
GET /api/devices?userId=user-456
Response: { devices: SlaveDeviceInfo[] }

# Obtener info de dispositivo
GET /api/devices/slave-123
Response: SlaveDeviceInfo

# Estadísticas del servidor
GET /api/stats
Response: {
  totalDevices: number,
  totalUsers: number,
  connectedDevices: number
}
```

---

## 🔧 Troubleshooting

### Problema: "Connection refused"

**Causa posible:** Servidor no está corriendo

**Solución:**
```bash
# 1. Verificar que servidor esté activo
lsof -i :3000

# 2. Si no está corriendo, iniciar
cd backend && npm start

# 3. Verificar health check
curl http://localhost:3000/health
```

### Problema: "Device not found for user"

**Causa posible:** El dispositivo no está registrado

**Solución:**
```kotlin
// En Android, verificar que el servicio inicia:
// 1. Revisar logcat
adb logcat | grep COMMUNICATION

// 2. Verificar que el token es válido
// 3. Confirmar que ownerUid es correcto
```

### Problema: "Command timeout"

**Causa posible:** Dispositivo está offline u muy ocupado

**Solución:**
```typescript
// 1. Aumentar timeout
const result = await sendCommand(
  deviceId,
  'TAKE_PHOTO',
  {},
  15000  // 15 segundos en lugar de 10
)

// 2. Usar versión asincrónica que no espera
sendCommandAsync(deviceId, 'TAKE_PHOTO')

// 3. Verificar estado del dispositivo
const device = devices.find(d => d.id === deviceId)
console.log(`Device status: ${device?.status}`)
```

### Problema: "Not connected to server"

**Causa posible:** Falta de token o credenciales inválidas

**Solución:**
```typescript
// Asegurarse de que el token es válido
const { connect } = useCommunication()

// Usar JWT o Firebase token válido
const token = await firebaseAuth.currentUser.getIdToken(true)

await connect(userId, controllerId, token)
```

---

## 📊 Monitoreo

### Server Stats

```javascript
// Endpoint de estadísticas
fetch('http://localhost:3000/api/stats')
  .then(r => r.json())
  .then(stats => {
    console.log(`Total devices: ${stats.totalDevices}`)
    console.log(`Total users: ${stats.totalUsers}`)
    console.log(`Connected: ${stats.connectedDevices}`)
  })
```

### Logs

```bash
# Seguir logs en tiempo real
tail -f logs/server.log

# Filtrar por nivel
grep "ERROR" logs/server.log

# Filtrar por dispositivo
grep "slave-123" logs/server.log
```

---

## 🔐 Seguridad

### Validación de Propiedad

Cada comando verifica que el usuario sea dueño del dispositivo:

```javascript
// En servidor
socket.on('send-command', (data) => {
  // Verificar que controllerUid == ownerUid del dispositivo
  const device = connectedDevices.get(data.targetDeviceId)
  if (device.ownerUid !== data.controllerUid) {
    socket.emit('error', 'Unauthorized')
    return
  }
  // ... procesar comando
})
```

### Token Validation

Los tokens se validan en:
1. **Socket.io**: Middleware en handshake
2. **REST API**: Header `Authorization`
3. **Android**: Token guardado en SharedPreferences (encriptado)

---

## 📚 Próximos Pasos

1. **Fase 6**: Implementar captura de media
   - CameraManager.takePhoto()
   - LocationManager.startTracking()
   - AudioService.startCapture()

2. **Fase 7**: Streaming RTMP
   - Publish a Wowza/RTMP server
   - Bitrate adaptation
   - Network optimization

3. **Fase 8**: UI Controller
   - Dashboard de dispositivos
   - Real-time preview
   - Command history

---

**Última actualización:** 2024  
**Estatus:** Production Ready - Fase 5 Completa ✅
