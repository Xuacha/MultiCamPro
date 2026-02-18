# 🚀 PASO 3: Despliegue Backend en Producción

**Fecha**: Febrero 17, 2026  
**Objetivo**: Instalar y ejecutar el servidor Node.js/Express en producción

---

## 📋 Resumen Ejecutivo

El backend de MultiCamPro es un servidor Node.js + Express que maneja:
- ✅ Señalización (Socket.io) para comunicación en tiempo real
- ✅ Registry de dispositivos  
- ✅ Routing de comandos
- ✅ APIs REST para diagnostics
- ✅ Persistencia de comandos offline

---

## 🎯 Arquitectura del Backend

```
Frontend (React Native)
        ↓
    Socket.io Client
        ↓
Backend (Node.js + Express + Socket.io)
        ↓
Android Slave App (WebSocket)
```

### Componentes Principales

1. **Servidor Express** - HTTP API
2. **Socket.io Server** - Comunicación en tiempo real
3. **Device Registry** - Almacena dispositivos conectados
4. **Command Queue** - Cola de comandos para dispositivos offline
5. **Firebase Integration** - Persistencia de datos

---

## 🏗️ Opciones de Despliegue

| Opción | Ventajas | Desventajas | Costo |
|--------|----------|-------------|-------|
| **Heroku** | Fácil, gratuito tier | Dyno sleep | $5-50/mes |
| **Railway** | Moderno, fácil | Pequeña comunidad | $5-20/mes |
| **Render** | Gratis incluido | Spin down en inactividad | $0-20/mes |
| **AWS** | Escalable | Complejo setup | $0-100/mes |
| **DigitalOcean** | VPS simple | Requiere DevOps | $5-15/mes |
| **Local/Home** | Gratis | Debe estar online | $0 |

**RECOMENDADO para testing**: **Render.com** (Tier gratuito)  
**RECOMENDADO para producción**: **Railway.app** (Más confiable)

---

## 🔧 Opción A: Desplegar en Render (Recomendado - Gratuito)

### Prerequisitos
- Cuenta GitHub (gratuito)
- Proyecto en GitHub
- Cuenta Render (gratuito)

### Pasos

#### 1. Preparar Código
```bash
cd /workspaces/MultiCamPro/backend
ls -la
# Debe ver: package.json, src/server.js
```

#### 2. Crear Cuenta Render
1. Ve a https://render.com
2. Click "Sign Up"
3. Usa GitHub para registro (más fácil)

#### 3. Conectar GitHub (si no está)
```bash
cd /workspaces/MultiCamPro

# Si no está en GitHub
git remote add origin https://github.com/tu-usuario/MultiCamPro
git push -u origin main
```

#### 4. Crear Nuevo Web Service
1. En Render Dashboard: Click "New +"
2. Selecciona "Web Service"
3. Conecta tu repo GitHub
4. Configura:
```
Nombre:           multicampro-backend
Rama:             main
Runtime:          Node
Build Command:    cd backend && npm install --legacy-peer-deps
Start Command:    cd backend && npm start
```

#### 5. Variables de Entorno
En Render, agrega en "Environment":
```
NODE_ENV=production
PORT=10000

# Firebase Service Account (obtener en Firebase Console)
FIREBASE_PROJECT_ID=tu-proyecto
FIREBASE_PRIVATE_KEY=xxx
FIREBASE_CLIENT_EMAIL=xxx@iam.gserviceaccount.com

# Socket.io
SOCKET_IO_CORS_ORIGIN=https://tu-app.com,http://localhost:*
```

#### 6. Deploy
1. Click "Create Web Service"
2. Render compila y despliega
3. Una vez completo, verás URL como: `https://multicampro-backend.onrender.com`

#### 7. Actualizar en App
En `/workspaces/MultiCamPro/src/config/firebase.ts`:
```typescript
export const SIGNALING_SERVER_URL = 'https://multicampro-backend.onrender.com';
```

---

## 🔧 Opción B: Desplegar en Railway (Recomendado - Más Confiable)

### Prerequisitos
- Cuenta GitHub
- Proyecto en GitHub

### Pasos

#### 1. Registrarse en Railway
1. Ve a https://railway.app
2. Click "Sign Up"
3. Usa GitHub

#### 2. Crear Nuevo Proyecto
1. Dashboard > "Create New Project"
2. Selecciona "Deploy from GitHub repo"
3. Autoriza Railway en GitHub
4. Selecciona tu repo `MultiCamPro`

