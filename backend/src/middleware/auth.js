/**
 * Middleware de Autenticación - Server
 * 
 * Valida tokens JWT y Firebase Auth en Socket.io
 */

const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

/**
 * Middleware de Socket.io para validar token en headers
 */
function socketAuthMiddleware(socket, next) {
  try {
    const token = socket.handshake.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return next(new Error('Missing authentication token'));
    }

    // Verificar JWT (implementación simple)
    // En producción, validar contra Firebase Auth
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      socket.userId = decoded.uid;
      socket.email = decoded.email;
      next();
    } catch (err) {
      return next(new Error('Invalid token'));
    }
  } catch (error) {
    next(new Error('Authentication failed'));
  }
}

module.exports = {
  socketAuthMiddleware,
};
