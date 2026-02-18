/**
 * SERVIDOR DE SEÑALIZACIÓN - MultiCamPro
 * 
 * Responsabilidades:
 * 1. Recibir conexiones de dispositivos esclavos y controladores
 * 2. Mantener registro de dispositivos activos
 * 3. Enrutar comandos entre dispositivos
 * 4. Sincronizar estado en tiempo real
 * 5. Manejo de desconexiones y reconexiones
 */

import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { v4 as uuidv4 } from 'uuid';

// Cargar variables de entorno
dotenv.config();

// ========== INICIALIZACIÓN ==========

const app = express();
const httpServer = createServer(app);
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST']
  },
  namespace: process.env.SOCKET_NAMESPACE || '/signals'
});

// Middleware de Express
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());

// ========== ALMACENAMIENTO EN MEMORIA ==========
// En producción, usar Redis o base de datos

/**
 * Estructura de dispositivos conectados:
 * {
 *   "device-id": {
 *     socketId: "socket-id",
 *     type: "slave" | "controller",
 *     ownerUid: "user-id",
 *     status: "CONNECTED" | "IDLE" | "RECORDING" | "STREAMING",
 *     battery: 85,
 *     signal: -45,
 *     lastSeen: timestamp,
 *     capabilities: {...}
 *   }
 * }
 */
const connectedDevices = new Map();

/**
 * Estructura de cola de comandos:
 * {
 *   "device-id": [
 *     { commandId, commandType, data, timestamp }
 *   ]
 * }
 */
const commandQueues = new Map();

/**
 * Mapeo de dispositivos por usuario:
 * {
 *   "user-id": ["device-id-1", "device-id-2"]
 * }
 */
const userDevices = new Map();

// ========== LOGGER SIMPLE ==========

const logger = {
  info: (msg, data = '') => console.log(`\x1b[36m[INFO]\x1b[0m ${msg}`, data),
  error: (msg, data = '') => console.error(`\x1b[31m[ERROR]\x1b[0m ${msg}`, data),
  warn: (msg, data = '') => console.warn(`\x1b[33m[WARN]\x1b[0m ${msg}`, data),
  success: (msg, data = '') => console.log(`\x1b[32m[SUCCESS]\x1b[0m ${msg}`, data),
};

// ========== RUTAS HTTP ==========

/**
 * Health check
 */
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    devices: connectedDevices.size,
    uptime: process.uptime()
  });
});

/**
 * Obtener lista de dispositivos (para debugging)
 */
app.get('/api/devices', (req, res) => {
  const devices = Array.from(connectedDevices.entries()).map(([id, data]) => ({
    id,
    type: data.type,
    status: data.status,
    battery: data.battery,
    lastSeen: new Date(data.lastSeen).toISOString()
  }));
  
  res.json({ devices, total: devices.length });
});

/**
 * Obtener estado de dispositivo específico
 */
app.get('/api/devices/:deviceId', (req, res) => {
  const device = connectedDevices.get(req.params.deviceId);
  
  if (!device) {
    return res.status(404).json({ error: 'Device not found' });
  }
  
  res.json({
    id: req.params.deviceId,
    ...device,
    lastSeen: new Date(device.lastSeen).toISOString()
  });
});

// ========== SOCKET.IO EVENTOS ==========