#### 3. Adicionar PostgreSQL (opcional)
- Railway puede adicionar base datos si necesitas
- Para este proyecto usamos Firebase, así que skip

#### 4. Configurar Backend
1. En Railway:
   - Click "Add Service" > "GitHub Repo"
   - Selecciona el repo
2. En el archivo raíz, crea `.railway2.json`:

```json
{
  "build": {
    "builder": "nixpacks"
  },
  "deploy": {
    "startCommand": "cd backend && npm install --legacy-peer-deps && npm start"
  }
}
```

#### 5. Environment Variables
En Railway UI, agrega:
```
NODE_ENV=production
PORT=3000
FIREBASE_PROJECT_ID=tu-proyecto
FIREBASE_PRIVATE_KEY=xxx
FIREBASE_CLIENT_EMAIL=xxx
SOCKET_IO_CORS_ORIGIN=*
```

#### 6. Deploy
- Railway auto-deploys cuando haces push a main
- URL será como: `https://multicampro-backend-prod.up.railway.app`

---

## 🔧 Opción C: Desplegar Localmente (Home/Office Server)

### Requisitos
- Linux/Mac/Windows
- Node.js 18+
- PM2 para mantener proceso corriendo
- Router con port forwarding configurado

### Pasos

#### 1. Instalar PM2
```bash
npm install -g pm2
```

#### 2. Iniciar Servidor
```bash
cd /workspaces/MultiCamPro/backend
pm2 start npm --name "multicampro-backend" -- start

# Ver logs
pm2 logs multicampro-backend

# Ver status
pm2 status

# Guardar configuración
pm2 save
pm2 startup
```

#### 3. Configurar Firewall
```bash
# Ubuntu/Debian
sudo ufw allow 3000/tcp

# macOS
# Sistema > Seguridad > Firewall > Agregar 3000
```

#### 4. Port Forwarding en Router
1. Router > Settings > Port Forwarding
2. Mapear puerto externo 3000 → interno 3000
3. IP interna: IP de tu computadora (`hostname -I`)

#### 5. Obtener IP Pública
```bash
curl https://api.ipify.org
# Resultado: 203.0.113.45
```

#### 6. Actualizar en App
En la app, usa:
```typescript
export const SIGNALING_SERVER_URL = 'http://203.0.113.45:3000';
```

#### 7. HTTPS (Opcional pero RECOMENDADO)
```bash
# Instalar Let's Encrypt
sudo apt-get install certbot python3-certbot-nginx

# Obtener certificado
sudo certbot certonly --standalone -d tu-dominio.com

# Actualizar en app a: https://tu-dominio.com
```

---

## 🔧 Opción D: Docker Deployment (Producción Profesional)

### Dockerfile ya preparado
```bash
# En raíz del proyecto está Dockerfile.prod
cat Dockerfile.prod
```

### Compilar imagen
```bash
docker build -f Dockerfile.prod -t multicampro-backend:latest .
```

### Ejecutar con docker-compose
```bash
docker-compose -f docker-compose.prod.yml up -d

# Ver logs
docker-compose logs -f multicampro-backend

# Detener
docker-compose down
```

---

## 🧪 Verificar que Backend Funciona

Después de desplegar, verifica:

```bash
# Test 1: HTTP GET
curl https://tu-backend-url/health
# Debería responder: {"status":"ok"}

# Test 2: Check socket.io
# Abrir en navegador: https://tu-backend-url/socket.io/?transport=polling
# Debería cargar sin error

# Test 3: Crear dispositivo
curl -X POST https://tu-backend-url/api/devices/register \
  -H "Content-Type: application/json" \
  -d '{
    "deviceId": "test-android-001",
    "userId": "user123",
    "deviceName": "Mi Android",
    "os": "android"
  }'
```

---

## 📊 Verificar Logs

### En Render
```
1. Render Dashboard
2. Selecciona "multicampro-backend"
3. Click "Logs"
```

### En Railway
```
1. Railway Dashboard
2. Selecciona tu servicio
3. Ver "Logs" en la pestaña
```

### Local
```bash
pm2 logs multicampro-backend
```

---

## 🔐 Configuración de Seguridad

