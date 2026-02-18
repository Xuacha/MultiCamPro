/**
 * Hook de React - Para comunicación con servidor de señalización
 * 
 * Proporciona:
 * - Conexión/desconexión con servidor
 * - Envío de comandos
 * - Escucha de eventos
 * - Manejo de estado de conexión
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import {
  DeviceCommunicationService,
  getDeviceCommunicationService,
} from '@/services/deviceCommunication';
import {
  SlaveDeviceInfo,
  CommandResponse,
  ErrorCode,
  AppError,
} from '@/types/communication';

interface UseCommunicationOptions {
  serverUrl?: string;
  autoConnect?: boolean;
}

export function useCommunication(options: UseCommunicationOptions = {}) {
  const { serverUrl = 'http://localhost:3000', autoConnect = false } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<AppError | null>(null);
  const [devices, setDevices] = useState<SlaveDeviceInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const serviceRef = useRef<DeviceCommunicationService | null>(null);
  const connectedRef = useRef(false);

  // Inicializar servicio
  useEffect(() => {
    serviceRef.current = getDeviceCommunicationService(serverUrl);
    return () => {
      if (connectedRef.current) {
        serviceRef.current?.disconnect();
      }
    };
  }, [serverUrl]);

  // Manejo de cambios de conexión
  const handleConnected = useCallback(() => {
    setIsConnected(true);
    connectedRef.current = true;
    setError(null);
  }, []);

  const handleDisconnected = useCallback(() => {
    setIsConnected(false);
    connectedRef.current = false;
  }, []);

  const handleError = useCallback((error: any) => {
    const appError = error instanceof AppError
      ? error
      : new AppError(ErrorCode.UNKNOWN, error?.message || 'Unknown error', error);
    setError(appError);
    setIsConnected(false);
  }, []);

  const handleDeviceListUpdated = useCallback((data: { devices: SlaveDeviceInfo[] }) => {
    setDevices(data.devices);
  }, []);

  const handleDeviceConnected = useCallback((data: SlaveDeviceInfo) => {
    setDevices(prev => {
      const exists = prev.some(d => d.id === data.id);
      if (exists) {
        return prev.map(d => (d.id === data.id ? data : d));
      }
      return [...prev, data];
    });
  }, []);

  const handleDeviceDisconnected = useCallback((data: { deviceId: string }) => {
    setDevices(prev => prev.filter(d => d.id !== data.deviceId));
  }, []);

  const handleDeviceStatusUpdated = useCallback((data: SlaveDeviceInfo) => {
    setDevices(prev =>
      prev.map(d => (d.id === data.id ? { ...d, ...data } : d))
    );
  }, []);

  // Registrar listeners
  useEffect(() => {
    if (!serviceRef.current) return;

    serviceRef.current.addEventListener('connected', handleConnected);
    serviceRef.current.addEventListener('disconnected', handleDisconnected);
    serviceRef.current.addEventListener('error', handleError);
    serviceRef.current.addEventListener('device-list-updated', handleDeviceListUpdated);
    serviceRef.current.addEventListener('device-connected', handleDeviceConnected);
    serviceRef.current.addEventListener('device-disconnected', handleDeviceDisconnected);
    serviceRef.current.addEventListener('device-status-updated', handleDeviceStatusUpdated);

    return () => {
      if (!serviceRef.current) return;

      serviceRef.current.removeEventListener('connected', handleConnected);
      serviceRef.current.removeEventListener('disconnected', handleDisconnected);
      serviceRef.current.removeEventListener('error', handleError);
      serviceRef.current.removeEventListener('device-list-updated', handleDeviceListUpdated);
      serviceRef.current.removeEventListener('device-connected', handleDeviceConnected);
      serviceRef.current.removeEventListener('device-disconnected', handleDeviceDisconnected);
      serviceRef.current.removeEventListener('device-status-updated', handleDeviceStatusUpdated);
    };
  }, [
    handleConnected,
    handleDisconnected,
    handleError,
    handleDeviceListUpdated,
    handleDeviceConnected,
    handleDeviceDisconnected,
    handleDeviceStatusUpdated,
  ]);

  // Auto-connect si se especifica
  useEffect(() => {
    if (autoConnect && !connectedRef.current) {
      // Auto-connect sería útil después de auth
      // Por ahora solo inicializamos
    }
  }, [autoConnect]);

  // ========== MÉTODOS ==========

  const connect = useCallback(
    async (userId: string, controllerId: string, accessToken: string) => {
      try {
        if (!serviceRef.current) {
          throw new Error('Service not initialized');
        }

        setError(null);
        setIsLoading(true);

        await serviceRef.current.connect(userId, controllerId, accessToken);
        connectedRef.current = true;

        // Cargar lista de dispositivos
        const deviceList = await serviceRef.current.getDeviceList();
        setDevices(deviceList);
      } catch (err) {
        const appError = err instanceof AppError
          ? err
          : new AppError(ErrorCode.CONNECTION_ERROR, 'Failed to connect', err);
        setError(appError);
        throw appError;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const disconnect = useCallback(() => {
    if (serviceRef.current) {
      serviceRef.current.disconnect();
      connectedRef.current = false;
    }
  }, []);

  const sendCommand = useCallback(
    async (
      targetDeviceId: string,
      commandType: string,
      commandData?: Record<string, any>,
      timeout?: number
    ): Promise<CommandResponse> => {
      if (!serviceRef.current) {
        throw new AppError(ErrorCode.CONNECTION_ERROR, 'Service not initialized');
      }

      try {
        const response = await serviceRef.current.sendCommand(
          targetDeviceId,
          commandType,
          commandData,
          timeout
        );
        setError(null);
        return response;
      } catch (err) {
        const appError = err instanceof AppError
          ? err
          : new AppError(ErrorCode.COMMAND_TIMEOUT, 'Command failed', err);
        setError(appError);
        throw appError;
      }
    },
    []
  );

  const sendCommandAsync = useCallback(
    (
      targetDeviceId: string,
      commandType: string,
      commandData?: Record<string, any>
    ) => {
      if (!serviceRef.current) {
        console.warn('Service not initialized');
        return;
      }

      serviceRef.current.sendCommandAsync(targetDeviceId, commandType, commandData);
    },
    []
  );

  const getDeviceList = useCallback(async () => {
    if (!serviceRef.current) {
      throw new AppError(ErrorCode.CONNECTION_ERROR, 'Service not initialized');
    }

    try {
      const list = await serviceRef.current.getDeviceList();
      setDevices(list);
      return list;
    } catch (err) {
      const appError = err instanceof AppError
        ? err
        : new AppError(ErrorCode.DEVICE_NOT_FOUND, 'Failed to get device list', err);
      setError(appError);
      throw appError;
    }
  }, []);

  const reconnect = useCallback(() => {
    if (serviceRef.current) {
      serviceRef.current.reconnect();
    }
  }, []);

  return {
    // Estado
    isConnected,
    isLoading,
    error,
    devices,

    // Métodos
    connect,
    disconnect,
    reconnect,
    sendCommand,
    sendCommandAsync,
    getDeviceList,

    // Utilidades
    getConnectionStatus: () => serviceRef.current?.getConnectionStatus() || { isConnected: false, socketId: null },
  };
}

/**
 * Hook para enviar comando a un dispositivo específico
 */
