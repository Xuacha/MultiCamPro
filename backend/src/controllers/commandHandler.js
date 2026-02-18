/**
 * Handler de Comandos - Server
 * 
 * Procesa respuestas de comandos y las transmite a controladores
 */

function handleCommandResponse(io, socket, data) {
  const {
    commandId,
    targetDeviceId,
    commandType,
    response,
    error,
    timestamp,
  } = data;

  console.log(
    `[COMMAND] ✓ ${commandType} ejecutado en ${targetDeviceId}:`,
    error ? `❌ ${error}` : '✓'
  );

  // Encontrar sockets de controladores conectados
  const controllersInRoom = io.sockets.adapter.rooms.get(`user-${socket.userId}`);

  if (!controllersInRoom || controllersInRoom.size === 0) {
    console.warn(`[COMMAND] No controllers found for user ${socket.userId}`);
    return;
  }

  // Enviar resultado a todos los controladores del usuario
  Array.from(controllersInRoom).forEach((socketId) => {
    io.to(socketId).emit('command-result', {
      commandId,
      targetDeviceId,
      commandType,
      response: response || null,
      error: error || null,
      timestamp: timestamp || new Date().toISOString(),
    });
  });
}

/**
 * Enviar comando a dispositivo esclavo
 */
function sendCommandToSlave(io, targetDeviceId, commandId, commandType, commandData) {
  // Buscar socket del dispositivo
  const slaveSocket = Array.from(io.sockets.sockets.values()).find(
    (s) => s.deviceId === targetDeviceId && s.type === 'slave'
  );

  if (!slaveSocket || !slaveSocket.connected) {
    return {
      queued: true,
      reason: 'Device offline',
    };
  }

  // Enviar comando
  slaveSocket.emit('remote-command', {
    commandId,
    commandType,
    commandData,
    timestamp: new Date().toISOString(),
  });

  return {
    sent: true,
    slaveSocketId: slaveSocket.id,
  };
}

/**
 * Encolar comando para dispositivo offline
 */
function queueCommand(commandQueues, deviceId, commandId, commandType, commandData) {
  if (!commandQueues.has(deviceId)) {
    commandQueues.set(deviceId, []);
  }

  commandQueues.get(deviceId).push({
    commandId,
    commandType,
    commandData,
    enqueuedAt: new Date().toISOString(),
  });

  const queueSize = commandQueues.get(deviceId).length;
  console.log(`[QUEUE] Comando encolado para ${deviceId} (size: ${queueSize})`);

  return queueSize;
}

/**
 * Procesar cola de comandos al conectar
 */
function processQueueForDevice(io, socket, commandQueues, device) {
  const queue = commandQueues.get(device.id);

  if (!queue || queue.length === 0) {
    return 0;
  }

  console.log(`[QUEUE] Procesando ${queue.length} comandos para ${device.id}`);

  // Enviar todos los comandos en cola
  queue.forEach((cmd) => {
    socket.emit('remote-command', cmd);
  });

  // Limpiar cola
  commandQueues.delete(device.id);

  return queue.length;
}

module.exports = {
  handleCommandResponse,
  sendCommandToSlave,
  queueCommand,
  processQueueForDevice,
};
