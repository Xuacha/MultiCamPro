# 📱 Guía de Compilación APK - MultiCamPro

**Fecha**: Febrero 17, 2026  
**Objetivo**: Compilar APK de prueba para instalar en dispositivo físico

---

## 🚀 Opción 1: EAS Build (RECOMENDADO - Servicio en Nube)

### Ventajas
✅ No requiere Android SDK local  
✅ Build en servidores de Expo (más rápido)  
✅ Firmado automáticamente  
✅ URL de descarga inmediata  

### Requisitos
- Cuenta Expo (gratuito)
- EAS CLI instalado ✅ (ya lo hicimos)

### Pasos

#### 1. Inicializar Proyecto con EAS
```bash
cd /workspaces/MultiCamPro
eas init
```
- Seleccionar "Expo Go" o "Bare"
- Seleccionar cuenta de Expo

#### 2. Compilar APK de Prueba
```bash
eas build --platform android --profile preview
```

**Resultado:**
- APK compilado en 15-30 minutos
- URL descargable
- Instalar en dispositivo: `adb install app.apk`

#### 3. Compilar APK de Producción
```bash
eas build --platform android --profile production
```

---

## 🔧 Opción 2: Compilación Local (ALTERNATIVA)

### Requisitos
- Android SDK 35+
- Android Build Tools
- Java 17+

### Pasos
```bash
# En /workspaces/MultiCamPro
npm run android

# O con expo directly
eas build --platform android --profile preview --local
```

---

## 📦 Instalación en Dispositivo

### Prerequisitos
1. Habilitar "Fuentes desconocidas" en Android
2. Habilitar "Opciones de desarrollador"
3. Conectar dispositivo vía USB
4. Habilitar "Depuración USB"

### Instalar APK
```bash
# Opción A: Usando ADB
adb install app.apk

# Opción B: Transferir por USB
# Copiar .apk a dispositivo y abrir con file manager
```

---

## 🧪 Testing Checklist (Paso 2)

Después de instalar, probar:

- [ ] **Autenticación**
  - [ ] Login con email
  - [ ] Signup nuevo usuario
  - [ ] Password recovery
  - [ ] Logout

- [ ] **Permisos**
  - [ ] Solicitud de permisos (Cámara, Micrófono, GPS)
  - [ ] Manejo de rechazo de permisos
  - [ ] Re-solicitar después de rechazar

- [ ] **Navegación**
  - [ ] Tab navigation funciona
  - [ ] Stack navigation funciona
  - [ ] Botones de atrás funcionan

- [ ] **Cloud Storage**
  - [ ] Subir archivo
  - [ ] Descargar archivo
  - [ ] Ver lista de archivos
  - [ ] Eliminar archivo

- [ ] **Streams & Media**
  - [ ] Ver streams activos (si hay dispositivos conectados)
  - [ ] Control de calidad de stream
  - [ ] Parar stream

- [ ] **Analytics**
  - [ ] Ver dashboard de analytics
  - [ ] Ver métricas de almacenamiento
  - [ ] Ver reportes

- [ ] **Compartición**
  - [ ] Crear share link
  - [ ] Copiar link
  - [ ] Revocar acceso

- [ ] **Network**
  - [ ] Funciona con WiFi
  - [ ] Funciona con datos móviles
  - [ ] Manejo de desconexión
  - [ ] Reconexión automática

- [ ] **Performance**
  - [ ] No hay crashes
  - [ ] Smooth navigation
  - [ ] No memory leaks
  - [ ] Battery performance OK

---

## 🔌 Paso 3: Despliegue Backend

Ver `BACKEND_PRODUCTION.md` para:
1. Configurar variables de entorno
2. Desplegar servidor Node.js
3. Configurar Firebase
4. Setup de monitoring

---

## 📋 Troubleshooting

### "adb: command not found"
```bash
# Instalar platform-tools
sudo apt-get install android-platform-tools
```

### "Build failed"
- Limpiar cache: `eas build --platform android --clear-cache`
- Ver logs: Consultar la URL del build en Expo

### "App crashes al abrirse"
- Revisar Android Studio logcat
- Verificar Firebase config
- Revisar console de Expo

### "Can't connect to signaling server"
- Cambiar `SIGNALING_SERVER_URL` en `src/config/firebase.ts`
- Asegurar que backend está corriendo

---

## ✅ Siguientes Pasos

1. ✅ Compilar APK (este documento)
2. 🔄 Instalar y testear en dispositivo
3. 🚀 Desplegar backend en producción

