/**
 * Utilidades del Servidor
 * 
 * - Logging
 * - Validación
 * - Manejo de errores
 * - Utilidades generales
 */

const fs = require('fs');
const path = require('path');

// ========== LOGGING ==========

const LogLevel = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
};

const currentLogLevel = LogLevel[process.env.LOG_LEVEL?.toUpperCase() || 'INFO'];

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
};

function log(level, message, data = null) {
  if (LogLevel[level] < currentLogLevel) return;

  const timestamp = new Date().toISOString();
  const levelStr = level.padEnd(5);

  let output = `[${timestamp}] [${levelStr}] ${message}`;
  if (data) {
    output += ` ${JSON.stringify(data)}`;
  }

  console.log(output);

  // Guardar en archivo si está configurado
  if (process.env.LOG_FILE) {
    const logsDir = path.dirname(process.env.LOG_FILE);
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }

    fs.appendFileSync(
      process.env.LOG_FILE,
      output + '\n',
      (err) => {
        if (err) console.error('Error writing log:', err);
      }
    );
  }
}

function logInfo(message, data) {
  log('INFO', message, data);
}

function logError(message, error) {
  const errorData = {
    message: error?.message,
    code: error?.code,
    stack: error?.stack,
  };
  log('ERROR', message, errorData);
}

function logWarn(message, data) {
  log('WARN', message, data);
}

function logDebug(message, data) {
  log('DEBUG', message, data);
}

// ========== VALIDACIÓN ==========

function validateDevice(device) {
  if (!device.id) throw new Error('Device ID required');
  if (!device.ownerUid) throw new Error('Owner UID required');
  if (!device.type) throw new Error('Device type required');

  return true;
}

function validateCommand(command) {
  if (!command.commandId) throw new Error('Command ID required');
  if (!command.commandType) throw new Error('Command type required');
  if (!command.targetDeviceId) throw new Error('Target device ID required');

  return true;
}

function validateAuth(socket) {
  if (!socket.userId) throw new Error('User not authenticated');
  return true;
}

// ========== MANEJO DE ERRORES ==========

class ServerError extends Error {
  constructor(message, code = 'INTERNAL_ERROR', statusCode = 500) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
  }
}

class DeviceNotFoundError extends ServerError {
  constructor(deviceId) {
    super(`Device ${deviceId} not found`, 'DEVICE_NOT_FOUND', 404);
  }
}

class UnauthorizedError extends ServerError {
  constructor(message = 'Unauthorized') {
    super(message, 'UNAUTHORIZED', 401);
  }
}

class CommandTimeoutError extends ServerError {
  constructor(commandId) {
    super(`Command ${commandId} timeout`, 'COMMAND_TIMEOUT', 408);
  }
}

// ========== UTILIDADES ==========

/**
 * Generar ID único
 */
function generateId(prefix = 'id') {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Formatear información del dispositivo para transmisión
 */
function formatDeviceInfo(device) {
  return {
    id: device.id,
    type: device.type,
    model: device.model || 'Unknown',
    platform: device.platform || 'android',
    osVersion: device.osVersion || 'Unknown',
    battery: device.battery || 0,
    signal: device.signal || 0,
    status: device.status || 'UNKNOWN',
    capabilities: device.capabilities || [],
    lastSeen: device.lastSeen || new Date().toISOString(),
  };
}

/**
 * Limpiar datos sensibles antes de enviar
 */
function sanitizeDevice(device) {
  const sanitized = { ...device };
  delete sanitized.ownerUid;
  delete sanitized.accessToken;
  delete sanitized.secret;
  return sanitized;
}

/**
 * Delay asincrónico
 */
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Reintentos con backoff exponencial
 */
async function retryWithBackoff(
  fn,
  maxRetries = 3,
  initialDelay = 1000
) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;

      const delayMs = initialDelay * Math.pow(2, i);
      logWarn(`Retry attempt ${i + 1}/${maxRetries} after ${delayMs}ms`, {
        error: error.message,
      });

      await delay(delayMs);
    }
  }
}

module.exports = {
  // Logging
  log,
  logInfo,
  logError,
  logWarn,
  logDebug,
  LogLevel,

  // Validación
  validateDevice,
  validateCommand,
  validateAuth,

  // Errores
  ServerError,
  DeviceNotFoundError,
  UnauthorizedError,
  CommandTimeoutError,

  // Utilidades
  generateId,
  formatDeviceInfo,
  sanitizeDevice,
  delay,
  retryWithBackoff,
};