export function useSendCommand() {
  const { sendCommand } = useCommunication();

  return {
    takePhoto: (deviceId: string) =>
      sendCommand(deviceId, 'TAKE_PHOTO'),

    startVideo: (deviceId: string, duration?: number) =>
      sendCommand(deviceId, 'START_VIDEO', { duration }),

    stopVideo: (deviceId: string) =>
      sendCommand(deviceId, 'STOP_VIDEO'),

    startStream: (deviceId: string, quality: string = 'medium') =>
      sendCommand(deviceId, 'START_STREAM', { quality }),

    stopStream: (deviceId: string) =>
      sendCommand(deviceId, 'STOP_STREAM'),

    getBattery: (deviceId: string) =>
      sendCommand(deviceId, 'GET_BATTERY'),

    getLocation: (deviceId: string) =>
      sendCommand(deviceId, 'GET_LOCATION'),

    toggleFlashlight: (deviceId: string, enabled: boolean) =>
      sendCommand(deviceId, 'TOGGLE_FLASHLIGHT', { enabled }),

    getDeviceInfo: (deviceId: string) =>
      sendCommand(deviceId, 'GET_DEVICE_INFO'),

    restartApp: (deviceId: string) =>
      sendCommand(deviceId, 'RESTART_APP'),
  };
}
