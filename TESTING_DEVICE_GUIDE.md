# 📱 PASO 2: Testing en Dispositivo Físico - Guía Completa

**Fecha**: Febrero 17, 2026  
**Objetivo**: Instalar y validar MultiCamPro en dispositivo Android real

---

## 🎯 Objetivo del Testing

Validar que la aplicación:
- ✅ Se instala correctamente
- ✅ Se ejecuta sin crashes
- ✅ Las funciones principales funcionan
- ✅ Los permisos se solicitan correctamente
- ✅ La navegación es fluida
- ✅ No hay memory leaks o problemas de performance

---

## 📋 Prerrequisitos

### Dispositivo Android
- [ ] API 24+ (Android 7.0+)
- [ ] ~100MB de espacio disponible
- [ ] WiFi o datos móviles conectado
- [ ] Habilitar "Fuentes desconocidas" en Configuración
- [ ] Habilitar "Opciones de Desarrollador"
  - Ir a: Configuración > Acerca del teléfono
  - Tocar "Número de compilación" 7 veces
- [ ] Habilitar "Depuración USB" en Opciones de Desarrollador

### Computadora (Dev Container)
- [x] Node.js 18+ 
- [x] npm instalado
- [x] EAS CLI o Expo CLI
- [ ] ADB instalado (si quieres instalar APK)

### Credenciales
- [ ] Firebase configurado en `.env`
- [ ] Backend URL configurado
- [ ] Conexión a internet

---

## 🚀 Opción A: Testing Rápido con Expo Go (RECOMENDADO)

**Ventajas:**
- ✅ Sin compilación (instantáneo)
- ✅ Hotreload en tiempo real
- ✅ Perfect para testing iterativo

### Pasos

#### 1. Instalar Expo Go en Dispositivo
```
Google Play Store > Buscar "Expo Go" > Instalar
```

#### 2. Iniciar Servidor de Desarrollo
```bash
cd /workspaces/MultiCamPro
npm start

# Verás algo como:
#
# ✔ Press 's' │ Android
# ✔ Press 'i' │ iOS
# ✔ Press 'w' │ Web
# ✔ Press 'j' │ Lambda dev client
# ✔ Press 'Ctrl+C' │ Stop
#
# ✔ Press 'u' │ Dev Servers
# ✔ Press 'r' │ Restart
# ✔ Press 'c' │ Clear cache
# ✔ Press '?' │ Help
```

#### 3. Conectar Dispositivo
```bash
# En la terminal, presiona 's' para Android
# Verás un código QR

# En el dispositivo:
# Abre Expo Go
# Presiona el botón para escanear
# Escanea el código QR
# Espera a que cargue la app
```

#### 4. Navegar en la App
Una vez que cargue, deberías ver:
- Pantalla de login (si no hay sesión guardada)
- O dashboard principal (si hay sesión guardada)

---

## 🚀 Opción B: Compilar APK Completo (Para Test Pre-Release)

### Preparación: Obtener Credenciales Firebase

1. Ve a https://console.firebase.google.com
2. Crea proyecto o selecciona uno existente
3. Registra una aplicación Android:
   - Bundle ID: `com.xuacha.multicampro`
   - Descarga `google-services.json`
4. Abre el archivo y copia las credenciales:
   ```
   apiKey: AIzaSy...
   authDomain: mi-proyecto.firebaseapp.com
   projectId: mi-proyecto
   storageBucket: mi-proyecto.appspot.com
   messagingSenderId: 123456789
   appId: 1:123456:android:abc123
   databaseURL: https://mi-proyecto.firebaseio.com
   ```

### Configurar .env

```bash
# Opción 1: Script interactivo
bash configure-firebase.sh

# Opción 2: Manual
# Edita .env con tus credenciales:
vim .env
```

### Compilar APK

```bash
# Opción A: Usar EAS Build (Recomendado)
eas build --platform android --profile preview --wait

# Opción B: Compilación local
npm run android
```

### Descargar e Instalar

```bash
# Si usaste EAS Build:
# 1. Copia el URL del APK
# 2. Descarga en tu computadora
# 3. Conecta dispositivo por USB
# 4. Instala con:

adb install -r app.apk

# O transfiere el APK al dispositivo y abre con file manager
```

---

## ✅ Testing Checklist

Después de instalar, verifica cada punto:

### 1. 🔐 Autenticación (5-10 minutos)

- [ ] **Pantalla de Login se abre**
  - [ ] Campos: Email y Password visibles
  - [ ] Logo y branding visible

- [ ] **Crear Cuenta Nueva**
  - [ ] Botón "Sign Up" funciona
  - [ ] Campos requeridos validados
  - [ ] Contraseña validada (min 6 caracteres)
  - [ ] Email validado

- [ ] **Login**
  - [ ] Email correcto + password incorrecto = Error
  - [ ] Email correcto + password correcto = Entra a app
  - [ ] Mensaje de error claro

