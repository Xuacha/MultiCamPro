# MultiCamPro

**App de gestión multi dispositivos para la creación de contenido audiovisual**

---

## 🚀 ¿Listo para Lanzar a Producción?

**Si quieres instalar y testear la app ahora mismo:**

👉 **Lee primero**: [START_HERE.md](./START_HERE.md) (2 minutos)

Luego ejecuta uno de estos:
```bash
# Opción 1: Menú interactivo
bash launch-production.sh

# Opción 2: Testing rápido (Expo Go)
npm start

# Opción 3: Build APK completo
eas build --platform android --profile preview
```

**Documentación de Lanzamiento:**
- 📖 [LAUNCH_GUIDE_QUICK_START.md](./LAUNCH_GUIDE_QUICK_START.md) - Guía completa
- 📦 [BUILD_APK_GUIDE.md](./BUILD_APK_GUIDE.md) - Paso 1: Compilación
- 📱 [TESTING_DEVICE_GUIDE.md](./TESTING_DEVICE_GUIDE.md) - Paso 2: Testing (150+ checklist)
- 🚀 [BACKEND_DEPLOYMENT_STEP3.md](./BACKEND_DEPLOYMENT_STEP3.md) - Paso 3: Backend
- ✨ [PROJECT_STATUS.md](./PROJECT_STATUS.md) - Estado actual

---

## Descripción

MultiCamPro es una aplicación multiplataforma (móvil y web) diseñada para facilitar la gestión, captura y coordinación de dispositivos múltiples en la creación de contenido audiovisual profesional. Con soporte para Android, iOS y navegadores web desde una única base de código.

## Tecnologías

- **Framework**: React Native + Expo
- **Lenguaje**: TypeScript
- **Backend**: Firebase (Firestore/Realtime Database)
- **Plataformas**: Android, iOS, Web
- **Navigation**: React Navigation
- **State Management**: Zustand
- **Networking**: Axios + Firebase SDK

## Características Principales

- 📹 Captura de video desde múltiples cámaras
- 🎥 Gestión de contenido audiovisual
- ☁️ Sincronización en tiempo real con Firebase
- 📱 Soporte multiplataforma (móvil y web)
- 🔔 Notificaciones en tiempo real
- 📦 Almacenamiento local y en la nube
- 👥 Gestión de proyectos colaborativos
- 🔌 **Comunicación en tiempo real** vía WebSocket (Socket.io)
- 📡 **Control remoto** de dispositivos esclavos
- ⚡ **Persistencia de comandos** para dispositivos offline

## 🚀 Fase 5: Comunicación WebRTC/Señalización

La Fase 5 implementa infraestructura completa de comunicación en tiempo real:

### Componentes Implementados

1. **Servidor de Señalización** (`backend/src/server.js`)
   - Node.js + Express + Socket.io
   - Device registry con ownership validation
   - Command routing y queuing para offline resilience
   - REST API para diagnostics

2. **Android WebSocket Client** (`android/slave-app/.../WebSocketClient.kt`)
   - Socket.io client en Kotlin
   - Auto-reconnect con exponential backoff
   - Device registration y command processing

3. **React Native Service** (`src/services/deviceCommunication.ts`)
   - Socket.io client en TypeScript
   - Connection management y event handling
   - Command sending con timeout

4. **React Hooks** (`src/hooks/useCommunication.ts`)
   - `useCommunication()`: Hook principal para la app
   - `useSendCommand()`: Helper para comandos comunes
   - State management integrado

### Documentación

Ver [**PHASE5_COMMUNICATION_GUIDE.md**](./PHASE5_COMMUNICATION_GUIDE.md) para:
- Arquitectura detallada
- Guía de instalación
- Ejemplos de uso
- API Reference
- Troubleshooting

---

## 📱 Fase 6: Media Capture Implementation

La Fase 6 implementa captura de multimedia en dispositivos esclavos:

### Componentes Implementados