io.on('connection', (socket) => {
  logger.info(`🔌 Cliente conectado: ${socket.id}`);

  /**
   * EVENTO: Registrar dispositivo esclavo
   * 
   * Esperado del cliente:
   * {
   *   deviceId: "phone-1",
   *   ownerUid: "user123",
   *   accessToken: "token",
   *   model: "Samsung S23",
   *   battery: 85,
   *   capabilities: ["camera", "audio", "gps"]
   * }
   */
  socket.on('register-slave', (data) => {
    logger.info(`📱 Dispositivo ESCLAVO registrándose: ${data.deviceId}`);
    
    const deviceId = data.deviceId;
    const ownerUid = data.ownerUid;

    // Validar datos
    if (!deviceId || !ownerUid || !data.accessToken) {
      socket.emit('error', { message: 'Invalid registration data' });
      return;
    }

    // Registrar dispositivo
    connectedDevices.set(deviceId, {
      socketId: socket.id,
      type: 'slave',
      ownerUid: ownerUid,
      status: 'IDLE',
      battery: data.battery || 100,
      signal: data.signal || -50,
      lastSeen: Date.now(),
      model: data.model,
      capabilities: data.capabilities || []
    });

    // Mapear dispositivo al usuario
    if (!userDevices.has(ownerUid)) {
      userDevices.set(ownerUid, []);
    }
    userDevices.get(ownerUid).push(deviceId);

    // Inicializar cola de comandos
    commandQueues.set(deviceId, []);

    logger.success(`✅ Dispositivo ESCLAVO registrado: ${deviceId}`, `Propietario: ${ownerUid}`);

    // Enviar confirmación
    socket.emit('registration-confirmed', { deviceId, message: 'Welcome to MultiCamPro' });

    // Notificar a todos los controladores del usuario
    broadcastToControllers(ownerUid, 'device-list-updated', {
      devices: getDevicesForUser(ownerUid)
    });
  });

  /**
   * EVENTO: Registrar dispositivo controlador
   */
  socket.on('register-controller', (data) => {
    logger.info(`💻 Dispositivo CONTROLADOR registrándose: ${data.controllerId}`);
    
    const controllerId = data.controllerId;
    const ownerUid = data.ownerUid;

    if (!controllerId || !ownerUid) {
      socket.emit('error', { message: 'Invalid registration data' });
      return;
    }

    // Registrar dispositivo
    connectedDevices.set(controllerId, {
      socketId: socket.id,
      type: 'controller',
      ownerUid: ownerUid,
      status: 'ACTIVE',
      lastSeen: Date.now(),
      platform: data.platform || 'unknown'
    });

    if (!userDevices.has(ownerUid)) {
      userDevices.set(ownerUid, []);
    }
    
    // No agregar a userDevices (es controlador, no esclavo)

    logger.success(`✅ Dispositivo CONTROLADOR registrado: ${controllerId}`);

    // Enviar confirmación y lista de dispositivos
    socket.emit('registration-confirmed', {
      controllerId,
      devices: getDevicesForUser(ownerUid)
    });
  });

  /**
   * EVENTO: Solicitar lista de dispositivos
   */
  socket.on('get-device-list', (data) => {
    const ownerUid = data.ownerUid;
    const devices = getDevicesForUser(ownerUid);
    
    socket.emit('device-list', { devices });
  });

  /**
   * EVENTO: Enviar comando a dispositivo esclavo
   * 
   * Esperado:
   * {
   *   targetDeviceId: "phone-1",
   *   commandId: "cmd-123",
   *   commandType: "TAKE_PHOTO",
   *   commandData: {...},
   *   priority: "normal" | "high"
   * }
   */
  socket.on('send-command', (data) => {
    const { targetDeviceId, commandId, commandType, commandData, controllerUid } = data;

    logger.info(`📤 Comando recibido: ${commandType} → ${targetDeviceId}`);

    // Validar que el controlador es el propietario del dispositivo
    const targetDevice = connectedDevices.get(targetDeviceId);
    if (!targetDevice) {
      socket.emit('error', { commandId, message: 'Device not found' });
      return;
    }

    if (targetDevice.ownerUid !== controllerUid) {
      socket.emit('error', { 
        commandId, 
        message: 'Unauthorized: Device does not belong to this user' 
      });
      return;
    }

    // Si el dispositivo está conectado, enviar comando
    if (targetDevice.socketId) {
      const targetSocket = io.sockets.sockets.get(targetDevice.socketId);
      if (targetSocket) {
        targetSocket.emit('remote-command', {
          commandId,
          commandType,
          commandData,
          timestamp: Date.now()
        });
        
        logger.success(`✅ Comando enviado a ${targetDeviceId}`);
        return;
      }
    }

    // Si no está conectado, agregar a cola
    const queue = commandQueues.get(targetDeviceId) || [];
    queue.push({
      commandId,
      commandType,
      commandData,
      timestamp: Date.now()
    });
    commandQueues.set(targetDeviceId, queue);

    logger.warn(`⏳ Dispositivo offline, comando en cola (size: ${queue.length})`);
    socket.emit('command-queued', { commandId, queueSize: queue.length });
  });

  /**
   * EVENTO: Respuesta de comando (desde disposit ivo esclavo)
   */
  socket.on('command-response', (data) => {
    const { commandId, commandType, deviceId, response, error } = data;

    logger.info(`📥 Respuesta recibida: ${commandType} de ${deviceId}`);

    // Encontrar al controlador y enviarle la respuesta
    const device = connectedDevices.get(deviceId);
    if (device) {
      broadcastToControllers(device.ownerUid, 'command-result', {
        deviceId,
        commandId,
        commandType,
        response,
        error,
        timestamp: Date.now()
      });
    }
  });

  /**
   * EVENTO: Actualizar estado del dispositivo
   */
  socket.on('update-status', (data) => {
    const { deviceId, status, battery, signal, location } = data;

    logger.info(`🔄 Estado actualizado: ${deviceId} → ${status}, Batería: ${battery}%`);

    const device = connectedDevices.get(deviceId);
    if (device) {
      device.status = status;
      if (battery !== undefined) device.battery = battery;
      if (signal !== undefined) device.signal = signal;
      if (location !== undefined) device.location = location;
      device.lastSeen = Date.now();

      // Notificar a controladores
      broadcastToControllers(device.ownerUid, 'device-status-updated', {
        deviceId,
        status,
        battery,
        signal,
        location
      });
    }
  });

  /**
   * EVENTO: Al desconectar
   */
  socket.on('disconnect', (reason) => {
    logger.warn(`🔌 Cliente desconectado: ${socket.id}, Razón: ${reason}`);

    // Encontrar y remover dispositivo
    let disconnectedDevice = null;
    for (const [id, device] of connectedDevices.entries()) {
      if (device.socketId === socket.id) {
        disconnectedDevice = id;
        connectedDevices.delete(id);
        break;
      }
    }

    if (disconnectedDevice) {
      const device = connectedDevices.get(disconnectedDevice);
      if (device) {
        logger.info(`Dispositivo removido: ${disconnectedDevice}`);

        // Notificar a controladores
        broadcastToControllers(device.ownerUid, 'device-disconnected', {
          deviceId: disconnectedDevice
        });
      }
    }
  });

  /**
   * EVENTO: Error handler
   */
  socket.on('error', (error) => {
    logger.error(`❌ Error de socket: ${error.message}`);
  });
});