- [ ] **Recuperar Contraseña**
  - [ ] Botón "Forgot Password" funciona
  - [ ] Email solicitado
  - [ ] Mensaje de confirmación mostrado

- [ ] **Persistencia de Sesión**
  - [ ] Cerra completamente la app (Swipe Up)
  - [ ] Abre de nuevo
  - [ ] Debería estar logueado (no pedir credenciales)

### 2. 🔔 Permisos (5 minutos)

- [ ] **Solicitud de Cámara**
  - [ ] Dialog aparece al entrar a sección de media
  - [ ] Opción "Permitir" y "Rechazar"
  - [ ] Si permite: cámara funciona
  - [ ] Si rechaza: mostrar mensaje friendly

- [ ] **Solicitud de Micrófono**
  - [ ] Dialog aparece para audio/video
  - [ ] Opción "Permitir" y "Rechazar"
  - [ ] Funcionalidad degrada gracefully si rechaza

- [ ] **Solicitud de GPS**
  - [ ] Dialog aparece para localización
  - [ ] Opción "Permitir" y "Rechazar"
  - [ ] Si permite: GPS funciona

- [ ] **Solicitud de Almacenamiento**
  - [ ] App puede leer/escribir archivos

### 3. 🧭 Navegación (5 minutos)

- [ ] **Tab Navigation (Bottom Tabs)**
  - [ ] Puedo tocar cada tab
  - [ ] Pantalla cambia correctamente
  - [ ] Tab activo highlighted

- [ ] **Stack Navigation**
  - [ ] Botón "Atrás" aparece en screens secundarias
  - [ ] Regresa a pantalla anterior
  - [ ] Gestura de deslizar regresa

- [ ] **Modales/Dialogs**
  - [ ] Se abren sin lag
  - [ ] Se cierran al presionar X o Cancel
  - [ ] Backdrop (oscuro) detrás del modal

### 4. ☁️ Almacenamiento en Nube (10-15 minutos)

**Nota**: Necesita Firebase configurado

- [ ] **Ver Álbumes**
  - [ ] Pantalla de Cloud Storage carga
  - [ ] Lista de álbumes visible (puede estar vacía)

- [ ] **Subir Archivo**
  - [ ] Botón "+" o "Upload" visible
  - [ ] Permite seleccionar archivo
  - [ ] Progressbar durante upload
  - [ ] Success message al completar

- [ ] **Descargar Archivo**
  - [ ] Botón download en file
  - [ ] File se descarga con progressbar
  - [ ] Archivo guardado localmente

- [ ] **Eliminar Archivo**
  - [ ] Botón delete en file
  - [ ] Confirmación antes de eliminar
  - [ ] File desaparece de lista
  - [ ] No hay error

- [ ] **Ver Lista de Files**
  - [ ] Files se muestran con thumbnails
  - [ ] Size y fecha visible
  - [ ] Scroll funciona

### 5. 📊 Control remoto de dispositivos (5-10 minutos)

**Nota**: Necesita backend corriendo y dispositivo esclavo conectado

- [ ] **Ver Dispositivos Conectados**
  - [ ] Pantalla Controller/Devices muestra dispositivos
  - [ ] Status de dispositivo (online/offline) correcto
  - [ ] Battery level visible
  - [ ] Network type visible (WiFi/4G/etc)

- [ ] **Seleccionar Dispositivo**
  - [ ] Puedo tocar un dispositivo
  - [ ] Se resalta/selecciona
  - [ ] Opciones aparecen

- [ ] **Control de Streams**
  - [ ] Botón para iniciar stream visible
  - [ ] Puedo seleccionar calidad
  - [ ] Stream inicia sin error
  - [ ] Live badge aparece

- [ ] **Cambiar Calidad**
  - [ ] Buttons Low/Medium/High visible
  - [ ] Puedo cambiar durante streaming
  - [ ] Cambio refleja en dispositivo

### 6. 🎬 Analytics & Reporting (5 minutos)

**Nota**: Requiere datos de uso acumulados

- [ ] **Analytics Dashboard**
  - [ ] Pantalla carga sin error
  - [ ] Métricas de storage visible
  - [ ] Gráficos se renderizan

- [ ] **Ver Reportes**
  - [ ] Período (Day/Week/Month) seleccionable
  - [ ] Datos actualizados según período
  - [ ] Sin crashes

### 7. 🔗 Compartición (5-10 minutos)

- [ ] **Crear Share Link**
  - [ ] Botón share visible en file
  - [ ] Dialog se abre
  - [ ] General share link visible
  - [ ] Link es copiable

- [ ] **Copiar Link**
  - [ ] Botón copy funciona
  - [ ] Toast/notification confirma "Copied"

- [ ] **Revocar Acceso**
  - [ ] Botón revoke visible
  - [ ] Confirmación antes de revocar
  - [ ] Link inactivo después

### 8. 🌐 Networking (10 minutos)

- [ ] **Funciona con WiFi**
  - [ ] Conectar a WiFi
  - [ ] App funciona normalmente
  - [ ] Uploads/downloads son rápidos