### CORS (Cross-Origin)
En `backend/src/server.js`, verifica:
```javascript
const io = require('socket.io')(server, {
  cors: {
    origin: process.env.SOCKET_IO_CORS_ORIGIN || [
      'http://localhost:19000',
      'http://localhost:19001',
    ],
    methods: ['GET', 'POST'],
    credentials: true,
  },
});
```

### Rate Limiting
Adicionar antes de deployment:
```bash
npm install express-rate-limit
```

En `server.js`:
```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // Máximo 100 requests por IP
});

app.use(limiter);
```

### HTTPS
- ✅ Render, Railway: Automático con HTTPS
- ⚠️ Local: Usar Let's Encrypt o self-signed

---

## 📊 Monitoreo en Producción

### Habilitar Logs
En Firebase console:
```
1. Go to Cloud Functions
2. Logs > Ver si hay errores
3. Set up alertas para errores
```

### Health Check
Crear endpoint:
```javascript
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});
```

Monitorear con:
```bash
watch -n 60 'curl https://tu-backend-url/health'
```

---

## 🐛 Troubleshooting

### "Port 3000 already in use"
```bash
# Matar proceso en puerto 3000
lsof -i :3000
kill -9 <PID>

# O usar puerto diferente
PORT=3001 npm start
```

### "Cannot connect to Socket.io"
```
Checklist:
- [ ] Backend está corriendo
- [ ] URL en app coincide con URL real
- [ ] Firewall permite conexión
- [ ] CORS está configurado correctamente
```

### "Firebase authentication error"
```
Checklist:
- [ ] Service account key tiene credenciales correctas
- [ ] Copia el archivo completo sin espacios
- [ ] Verifica JSON es válido: jq . firebase-key.json
```

### "Memory leak - uso sube"
```
Soluciones:
- Revisar Socket.io listeners decentes (off)
- Implementar timeout para comandos viejos
- Usar PM2 para restart automático:
  pm2 start server.js --max-memory-restart 500M
```

---

## ✅ Checklist Post-Deploy

- [ ] Backend URL funciona (curl test)
- [ ] Health endpoint responde
- [ ] Socket.io conecta desde app
- [ ] Dispositivos se registran en Firebase
- [ ] Comandos se envían exitosamente
- [ ] Logs están en lugar correcto
- [ ] HTTPS habilitado
- [ ] Rate limiting configurado
- [ ] Monitoreo/alertas activados
- [ ] Backups automáticos configurados

---

## 📱 Conectar App al Backend

Después de desplegar, actualiza:

### 1. En `src/config/firebase.ts`
```typescript
// Antes (localhost)
export const SIGNALING_SERVER_URL = 'http://localhost:3000';

// Después (producción)
export const SIGNALING_SERVER_URL = 'https://multicampro-backend.railway.app';
```

### 2. Recompila app
```bash
npm run android
# O
eas build --platform android
```

### 3. Verifica conexión
Abre app y busca en logs:
```
✓ Connected to signaling server
```

---

## 🎯 Próximos Pasos

### Dentro de 24 horas:
1. ✅ Backend en producción
2. 📱 App conectada a backend
3. 🤖 Android slave app registrado

### Dentro de 1 semana:
1. 🧪 Testing end-to-end
2. 📊 Monitoreo activo
3. 🔧 Ajustes de performance

### Dentro de 2 semanas:
1. 🚀 Lanzamiento a App Store/Google Play
2. 📣 Marketing
3. 🎉 Release

---

## 📞 Support

Si necesitas ayuda:

1. **Backend no inicia**
   - Ver logs: `npm start` en terminal
   - Buscar error específico
   - Revisar `.env` variables

2. **Conexión Socket.io falla**
   - Verificar URL en app es correcta
   - Revisar CORS en servidor
   - Chequear firewall

3. **Firebase errors**
   - Verificar Service Account Key
   - Validar JSON está completo
   - Check Firebase rules

4. **Performance issues**
   - Revisar memoria del servidor
   - Implementar caching
   - Optimizar queries Firebase

---

## 📋 Recursos

- [Render Docs](https://render.com/docs)
- [Railway Docs](https://docs.railway.app)
- [Socket.io Docs](https://socket.io/docs)
- [Firebase Docs](https://firebase.google.com/docs)
- [Node.js Best Practices](https://nodejs.org/en/docs/guides/)

---

**Duración estimada**: 30-60 minutos  
**Persona responsable**: DevOps/Backend Engineer  
**Fecha completado**: ___/___/2026

