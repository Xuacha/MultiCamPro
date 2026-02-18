# Servidor de Señalización MultiCamPro

Configuración del servidor Node.js para señalización en tiempo real.

## Variables de Entorno

```bash
# .env
PORT=3000
NODE_ENV=development

# Firebase
FIREBASE_PROJECT_ID=tu_proyecto
FIREBASE_PRIVATE_KEY=tu_private_key
FIREBASE_CLIENT_EMAIL=tu_email

# Socket.io
SOCKET_NAMESPACE=/signals

# Logging
LOG_LEVEL=info
```

## Instalación

```bash
npm install
```

## Desarrollo

```bash
npm run dev
```

## Producción

```bash
npm start
```

## Endpoints Disponibles

### WebSocket Events

#### Cliente → Servidor

- `register-slave` - Registrar dispositivo esclavo
- `register-controller` - Registrar dispositivo controlador
- `send-command` - Enviar comando a dispositivo
- `get-device-list` - Solicitar lista de dispositivos
- `update-status` - Actualizar estado del dispositivo
- `disconnect` - Desconectar

#### Servidor → Cliente

- `device-connected` - Notificación de nuevo dispositivo
- `device-disconnected` - Dispositivo desconectado
- `remote-command` - Comando para ejecutar
- `command-response` - Respuesta de comando
- `device-list-updated` - Lista de dispositivos actualizada
- `server-error` - Error del servidor
