/**
 * Tipos TypeScript para MultiCamPro
 * Definiciones de interfaces para comunicación y estado
 */

// ========== DISPOSITIVOS ==========

export interface SlaveDeviceInfo {
  id: string;
  type: 'slave';
  model: string;
  manufacturer: string;
  android: string;
  ownerUid: string;
  status: 'IDLE' | 'RECORDING' | 'STREAMING' | 'CAPTURING' | 'DISCONNECTED';
  battery: number;
  signal: number;
  capabilities: string[];
  lastSeen: string; // ISO timestamp
}

export interface ControllerDeviceInfo {
  id: string;
  type: 'controller';
  platform: 'iOS' | 'Android' | 'Web' | 'macOS' | 'Windows';
  ownerUid: string;
  status: 'ACTIVE' | 'IDLE' | 'DISCONNECTED';
  lastSeen: string;
}

export type DeviceInfo = SlaveDeviceInfo | ControllerDeviceInfo;

// ========== COMANDOS ==========

export interface CommandRequest {
  commandId: string;
  commandType: CommandType;
  commandData?: Record<string, any>;
  priority?: 'normal' | 'high';
  timestamp: number;
}

export interface CommandResponse {
  commandId: string;
  commandType: CommandType;
  deviceId: string;
  response?: Record<string, any>;
  error?: string;
  timestamp: number;
}

export type CommandType =
  | 'TAKE_PHOTO'
  | 'START_VIDEO'
  | 'STOP_VIDEO'
  | 'START_STREAM'
  | 'STOP_STREAM'
  | 'GET_BATTERY'
  | 'GET_LOCATION'
  | 'TOGGLE_FLASHLIGHT'
  | 'GET_DEVICE_INFO'
  | 'SHUTDOWN';

// ========== REGISTRO ==========

export interface SlaveRegistration {
  deviceId: string;
  ownerUid: string;
  accessToken: string;
  model: string;
  manufacturer: string;
  battery: number;
  capabilities: string[];
}

export interface ControllerRegistration {
  controllerId: string;
  ownerUid: string;
  accessToken: string;
  platform: string;
}

// ========== EVENTOS WEBSOCKET ==========

export interface WebSocketEvent {
  type: string;
  timestamp: number;
  data: any;
}

// Client → Server
export interface ClientEvent {
  type:
    | 'register-slave'
    | 'register-controller'
    | 'send-command'
    | 'command-response'
    | 'update-status'
    | 'get-device-list'
    | 'get-command-queue';
  data: any;
}

// Server → Client
export interface ServerEvent {
  type:
    | 'registration-confirmed'
    | 'device-connected'
    | 'device-disconnected'
    | 'remote-command'
    | 'command-result'
    | 'device-list-updated'
    | 'device-status-updated'
    | 'error'
    | 'server-error';
  data: any;
}

// ========== ESTADO GLOBAL (REDUX/ZUSTAND) ==========

export interface DeviceState {
  byId: Record<string, SlaveDeviceInfo>;
  allIds: string[];
  selectedId: string | null;
}

export interface CommandState {
  pending: Record<string, CommandRequest>; // commandId -> command
  completed: CommandResponse[];
  error: string | null;
}

export interface AppState {
  auth: {
    user: {
      uid: string;
      email: string;
    } | null;
    isLoading: boolean;
    error: string | null;
  };
  connection: {
    isConnected: boolean;
    socketId: string | null;
    lastSync: number;
  };
  devices: DeviceState;
  commands: CommandState;
  ui: {
    selectedDeviceId: string | null;
    isStreaming: boolean;
    streamURL: string | null;
  };
}

// ========== API RESPONSES ==========

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
  timestamp: number;
}

export interface DeviceListResponse {
  devices: SlaveDeviceInfo[];
  total: number;
}

export interface DeviceStatusResponse {
  id: string;
  status: string;
  battery: number;
  signal: number;
  location?: {
    latitude: number;
    longitude: number;
    accuracy: number;
  };
  lastSeen: string;
}

// ========== CONFIGURACIÓN ==========

export interface AppConfig {
  signalingServer: {
    url: string;
    namespace: string;
    reconnectDelay: number;
    reconnectDelayMax: number;
  };
  firebase: {
    apiKey: string;
    authDomain: string;
    projectId: string;
    storageBucket: string;
    messagingSenderId: string;
    appId: string;
    databaseURL: string;
  };
  features: {
    livestream: boolean;
    rtmp: boolean;
    geotagging: boolean;
  };
}

// ========== ERRORES ==========

export enum ErrorCode {
  DEVICE_NOT_FOUND = 'DEVICE_NOT_FOUND',
  UNAUTHORIZED = 'UNAUTHORIZED',
  INVALID_COMMAND = 'INVALID_COMMAND',
  DEVICE_OFFLINE = 'DEVICE_OFFLINE',
  COMMAND_TIMEOUT = 'COMMAND_TIMEOUT',
  CONNECTION_ERROR = 'CONNECTION_ERROR',
  UNKNOWN = 'UNKNOWN'
}

export class AppError extends Error {
  constructor(
    public code: ErrorCode,
    message: string,
    public details?: any
  ) {
    super(message);
  }
}