1. **CameraManager** (`android/.../managers/CameraManager.kt`)
   - 📸 Captura de fotos con ambas cámaras
   - 🎥 Grabación de video con 3 niveles de calidad
   - 💡 Control de flash
   - 🏷️ Auto-naming y almacenamiento

2. **LocationManager** (`android/.../managers/LocationManager.kt`)
   - 📍 GPS de un punto (GET_LOCATION)
   - 🗺️ Tracking continuo
   - 📐 Cálculo de distancia (Haversine)
   - 🔋 Optimización de batería

3. **AudioManager** (`android/.../managers/AudioManager.kt`)
   - 🎙️ Grabación de audio de alta calidad
   - ⏸️ Pausa/Reanudación (Android 7.0+)
   - 📊 Detección de nivel de audio
   - 🎚️ 3 niveles de calidad

4. **CommandReceiverService Actualizado**
   - ✅ Integración de todos los managers
   - ✅ Handlers funcionales para 10 comandos
   - ✅ Operaciones asincrónicas con CoroutineScope

### Documentación

Ver [**PHASE6_MEDIA_CAPTURE_GUIDE.md**](./PHASE6_MEDIA_CAPTURE_GUIDE.md) para:
- Arquitectura y flujos detallados
- API reference completo
- Ejemplos en React Native
- Testing y troubleshooting
- Consideraciones de privacidad

---

## 📡 Fase 7: RTMP Streaming

La Fase 7 implementa streaming de video en vivo con adaptación de calidad basada en red:

### Componentes Implementados

1. **RTMPStreamManager** (`android/.../managers/RTMPStreamManager.kt`)
   - 🎬 Streaming RTMP a servidores en vivo
   - 📊 3 niveles de calidad (Low/Medium/High)
   - 1-10 Mbps: Range adaptativo de bitrate
   - 📈 Monitoreo de bitrate cada 2 segundos
   - 🔄 Cambio de calidad sin interrumpir stream
   - 📋 Tracking de sesión con IDs únicos
   - 🔔 Sistema de eventos con listeners

2. **StreamQualityManager** (`android/.../managers/StreamQualityManager.kt`)
   - 📶 Detección de tipo de red (WiFi/4G/5G/3G/Offline)
   - 💪 Evaluación de calidad (Poor/Fair/Good/Excellent)
   - 🤖 Recomendación automática de calidad
   - 📊 Estimación de bitrate por tipo de red
   - 📡 Detección de intensidad de señal
   - 🔌 Detección de conexión medida (celular)
   - 🔄 Monitoreo continuo cada 5 segundos
   - ⚠️ Sistema de advertencias para condiciones pobres

3. **CommandReceiverService Actualizado**
   - ✅ Integración de RTMPStreamManager y StreamQualityManager
   - ✅ Handler START_STREAM con validación de red
   - ✅ Handler STOP_STREAM con estadísticas
   - ✅ Verificación de adecuación de red antes de streaming
   - ✅ Cleanup automático en onDestroy()

### Calidades Soportadas

| Calidad | Bitrate | FPS | Resolución | Caso de Uso |
|---------|---------|-----|-----------|-----------|
| Low     | 1 Mbps  | 24  | 640×480   | Red pobre, datos móviles |
| Medium  | 5 Mbps  | 30  | 1280×720  | Condiciones estándar |
| High    | 10 Mbps | 30  | 1920×1080 | Red excelente, WiFi |

### Servidores RTMP Soportados

✅ Wowza Streaming Engine  
✅ Red5 Media Server  
✅ YouTube Live  
✅ Twitch  
✅ Cualquier servidor RTMP compatible  

### Documentación

Ver [**PHASE7_RTMP_STREAMING_GUIDE.md**](./PHASE7_RTMP_STREAMING_GUIDE.md) para:
- Arquitectura detallada con diagramas
- API reference completo
- Ejemplos de configuración RTMP
- Guía de adaptación de calidad
- Testing y troubleshooting

Ver [**PHASE7_QUICK_START.md**](./PHASE7_QUICK_START.md) para:
- Setup en 5 minutos
- Ejemplos prácticos (YouTube, Twitch, Wowza)
- Pruebas con emulador
- Optimización de rendimiento