// ========== FUNCIONES AUXILIARES ==========

/**
 * Obtener todos los dispositivos de un usuario
 */
function getDevicesForUser(ownerUid) {
  const deviceIds = userDevices.get(ownerUid) || [];
  
  return deviceIds.map(id => {
    const device = connectedDevices.get(id);
    return {
      id,
      type: device.type,
      status: device.status,
      battery: device.battery,
      signal: device.signal,
      model: device.model,
      capabilities: device.capabilities,
      lastSeen: new Date(device.lastSeen).toISOString()
    };
  }).filter(d => d.type === 'slave'); // Solo esclavos
}

/**
 * Enviar mensaje a todos los controladores de un usuario
 */
function broadcastToControllers(ownerUid, eventName, data) {
  io.sockets.sockets.forEach((socket) => {
    const device = Array.from(connectedDevices.values()).find(
      d => d.socketId === socket.id && d.ownerUid === ownerUid && d.type === 'controller'
    );
    
    if (device) {
      socket.emit(eventName, data);
    }
  });
}

/**
 * Procesar comandos en cola cuando dispositivo se conecta
 */
function processQueueForDevice(deviceId, socket) {
  const queue = commandQueues.get(deviceId) || [];
  
  if (queue.length > 0) {
    logger.info(`📨 Procesando ${queue.length} comandos en cola para ${deviceId}`);
    
    queue.forEach(cmd => {
      socket.emit('remote-command', cmd);
    });
    
    commandQueues.set(deviceId, []);
  }
}

// ========== INICIAR SERVIDOR ==========

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

httpServer.listen(PORT, HOST, () => {
  logger.success(`🚀 Servidor escuchando en ${HOST}:${PORT}`);
  logger.info('Namespace Socket.io:', process.env.SOCKET_NAMESPACE || '/signals');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.warn('SIGTERM recibido, cerrando servidor...');
  httpServer.close(() => {
    logger.info('Servidor cerrado');
    process.exit(0);
  });
});
