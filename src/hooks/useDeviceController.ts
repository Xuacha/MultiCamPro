/**
 * useDeviceController Hook
 * Main hook for managing device control and streaming
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { DeviceInfo, DeviceStatus, StreamSession, CommandType, CommandResponse, ControllerSettings } from '../types/controller';
import { useCommunication } from './useCommunication';

interface UseDeviceControllerReturn {
  // State
  devices: DeviceInfo[];
  selectedDevice: DeviceInfo | null;
  activeStreams: StreamSession[];
  isLoading: boolean;
  error: string | null;
  
  // Device management
  selectDevice: (deviceId: string) => void;
  refreshDevices: () => Promise<void>;
  getDeviceInfo: (deviceId: string) => Promise<DeviceInfo | null>;
  
  // Command execution
  sendCommand: (deviceId: string, command: CommandType, parameters?: Record<string, any>) => Promise<CommandResponse>;
  sendBatchCommand: (deviceIds: string[], command: CommandType, parameters?: Record<string, any>) => Promise<CommandResponse[]>;
  
  // Streaming management
  startStream: (deviceId: string, rtmpUrl: string, quality: 'low' | 'medium' | 'high') => Promise<string>;
  stopStream: (deviceId: string) => Promise<void>;
  changeStreamQuality: (deviceId: string, quality: 'low' | 'medium' | 'high') => Promise<void>;
  
  // Settings
  settings: ControllerSettings;
  updateSettings: (settings: Partial<ControllerSettings>) => void;
}

export const useDeviceController = (): UseDeviceControllerReturn => {
  const [devices, setDevices] = useState<DeviceInfo[]>([]);
  const [selectedDevice, setSelectedDeviceState] = useState<DeviceInfo | null>(null);
  const [activeStreams, setActiveStreams] = useState<StreamSession[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [settings, setSettings] = useState<ControllerSettings>({
    streaming: {
      defaultQuality: 'medium',
      maxBitrate: 10000,
      autoAdaptQuality: true,
      enablePreview: true,
      previewQuality: 'low',
      reconnectAttempts: 3,
      commandTimeout: 30000,
    },
    notifications: {
      deviceConnected: true,
      deviceDisconnected: true,
      streamStarted: true,
      streamStopped: true,
      commandCompleted: false,
      commandFailed: true,
      batteryLow: true,
      storageWarning: true,
    },
    autoGroupDevices: true,
    refreshInterval: 5000,
    themeMode: 'auto',
    language: 'es',
  });

  const { sendCommand: socketSendCommand, devices: socketDevices } = useCommunication();
  const refreshTimeoutRef = useRef<NodeJS.Timer>();

  // Sync devices from socket communication
  useEffect(() => {
    if (socketDevices && socketDevices.length > 0) {
      // Map socket devices to our device format
      const mappedDevices = socketDevices.map(device => ({
        ...device,
        status: device.status || DeviceStatus.OFFLINE,
      }));
      setDevices(mappedDevices);
    }
  }, [socketDevices]);

  // Auto-refresh devices
  useEffect(() => {
    const autoRefresh = () => {
      refreshDevices().catch(err => {
        console.error('Auto-refresh failed:', err);
      });
    };

    refreshTimeoutRef.current = setInterval(
      autoRefresh,
      settings.refreshInterval
    );

    return () => {
      if (refreshTimeoutRef.current) {
        clearInterval(refreshTimeoutRef.current);
      }
    };
  }, [settings.refreshInterval]);

  const selectDevice = useCallback((deviceId: string) => {
    const device = devices.find(d => d.deviceId === deviceId) || null;
    setSelectedDeviceState(device);
  }, [devices]);

  const refreshDevices = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // In real scenario, this would call the backend to get device list
      // For now, we'll just refresh the socket devices
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to refresh devices';
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getDeviceInfo = useCallback(async (deviceId: string): Promise<DeviceInfo | null> => {
    try {
      const response = await socketSendCommand(deviceId, 'GET_DEVICE_INFO', {});
      if (response && response.status === 'success') {
        return response.result as DeviceInfo;
      }
      return null;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to get device info';
      setError(errorMsg);
      return null;
    }
  }, [socketSendCommand]);

  const sendCommand = useCallback(
    async (
      deviceId: string,
      command: CommandType,
      parameters?: Record<string, any>
    ): Promise<CommandResponse> => {
      setError(null);
      try {
        const response = await socketSendCommand(deviceId, command, parameters);
        
        return {
          commandId: `cmd-${Date.now()}`,
          deviceId,
          status: response?.status || 'failed',
          result: response?.result,
          error: response?.error,
          completedAt: Date.now(),
          executionTime: response?.executionTime || 0,
        };
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Command execution failed';
        setError(errorMsg);
        return {
          commandId: `cmd-${Date.now()}`,
          deviceId,
          status: 'failed',
          error: errorMsg,
          completedAt: Date.now(),
          executionTime: 0,
        };
      }
    },
    [socketSendCommand]
  );

  const sendBatchCommand = useCallback(
    async (
      deviceIds: string[],
      command: CommandType,
      parameters?: Record<string, any>
    ): Promise<CommandResponse[]> => {
      const results: CommandResponse[] = [];
      
      for (const deviceId of deviceIds) {
        try {
          const result = await sendCommand(deviceId, command, parameters);
          results.push(result);
        } catch (err) {
          const errorMsg = err instanceof Error ? err.message : 'Batch command failed';
          results.push({
            commandId: `cmd-${Date.now()}-${deviceId}`,
            deviceId,
            status: 'failed',
            error: errorMsg,
            completedAt: Date.now(),
            executionTime: 0,
          });
        }
      }
      
      return results;
    },
    [sendCommand]
  );

  const startStream = useCallback(
    async (
      deviceId: string,
      rtmpUrl: string,
      quality: 'low' | 'medium' | 'high'
    ): Promise<string> => {
      try {
        const response = await sendCommand(deviceId, CommandType.START_STREAM, {
          rtmpUrl,
          quality,
          cameraId: 'back',
        });

        if (response.status === 'success' && response.result?.sessionId) {
          const session: StreamSession = {
            sessionId: response.result.sessionId,
            deviceId,
            rtmpUrl,
            quality: quality as any,
            status: 'streaming',
            startedAt: Date.now(),
            duration: 0,
            bitrate: 0,
            frameRate: 30,
            resolution: quality === 'low' ? '640x480' : quality === 'medium' ? '1280x720' : '1920x1080',
          };
          
          setActiveStreams(prev => [...prev, session]);
          return response.result.sessionId;
        }
        throw new Error(response.error || 'Failed to start stream');
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Stream startup failed';
        setError(errorMsg);
        throw err;
      }
    },
    [sendCommand]
  );

  const stopStream = useCallback(
    async (deviceId: string) => {
      try {
        await sendCommand(deviceId, CommandType.STOP_STREAM, {});
        setActiveStreams(prev => prev.filter(s => s.deviceId !== deviceId));
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to stop stream';
        setError(errorMsg);
        throw err;
      }
    },
    [sendCommand]
  );

  const changeStreamQuality = useCallback(
    async (deviceId: string, quality: 'low' | 'medium' | 'high') => {
      try {
        await sendCommand(deviceId, CommandType.CHANGE_QUALITY, { quality });
        
        // Update active stream quality
        setActiveStreams(prev =>
          prev.map(s =>
            s.deviceId === deviceId
              ? { ...s, quality: quality as any }
              : s
          )
        );
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Quality change failed';
        setError(errorMsg);
        throw err;
      }
    },
    [sendCommand]
  );

  const updateSettings = useCallback((newSettings: Partial<ControllerSettings>) => {
    setSettings(prev => ({
      ...prev,
      ...newSettings,
    }));
  }, []);

  return {
    devices,
    selectedDevice,
    activeStreams,
    isLoading,
    error,
    selectDevice,
    refreshDevices,
    getDeviceInfo,
    sendCommand,
    sendBatchCommand,
    startStream,
    stopStream,
    changeStreamQuality,
    settings,
    updateSettings,
  };
};