Ver [**PHASE7_VALIDATION_CHECKLIST.md**](./PHASE7_VALIDATION_CHECKLIST.md) para:
- Lista completa de validación (170+ checks)
- Tests de red (WiFi, 4G, 5G, 3G)
- Tests de streaming
- Tests de error handling
- Signoff de producción

---

## 🎮 Fase 8: Controller UI

La Fase 8 implementa la interfaz gráfica completa para control y monitoreo de dispositivos esclavos:

### Componentes Implementados

1. **Type System** (`src/types/controller.ts`)
   - 180+ tipos TypeScript para phase 8
   - Enums: DeviceStatus, StreamingQuality, CommandType, FileType
   - Data classes completas para todos los entidades
   - Settings y notifications types

2. **Custom Hooks** (580+ líneas)
   - **`useDeviceController()`** (250 líneas)
     - Device management (select, refresh, get info)
     - Command execution con timeout
     - Stream control (start, stop, change quality)
     - Auto-refresh configurable
     - Settings management
     - Integración con Phase 5 communication
   
   - **`useStreamPreview()`** (150 líneas)
     - Stream preview management
     - Real-time metrics (bitrate, fps, latency)
     - Quality adaptation
     - Event listener pattern
   
   - **`useFileBrowser()`** (180 líneas)
     - File system navigation
     - File operations (list, delete, download)
     - Selection management
     - Filtering y sorting

3. **UI Components** (1,430+ líneas)
   - **DeviceCard** (300 líneas): Display dispositivos con battery, storage, network, status
   - **StreamPreviewCard** (280 líneas): Stream previews con live badge, quality, duration, viewers
   - **RecordingControls** (250 líneas): Recording UI con start/pause/resume/stop
   - **FileManager** (320 líneas): File browser con navigation, filters, actions
   - **SettingsPanel** (350 líneas): Streaming, notification, y general settings
   - **ControllerScreen** (650 líneas): Main integrated screen

### Características

✅ Real-time device dashboard  
✅ Live stream preview grid  
✅ Multi-device command sending  
✅ Recording control interface  
✅ File browser with navigation  
✅ Settings management panel  
✅ Quality adjustment controls  
✅ Network status monitoring  
✅ Pull-to-refresh UI pattern  
✅ Modal dialogs for operations  
✅ Auto-refresh with configurable intervals  
✅ Error handling y recovery  

### Documentación

Ver [**PHASE8_CONTROLLER_UI_GUIDE.md**](./PHASE8_CONTROLLER_UI_GUIDE.md) para:
- Arquitectura del sistema
- Component hierarchy
- Type definitions
- Complete API reference
- Usage examples
- State management flows
- Error handling patterns
- Testing checklist



## Estructura del Proyecto

