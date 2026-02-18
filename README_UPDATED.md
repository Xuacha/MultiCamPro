# MultiCamPro - Control Remoto Multi-Dispositivo para Creadores de Contenido

> **Herramienta profesional de producción audiovisual para gestionar múltiples dispositivos Android de forma remota via WiFi/datos móviles.**

## 📱 ¿Qué es MultiCamPro?

MultiCamPro permite a **creadores de contenido, streamers y productores de video** controlar **múltiples dispositivos Android** remotamente desde una interfaz unificada en:

- 📲 Cualquier dispositivo (PC, Mac, móvil)
- 🎥 Capturar fotos/ videos desde cualquier ángulo
- 🎤 Sincronizar audio de múltiples fuentes
- 📍 Etiquetar ubicación GPS en transmisiones
- ⚡ Transmitir en vivo a YouTube, Twitch, etc.
- 🔋 Monitorear batería de todos los dispositivos

### Caso de Uso Típico

```
🎬 Producción de Video en Vivo
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Dispositivos Esclavos:
  • Samsung S23 (ángulo 1) → Cámara trasera
  • Google Pixel 8 (ángulo 2) → Cámara frontal  
  • OnePlus 12 (ángulo 3) → Zoom
                    ↓
        Controlador (MacBook Pro)
        Dashboard MultiCamPro
                    ↓
    Selector: [Cámara 1] [Cámara 2] [Cámara 3]
    Transmisión RTMP → YouTube Live
    Vista Previa 4K en vivo
    Control: Foto, Grabación, Linterna, GPS
```

---

## 🏗️ Estructura del Proyecto

```
MultiCamPro/
│
├── 📱 android/
│   ├── app/                          # App Controladora (Expo/React Native)
│   └── slave-app/                    # ⭐ APP ESCLAVA (Kotlin Nativo)
│       ├── src/main/
│       │   ├── kotlin/
│       │   │   └── com/xuacha/multicampro/slave/
│       │   │       ├── MainActivity.kt
│       │   │       ├── MainApplication.kt
│       │   │       ├── services/           # Servicios críticos
│       │   │       │   ├── SlaveAccessibilityService.kt  ⭐
│       │   │       │   ├── SlaveForegroundService.kt    ⭐
│       │   │       │   ├── CommandReceiverService.kt
│       │   │       │   └── MediaServices.kt
│       │   │       ├── receivers/          # Auto-reinicio
│       │   │       │   └── BootBroadcastReceiver.kt
│       │   │       ├── managers/           # Lógica de dispositivo
│       │   │       │   ├── CameraManager.kt
│       │   │       │   └── LocationManager.kt
│       │   │       ├── network/            # Comunicación
│       │   │       │   └── WebSocketClient.kt
│       │   │       └── utils/
│       │   │           ├── Constants.kt
│       │   │           └── Logger.kt
│       │   └── res/                   # Recursos Android
│       │       ├── layout/
│       │       ├── values/
│       │       ├── drawable/
│       │       └── xml/
│       └── build.gradle
│
├── 🖥️ src/                          # App Controladora (React Native)
│   ├── App.tsx
│   ├── screens/
│   │   ├── LoginScreen.tsx
│   │   ├── DeviceListScreen.tsx     # Lista de dispositivos
│   │   ├── CameraLiveViewScreen.tsx # Visor en vivo
│   │   └── SettingsScreen.tsx
│   ├── components/                  # Componentes reutilizables
│   ├── services/                    # Lógica de negocio
│   │   ├── deviceCommunication.ts
│   │   └── firebaseSignaling.ts
│   ├── context/                     # Estado global (Zustand)
│   │   ├── authStore.ts
│   │   └── deviceStore.ts
│   └── types/                       # TypeScript types
│
├── 🔌 backend/                      # Servidor Node.js (Señalización)
│   ├── server.js
│   ├── controllers/
│   ├── middleware/
│   └── package.json
│
├── 📚 Documentación/
│   ├── ARCHITECTURE_ANALYSIS.md          # Análisis técnico
│   ├── IMPLEMENTATION_GUIDE.md            # Guía paso a paso
│   ├── GOOGLE_PLAY_SECURITY_STATEMENT.md # Cumplimiento
│   └── SETUP.md                          # Setup inicial
│
└── ⚙️ Config
    ├── app.json
    ├── package.json
    ├── tsconfig.json
    └── babel.config.js
```