- [ ] **Funciona con Datos Móviles**
  - [ ] Desconectar WiFi
  - [ ] Usar datos móviles
  - [ ] App sigue funcionando
  - [ ] Puede ser más lento pero funciona

- [ ] **Manejo de Desconexión**
  - [ ] Desconectar WiFi o datos
  - [ ] App no crashea
  - [ ] Mostrar error o modo offline
  - [ ] Reconectar restablece conexión

- [ ] **Reconexión Automática**
  - [ ] Cerrar WiFi/datos
  - [ ] Abrir de nuevo
  - [ ] App se reconecta automaticamente

### 9. ⚡ Performance & Stability (15 minutos)

- [ ] **Sin Crashes**
  - [ ] Navegar rápidamente entre screens
  - [ ] Hacer uploads grandes
  - [ ] Cambiar rápidamente entre dispositivos
  - [ ] No hay error

- [ ] **Memory Usage**
  - [ ] App no consume toda la RAM
  - [ ] Abrir Settings > Apps > MultiCamPro
  - [ ] Ver Memory
  - [ ] Debería ser < 200-300MB

- [ ] **Battery Impact**
  - [ ] App en background baja lentamente batería
  - [ ] No hay servicio permanente innecesario
  - [ ] GPS solo cuando se use

- [ ] **Smooth Navigation**
  - [ ] Transiciones fluidas (sin lag)
  - [ ] Scrolling suave
  - [ ] Sin jank visible
  - [ ] Animations funcionan

### 10. 📱 UI/UX (5 minutos)

- [ ] **Responsive Design**
  - [ ] App se ve bien en pantalla
  - [ ] No hay texto cortado
  - [ ] Botones son presionables
  - [ ] Layout es legible

- [ ] **Dark/Light Mode**
  - [ ] App respeta system theme
  - [ ] Si hay opción de theme, funciona
  - [ ] Colores son legibles en ambos modos

- [ ] **Notifications**
  - [ ] Si hay notificaciones, aparecen
  - [ ] Al tocar notificación, abre pantalla correcta
  - [ ] Se pueden descartar

---

## 🐛 Reportar Bugs Encontrados

Si encuentras un problema, documenta:

1. **Descripción**: ¿Qué pasó?
2. **Pasos para reproducir**: ¿Cómo lo causaste?
3. **Resultado esperado**: ¿Qué debería pasar?
4. **Resultado actual**: ¿Qué pasó en su lugar?
5. **Dispositivo**: Modelo, versión Android, RAM
6. **Logs**: Screenshots o error messages

Ejemplo:
```
Título: "App crashea al subir video grande"

Pasos:
1. Ir a Cloud Storage
2. Tocar Upload
3. Seleccionar video de 500MB
4. Presionar Upload

Esperado: Video sube con progressbar

Actual: App se cierra sin error message
         (crash silencioso)

Dispositivo: Samsung Galaxy A15, Android 13, 4GB RAM
```

---

## ✅ Después de Testing

### Si todo funciona bien:
1. ✅ Procede a **Paso 3: Despliegue Backend**
2. 🚀 Actualiza credenciales reales de Firebase
3. 📦 Compila APK final para distribución

### Si encuentras bugs:
1. 📝 Documenta con detalles arriba
2. 🔧 Revisa TROUBLESHOOTING más abajo
3. 🐛 Abre issue en GitHub si es serio

---

## 🔧 Troubleshooting

### "App no inicia con Expo Go"
```
Solución:
1. Verifica conexión WiFi
2. Restart Expo server: Ctrl+C y npm start
3. En Expo Go, ve a Settings > Limpia cache
4. Escanea QR de nuevo
```

### "Firebase error: No project found"
```
Solución:
1. Verifica .env tiene credenciales correctas
2. Recreate .env: bash configure-firebase.sh
3. Reinicia: npm start
4. Rebuild: npm run android
```

### "Permission denied"
```
Solución:
1. Ir a Configuración > Apps > Permisos
2. Permitir: Cámara, Micrófono, Ubicación
3. Reinicia app
```

### "App crashea al abrir"
```
Solución:
1. Ver logs: adb logcat | grep MultiCamPro
2. Revisar error en Firebase Console
3. Eliminar app completamente
4. Reinstalar APK
```

### "Uploads son muy lentos"
```
Solución:
1. Verificar conexión WiFi (>10Mbps)
2. Revisar tamaño de archivo (>100MB puede ser lento)
3. Ir a Settings > cambiar quality a Medium/Low
4. Nolowdara en background
```

---

## 📞 Próximos Pasos

- [ ] ✅ Completar testing checklist arriba
- [ ] 🚀 Procede a **PASO 3: Despliegue Backend**
- [ ] 📱 Instala app en otros dispositivos
- [ ] 🎯 Prueba compartición entre dispositivos

---

**Duración estimada**: 1-2 horas  
**Persona responsable**: QA Engineer / Developer  
**Fecha completado**: ___/___/2026

