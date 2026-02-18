/**
 * MultiCamPro Controller UI Types
 * Types for Phase 8: Controller UI & Device Management
 */

// ========== DEVICE MANAGEMENT ==========

export enum DeviceStatus {
  ONLINE = 'online',
  OFFLINE = 'offline',
  CONNECTING = 'connecting',
  ERROR = 'error',
}

export interface DeviceInfo {
  deviceId: string;
  name: string;
  model: string;
  osVersion: string;
  status: DeviceStatus;
  lastSeen: number;
  ownerUid: string;
  batteryLevel: number;
  isCharging: boolean;
  networkType: 'WIFI' | '4G' | '5G' | '3G' | 'OFFLINE';
  storageUsed: number;
  storageTotal: number;
}

export interface DeviceGroup {
  groupId: string;
  name: string;
  devices: DeviceInfo[];
  createdAt: number;
  updatedAt: number;
}

// ========== STREAMING MANAGEMENT ==========

export enum StreamingQuality {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
}

export enum StreamingStatus {
  IDLE = 'idle',
  CONNECTING = 'connecting',
  STREAMING = 'streaming',
  PAUSED = 'paused',
  STOPPING = 'stopping',
  ERROR = 'error',
}

export interface StreamSession {
  sessionId: string;
  deviceId: string;
  rtmpUrl: string;
  quality: StreamingQuality;
  status: StreamingStatus;
  startedAt: number;
  duration: number;
  bitrate: number;
  frameRate: number;
  resolution: string;
  viewers?: number;
}

export interface StreamPreview {
  streamId: string;
  deviceId: string;
  deviceName: string;
  thumbnailUrl?: string;
  isLive: boolean;
  quality: StreamingQuality;
  viewers?: number;
  duration?: number;
}

// ========== RECORDING MANAGEMENT ==========

export enum RecordingStatus {
  IDLE = 'idle',
  RECORDING = 'recording',
  PAUSED = 'paused',
  STOPPED = 'stopped',
}

export interface RecordingSession {
  recordingId: string;
  deviceId: string;
  startedAt: number;
  duration: number;
  status: RecordingStatus;
  size: number;
  quality: StreamingQuality;
  format: 'MP4' | 'MOV' | 'WebM';
  path: string;
}

// ========== FILE MANAGEMENT ==========

export enum FileType {
  VIDEO = 'video',
  PHOTO = 'photo',
  AUDIO = 'audio',
  DOCUMENT = 'document',
  FOLDER = 'folder',
  OTHER = 'other',
}

export interface FileInfo {
  fileId: string;
  name: string;
  type: FileType;
  size: number;
  createdAt: number;
  modifiedAt: number;
  path: string;
  deviceId: string;
  isFolder: boolean;
  children?: FileInfo[];
}

export interface DirectoryListing {
  currentPath: string;
  files: FileInfo[];
  totalSize: number;
  fileCount: number;
}

// ========== COMMAND MANAGEMENT ==========

export enum CommandType {
  // Media commands
  TAKE_PHOTO = 'TAKE_PHOTO',
  START_VIDEO = 'START_VIDEO',
  STOP_VIDEO = 'STOP_VIDEO',
  
  // Location commands
  GET_LOCATION = 'GET_LOCATION',
  START_TRACKING = 'START_TRACKING',
  STOP_TRACKING = 'STOP_TRACKING',
  
  // Audio commands
  START_AUDIO = 'START_AUDIO',
  STOP_AUDIO = 'STOP_AUDIO',
  
  // Stream commands
  START_STREAM = 'START_STREAM',
  STOP_STREAM = 'STOP_STREAM',
  CHANGE_QUALITY = 'CHANGE_QUALITY',
  
  // System commands
  GET_DEVICE_INFO = 'GET_DEVICE_INFO',
  GET_BATTERY = 'GET_BATTERY',
  GET_STORAGE = 'GET_STORAGE',
  TOGGLE_FLASHLIGHT = 'TOGGLE_FLASHLIGHT',
  