```
MultiCamPro/
├── src/
│   ├── components/       # Componentes reutilizables
│   ├── screens/          # Pantallas de la aplicación
│   ├── context/          # Context API para estado global
│   ├── hooks/            # Custom hooks (useCommunication, etc.)
│   ├── services/         # Servicios (Firebase, deviceCommunication, etc.)
│   ├── utils/            # Funciones utilitarias
│   ├── types/            # Tipos TypeScript (communication.ts)
│   ├── config/           # Configuraciones
│   ├── navigation/       # Configuración de navegación
│   └── App.tsx           # Punto de entrada principal
├── backend/              # ⭐ Servidor de Señalización (Node.js)
│   ├── src/
│   │   ├── server.js              # Socket.io server principal
│   │   ├── controllers/           # Handlers de comandos
│   │   ├── middleware/            # Autenticación y validación
│   │   ├── models/                # Modelos de datos (Firebase)
│   │   └── utils/                 # Helpers y logging
│   ├── package.json
│   ├── .env.example
│   └── README.md
├── assets/               # Imágenes, iconos, fuentes
├── app.json              # Configuración de Expo
├── tsconfig.json         # Configuración TypeScript
├── babel.config.js       # Configuración Babel
├── package.json          # Dependencias y scripts
├── PHASE5_COMMUNICATION_GUIDE.md  # Fase 5: Comunicación WebRTC/Señalización
├── PHASE6_MEDIA_CAPTURE_GUIDE.md  # Fase 6: Captura de Multimedia
├── PHASE7_RTMP_STREAMING_GUIDE.md # Fase 7: RTMP Streaming
├── PHASE7_QUICK_START.md          # Fase 7: Quick Start (5 minutos)
├── PHASE7_VALIDATION_CHECKLIST.md # Fase 7: Checklist (170+ items)
├── PHASE8_CONTROLLER_UI_GUIDE.md  # Fase 8: Controller UI (850+ líneas)
├── PHASE8_QUICK_START.md          # Fase 8: Quick Start (5 minutos)
├── PHASE8_VALIDATION_CHECKLIST.md # Fase 8: Validation (180+ items)
├── PHASE8_IMPLEMENTATION_SUMMARY.md # Fase 8: Implementation Summary
├── QUICK_START.md        # Guía rápida (5 minutos)
├── PROGRESS.md           # Estado del proyecto
└── README.md             # Este archivo
```

## Instalación

### Requisitos Previos

- Node.js >= 18.0.0
- npm >= 9.0.0
- Expo CLI: `npm install -g expo-cli`

### Pasos

1. Clonar el repositorio

```bash
git clone https://github.com/Xuacha/MultiCamPro.git
cd MultiCamPro
```

2. Instalar dependencias

```bash
npm install
```

3. Configurar Firebase (Ver sección de Configuración)

4. Ejecutar la aplicación

```bash
# Para development
npm start

# Para Android
npm run android

# Para iOS
npm run ios

# Para Web
npm run web
```

## Configuración

### Firebase

Crea un archivo `.env` en la raíz del proyecto con tus credenciales de Firebase:

```
EXPO_PUBLIC_FIREBASE_API_KEY=tu_api_key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=tu_auth_domain
EXPO_PUBLIC_FIREBASE_PROJECT_ID=tu_project_id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=tu_storage_bucket
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=tu_messaging_sender_id
EXPO_PUBLIC_FIREBASE_APP_ID=tu_app_id
```

### Servidor de Signalización (Fase 5)

Para ejecutar el servidor de comunicación en tiempo real:

```bash
# 1. Navegar a la carpeta backend
cd backend

# 2. Instalar dependencias
npm install

# 3. Crear archivo .env
cp .env.example .env
# Editar .env con tus credenciales de Firebase

# 4. Iniciar servidor
npm start
# El servidor escuchará en http://localhost:3000
```

**Importante:** El servidor debe estar ejecutándose para que funcionen las características de comunicación en tiempo real (Fase 5).

## Scripts Disponibles

- `npm start` - Inicia el servidor de desarrollo
- `npm run android` - Ejecuta la app en Android
- `npm run ios` - Ejecuta la app en iOS
- `npm run web` - Ejecuta la app en web
- `npm test` - Ejecuta los tests
- `npm run lint` - Verifica el código
- `npm run format` - Formatea el código

## Desarrollo

### Crear un nuevo componente

```bash
# Los componentes van en src/components/
src/components/MiComponente/
├── index.tsx
├── styles.ts
└── MiComponente.types.ts
```

### Crear una nueva pantalla

```bash
# Las pantallas van en src/screens/
src/screens/MiPantalla/
├── index.tsx
├── styles.ts
└── MiPantalla.types.ts
```

## Testing

```bash
npm test
```

## Contribución

Las contribuciones son bienvenidas. Por favor:

1. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
2. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
3. Push a la rama (`git push origin feature/AmazingFeature`)
4. Abre un Pull Request

## Licencia

Este proyecto está bajo la Licencia MIT.

## Autor

Xuacha

## Changelog

### v1.0.0

- Inicialización del proyecto
- Configuración base de Expo y React Native
- Integración con Firebase
- Estructura de carpetas completa