---

## 🚀 Inicio Rápido

### Requisitos Previos

```bash
# Sistema
- Android SDK 21+ (app esclava)
- Node.js 18+
- Expo CLI
- Git

# Servicios externos
- Firebase Project (autenticación, DB, signals)
- Servidor para transmisión RTMP (opcional)
```

### 1️⃣ Clonar y Instalar

```bash
git clone https://github.com/Xuacha/MultiCamPro
cd MultiCamPro
npm install

# Instalar dependencias de Expo
npx expo install
```

### 2️⃣ Configurar Firebase

```bash
# Crear archivo .env.local con credenciales Firebase
cat > .env.local << EOF
EXPO_PUBLIC_FIREBASE_API_KEY=tu_api_key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=tu_proyecto.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=tu_proyecto
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=tu_proyecto.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=tu_sender_id
EXPO_PUBLIC_FIREBASE_APP_ID=tu_app_id
EXPO_PUBLIC_FIREBASE_DATABASE_URL=https://tu_proyecto.firebaseio.com
EOF
```

### 3️⃣ Compilar App Esclava (Android)

```bash
# Build APK para instalar en dispositivos esclavos
cd android/slave-app
./gradlew assembleDebug

# Instalar en dispositivo
adb install app/build/outputs/apk/debug/slave-app-debug.apk

# O compilar en Android Studio
# android/slave-app dentro de Android Studio
```

### 4️⃣ Ejecutar App Controladora

```bash
# En otro terminal
npm start

# Opción 1: Emulador Android
# Presiona 'a'

# Opción 2: Dispositivo real
# Escanear QR con Expo Go

# Opción 3: Web
npm run web
```

---

## ⚙️ Configuración de Desarrollador

### Variable de Entorno de Servidor de Signals

```bash
# android/slave-app/src/main/kotlin/.../utils/Constants.kt
const val SIGNALING_SERVER_URL = "ws://tu-servidor.com:3000"  # Producción
const val SIGNALING_SERVER_URL = "ws://10.0.2.2:3000"          # Emulador local
```

### Habilitar Servicio de Accesibilidad (iOS Testing)

```
En dispositivo Android:
1. Abrir Settings
2. Ir a Accessibility (Accesibilidad)
3. Buscar "MultiCamPro Slave"
4. Activar toggle
5. Confirmar advertencia de seguridad
```

### Logs de Depuración

```kotlin
// Los logs se guardan en: /storage/emulated/0/Android/data/com.xuacha.multicampro.slave/files/MultiCamPro/logs/

// Ver logs en vivo:
adb logcat | grep MultiCamPro-Slave

// Extraer archivo de log:
adb pull /storage/emulated/0/Android/data/com.xuacha.multicampro.slave/files/MultiCamPro/logs/
```

---

## 📖 Documentación Detallada

| Documento | Propósito |
|-----------|-----------|
| [ARCHITECTURE_ANALYSIS.md](./ARCHITECTURE_ANALYSIS.md) | Análisis técnico y comparativa con requisitos |
| [IMPLEMENTATION_GUIDE.md](./IMPLEMENTATION_GUIDE.md) | Guía paso a paso para completar implementación |
| [GOOGLE_PLAY_SECURITY_STATEMENT.md](./GOOGLE_PLAY_SECURITY_STATEMENT.md) | Declaración de seguridad para Google Play |
| [SETUP.md](./SETUP.md) | Instrucciones de instalación inicial |

---

## 🔐 Seguridad y Privacidad

### ✅ Lo Que Hacemos

