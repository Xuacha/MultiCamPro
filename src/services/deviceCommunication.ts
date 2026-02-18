/**
 * Servicio de Comunicación - MultiCamPro Controlador
 * 
 * Maneja:
 * - Conexión con servidor de señalización
 * - Envío de comandos a dispositivos
 * - Recepción de eventos en tiempo real
 * - Estado de conexión
 */

import { io, Socket } from 'socket.io-client';
import {
  DeviceInfo,
  CommandRequest,
  CommandResponse,
  ServerEvent,
  ErrorCode,
  AppError,
  SlaveDeviceInfo,
} from '@/types/communication';

type EventListener<T> = (data: T) => void;

export class DeviceCommunicationService {
  private socket: Socket | null = null;
  private serverUrl: string;
  private userId: string = '';
  private controllerId: string = '';
  private isConnected: boolean = false;

  // Event listeners
  private listeners: Map<string, Set<EventListener<any>>> = new Map();

  constructor(serverUrl: string = 'http://localhost:3000') {
    this.serverUrl = serverUrl;
  }

  /**
   * Conectar con servidor y registrar dispositivo controlador
   */
  async connect(userId: string, controllerDeviceId: string, accessToken: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.userId = userId;
        this.controllerId = controllerDeviceId;

        const socket = io(this.serverUrl, {
          reconnection: true,
          reconnectionDelay: 5000,
          reconnectionDelayMax: 30000,
          reconnectionAttempts: 10,
          extraHeaders: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        // ========== CONEXIÓN ==========

        socket.on('connect', () => {
          console.log('[COMMUNICATION] ✓ Conectado al servidor');
          this.isConnected = true;
          this.registerController(controllerDeviceId, accessToken);
          this.emit('connected', {});
          resolve();
        });

        socket.on('disconnect', (reason) => {
          console.log(`[COMMUNICATION] ✗ Desconectado: ${reason}`);
          this.isConnected = false;
          this.emit('disconnected', { reason });
        });

        socket.on('connect_error', (error) => {
          console.error('[COMMUNICATION] Error de conexión:', error.message);
          this.emit('error', { message: error.message });
          reject(error);
        });

        socket.on('error', (error) => {
          console.error('[COMMUNICATION] Error:', error);
          this.emit('error', error);
        });

        // ========== REGISTRACIÓN ==========

        socket.on('registration-confirmed', (data) => {
          console.log('[COMMUNICATION] ✓ Registro confirmado');
          this.emit('registration-confirmed', data);
        });

        // ========== DISPOSITIVOS ==========

        socket.on('device-list-updated', (data) => {
          console.log('[COMMUNICATION] 📋 Lista de dispositivos actualizada');
          this.emit('device-list-updated', data);
        });

        socket.on('device-connected', (data) => {
          console.log(`[COMMUNICATION] 📱 Dispositivo conectado: ${data.deviceId}`);
          this.emit('device-connected', data);
        });

        socket.on('device-disconnected', (data) => {
          console.log(`[COMMUNICATION] 📱 Dispositivo desconectado: ${data.deviceId}`);
          this.emit('device-disconnected', data);
        });

        socket.on('device-status-updated', (data) => {
          console.log(`[COMMUNICATION] 🔄 Estado actualizado: ${data.deviceId}`);
          this.emit('device-status-updated', data);
        });

        // ========== COMANDOS ==========

        socket.on('command-result', (data) => {
          console.log(`[COMMUNICATION] 📥 Resultado de comando: ${data.commandType}`);
          this.emit('command-result', data);
        });

        socket.on('command-queued', (data) => {
          console.log(
            `[COMMUNICATION] ⏳ Comando en cola (tamaño: ${data.queueSize})`
          );
          this.emit('command-queued', data);
        });

        this.socket = socket;
      } catch (error) {
        console.error('[COMMUNICATION] Error inicializando:', error);
        reject(error);
      }
    });
  }

  /**
   * Desconectar del servidor
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.isConnected = false;
  }

  /**
   * Registrar dispositivo controlador
   */
  private registerController(controllerId: string, accessToken: string): void {
    if (!this.socket) return;

    this.socket.emit('register-controller', {
      controllerId,
      ownerUid: this.userId,
      accessToken,
      platform: 'react-native',
    });
  }

  /**
   * Obtener lista de dispositivos
   */
  async getDeviceList(): Promise<SlaveDeviceInfo[]> {
    return new Promise((resolve, reject) => {
      if (!this.socket?.connected) {
        reject(new AppError(ErrorCode.CONNECTION_ERROR, 'Not connected to server'));
        return;
      }

      const timeout = setTimeout(() => {
        reject(new AppError(ErrorCode.COMMAND_TIMEOUT, 'Device list request timeout'));
      }, 5000);

      const listener = (data: { devices: SlaveDeviceInfo[] }) => {
        clearTimeout(timeout);
        this.removeEventListener('device-list', listener);
        resolve(data.devices);
      };

      this.addEventListener('device-list', listener);
      this.socket.emit('get-device-list', { ownerUid: this.userId });
    });
  }

  /**
   * Enviar comando a dispositivo
   */
  async sendCommand(
    targetDeviceId: string,
    commandType: string,
    commandData?: Record<string, any>,
    timeout: number = 10000
  ): Promise<CommandResponse> {
    return new Promise((resolve, reject) => {
      if (!this.socket?.connected) {
        reject(
          new AppError(
            ErrorCode.CONNECTION_ERROR,
            'Not connected to server'
          )
        );
        return;
      }

      const commandId = `cmd-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      const timeoutId = setTimeout(() => {
        this.removeEventListener(`command-${commandId}`, listener);
        reject(
          new AppError(
            ErrorCode.COMMAND_TIMEOUT,
            `Command ${commandType} timeout after ${timeout}ms`
          )
        );
      }, timeout);

      const listener = (response: CommandResponse) => {
        clearTimeout(timeoutId);
        this.removeEventListener(`command-${commandId}`, listener);

        if (response.error) {
          reject(new AppError(ErrorCode.UNKNOWN, response.error, response));
        } else {
          resolve(response);
        }
      };

      this.addEventListener(`command-${commandId}`, listener);

      // Enviar comando
      this.socket.emit('send-command', {
        targetDeviceId,
        commandId,
        commandType,
        commandData,
        controllerUid: this.userId,
      });

      console.log(`[COMMUNICATION] 📤 Comando enviado: ${commandType} → ${targetDeviceId}`);
    });
  }

  /**
   * Enviar comando asincrónico (sin esperar respuesta)
   */
  sendCommandAsync(
    targetDeviceId: string,
    commandType: string,
    commandData?: Record<string, any>
  ): void {
    if (!this.socket?.connected) {
      console.warn('[COMMUNICATION] Not connected, cannot send command');
      return;
    }

    const commandId = `cmd-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    this.socket.emit('send-command', {
      targetDeviceId,
      commandId,
      commandType,
      commandData,
      controllerUid: this.userId,
    });
  }

  /**
   * Registrar listener para evento
   */
  addEventListener<T = any>(event: string, listener: EventListener<T>): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener);
  }

  /**
   * Remover listener de evento
   */
  removeEventListener<T = any>(event: string, listener: EventListener<T>): void {
    const listeners = this.listeners.get(event);
    if (listeners) {
      listeners.delete(listener);
    }
  }

  /**
   * Emitir evento interno
   */
  private emit<T = any>(event: string, data: T): void {
    const listeners = this.listeners.get(event);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(data);
        } catch (error) {
          console.error(`Error in listener for ${event}:`, error);
        }
      });
    }
  }

  /**
   * Obtener estado de conexión
   */
  getConnectionStatus(): {
    isConnected: boolean;
    socketId: string | null;
  } {
    return {
      isConnected: this.isConnected,
      socketId: this.socket?.id || null,
    };
  }

  /**
   * Reconectar manualmente
   */
  reconnect(): void {
    if (!this.socket) return;

    if (!this.socket.connected) {
      this.socket.connect();
    }
  }
}

// ========== SINGLETON ==========

let instance: DeviceCommunicationService | null = null;

export function getDeviceCommunicationService(
  serverUrl?: string
): DeviceCommunicationService {
  if (!instance) {
    instance = new DeviceCommunicationService(serverUrl);
  }
  return instance;
}