  // File commands
  LIST_FILES = 'LIST_FILES',
  DELETE_FILE = 'DELETE_FILE',
  DOWNLOAD_FILE = 'DOWNLOAD_FILE',
}

export enum CommandStatus {
  PENDING = 'pending',
  SENT = 'sent',
  EXECUTING = 'executing',
  SUCCESS = 'success',
  FAILED = 'failed',
  TIMEOUT = 'timeout',
}

export interface CommandRequest {
  commandId: string;
  deviceId: string;
  type: CommandType;
  parameters?: Record<string, any>;
  priority: 'high' | 'normal' | 'low';
  timeout: number;
  createdAt: number;
}

export interface CommandResponse {
  commandId: string;
  deviceId: string;
  status: CommandStatus;
  result?: Record<string, any>;
  error?: string;
  completedAt: number;
  executionTime: number;
}

// ========== SETTINGS & CONFIGURATION ==========

export interface StreamingSettings {
  defaultQuality: StreamingQuality;
  maxBitrate: number;
  autoAdaptQuality: boolean;
  enablePreview: boolean;
  previewQuality: StreamingQuality;
  reconnectAttempts: number;
  commandTimeout: number;
}

export interface NotificationSettings {
  deviceConnected: boolean;
  deviceDisconnected: boolean;
  streamStarted: boolean;
  streamStopped: boolean;
  commandCompleted: boolean;
  commandFailed: boolean;
  batteryLow: boolean;
  storageWarning: boolean;
}

export interface ControllerSettings {
  streaming: StreamingSettings;
  notifications: NotificationSettings;
  autoGroupDevices: boolean;
  refreshInterval: number;
  themeMode: 'light' | 'dark' | 'auto';
  language: string;
}

// ========== UI STATE ==========

export interface ControllerUIState {
  selectedDeviceId: string | null;
  selectedGroupId: string | null;
  activeStreamId: string | null;
  showPreviewGrid: boolean;
  showCommandPanel: boolean;
  showFileManager: boolean;
  showSettings: boolean;
  isPanelCollapsed: boolean;
}

export interface ControllerViewMode {
  mode: 'list' | 'grid' | 'tree';
  sortBy: 'name' | 'status' | 'battery' | 'storage';
  filterStatus?: DeviceStatus;
  searchQuery?: string;
}

// ========== DASHBOARD ANALYTICS ==========

export interface DeviceMetrics {
  deviceId: string;
  avgBattery: number;
  avgNetworkLatency: number;
  totalCommandsSent: number;
  successRate: number;
  streamsCompleted: number;
  totalStreamDuration: number;
  storageUtilization: number;
  lastErrorTime?: number;
  lastErrorMessage?: string;
}

export interface SessionStatistics {
  totalSessions: number;
  activeSessions: number;
  totalViewers: number;
  totalBandwidth: number;
  avgQuality: StreamingQuality;
  peakBitrate: number;
  successRate: number;
}

// ========== NOTIFICATIONS ==========

export enum NotificationType {
  INFO = 'info',
  SUCCESS = 'success',
  WARNING = 'warning',
  ERROR = 'error',
}

export interface Notification {
  notificationId: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
  deviceId?: string;
  actionUrl?: string;
}

// ========== PERMISSION MODELS ==========

export enum PermissionLevel {
  OWNER = 'owner',
  ADMIN = 'admin',
  OPERATOR = 'operator',
  VIEWER = 'viewer',
}

export interface DevicePermission {
  userId: string;
  deviceId: string;
  permissionLevel: PermissionLevel;
  grantedAt: number;
  expiresAt?: number;
  canStream: boolean;
  canRecord: boolean;
  canDelete: boolean;
  canShare: boolean;
}

// ========== BATCH OPERATIONS ==========

export interface BatchCommand {
  batchId: string;
  deviceIds: string[];
  command: CommandType;
  parameters?: Record<string, any>;
  createdAt: number;
  totalDevices: number;
  successCount: number;
  failureCount: number;
  status: 'pending' | 'executing' | 'completed';
}

export interface BatchResult {
  batchId: string;
  deviceId: string;
  status: CommandStatus;
  result?: Record<string, any>;
  error?: string;
}