- ✓ Autenticación OAuth2 a través de Firebase
- ✓ Solo el propietario puede controlar sus dispositivos
- ✓ Notificación permanente (no oculta)
- ✓ Los usuarios DEBEN habilitar manualmente Accessibility Service
- ✓ Logs de auditoría completos
- ✓ Cumplimiento con políticas de Google Play

### ❌ Lo Que NO Hacemos

- ✗ Captura de datos privados (SMS, contactos, mensajes)
- ✗ Habilitación silenciosa de permisos
- ✗ Malware o spyware
- ✗ Comercialización de datos
- ✗ Acceso a redes privadas de usuario
- ✗ Operación oculta

[Ver declaración completa](./GOOGLE_PLAY_SECURITY_STATEMENT.md)

---

## 🛠️ Stack Tecnológico

### App Esclava (Dispositivos Android)
- **Lenguaje:** Kotlin
- **API mínima:** Android 21 (API 5.0)
- **Core:** AccessibilityService + ForegroundService
- **Networking:** Firebase Realtime DB / WebSocket
- **Medios:** Camera2, MediaRecorder, AudioRecord

### App Controladora (Multiplataforma)
- **Framework:** React Native (Expo)
- **Lenguaje:** TypeScript
- **Plataformas:** iOS, Android, Web, macOS, Windows
- **Estado:** Zustand
- **Base de datos:** Firebase (Auth, Firestore, Realtime, Storage)
- **Comunicación:** WebRTC (en futura fase)

### Backend
- **Servidor:** Node.js + Express
- **Señalización:** Socket.io (WebSocket)
- **Protocolo:** JSON sobre WebSocket

---

## 📈 Fases de Desarrollo

```
COMPLETADO ✅
├── Fase 0: Análisis y Planificación
├── Fase 1: Estructura base Android
├── Fase 2: AccessibilityService + ForegroundService
├── Fase 3: Sistema de logs y utilidades
└── Fase 4: Documentación de arquitectura

EN PROGRESO 🚧
├── Fase 5: WebSocket/Firebase real-time
├── Fase 6: Captura real de medios
└── Fase 7: Interfaz del controlador (RN)

FUTURO 📋
├── Fase 8: WebRTC para video
├── Fase 9: Transmisión RTMP
├── Fase 10: Geolocalización y mapas
└── Fase 11: Beta en Google Play
```

---

## 🤝 Contribuir

Las contribuciones son bienvenidas. Por favor:

1. Fork el repositorio
2. Crear rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit cambios (`git commit -m 'Add AmazingFeature'`)
4. Push a rama (`git push origin feature/AmazingFeature`)
5. Abrir Pull Request

---

## 📄 Licencia

Este proyecto está bajo la licencia MIT. Ver [LICENSE](LICENSE) para detalles.

---

## 👤 Autor

**Xuacha**
- GitHub: [@Xuacha](https://github.com/Xuacha)
- Email: dev@xuacha.com

---

## 📞 Soporte

Para reportar bugs o solicitar features:
- 🐛 [Crear Issue](https://github.com/Xuacha/MultiCamPro/issues)
- 💬 [Discusiones](https://github.com/Xuacha/MultiCamPro/discussions)
- 📧 [Email](mailto:dev@xuacha.com)

---

## ⚠️ Descargo de Responsabilidad

**MultiCamPro** es una herramienta legítima de producción audiovisual. El usuario es responsable de:

- Cumplir con leyes de privacidad locales
- Obtener consentimiento de personas grabadas
- No usar para fines maliciosos o ilegales
- Respetar la privacidad de terceros

El autor no es responsable del mal uso de esta herramienta.

---

## 🙏 Agradecimientos

- Google Android Security Team (por las APIs seguras)
- Firebase por la infraestructura de tiempo real
- React Native y Expo por la excelente experiencia multiplataforma
- La comunidad de desarrolladores Android

---

**Última actualización:** Febrero 2026

**Estado:** En desarrollo activo
