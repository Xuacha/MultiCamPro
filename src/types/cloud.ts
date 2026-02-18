/**
 * Fase 9: Cloud Storage Integration
 * Tipos y interfaces para gestión de almacenamiento en la nube
 */

// ============================================================================
// Storage Status & Config Enums
// ============================================================================

export enum CloudStorageStatus {
  IDLE = 'idle',
  UPLOADING = 'uploading',
  DOWNLOADING = 'downloading',
  SYNCING = 'syncing',
  PAUSED = 'paused',
  ERROR = 'error',
}

export enum UploadPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export enum SyncMode {
  MANUAL = 'manual',
  AUTO = 'auto',
  SCHEDULED = 'scheduled',
}

export enum FileAccessLevel {
  PRIVATE = 'private',
  SHARED = 'shared',
  PUBLIC = 'public',
}

export enum CloudStorageProvider {
  FIREBASE = 'firebase',
  GOOGLE_DRIVE = 'google-drive',
  AWS_S3 = 'aws-s3',
  AZURE = 'azure',
}

// ============================================================================
// Cloud File & Metadata Types
// ============================================================================

export interface CloudFile {
  readonly id: string;
  readonly name: string;
  readonly size: number; // bytes
  readonly mimeType: string;
  readonly uploadedAt: number; // timestamp
  readonly cloudPath: string;
  readonly localPath?: string;
  readonly md5Hash?: string;
  readonly accessLevel: FileAccessLevel;
  readonly sharedWith?: string[]; // user IDs
}

export interface CloudFileMetadata {
  readonly fileId: string;
  readonly cloudFile: CloudFile;
  readonly uploadProgress: number; // 0-100
  readonly status: CloudStorageStatus;
  readonly uploadStartTime?: number;
  readonly uploadEndTime?: number;
  readonly errorMessage?: string;
  readonly retryCount: number;
}

export interface CloudAlbum {
  readonly id: string;
  readonly name: string;
  readonly description?: string;
  readonly createdAt: number;
  readonly updatedAt: number;
  readonly coverImage?: string; // file ID
  readonly files: CloudFile[];
  readonly totalSize: number; // bytes
  readonly fileCount: number;
  readonly isPrivate: boolean;
  readonly owner: string; // user ID
  readonly sharedWith?: Array<{
    userId: string;
    accessLevel: 'view' | 'edit';
  }>;
}

export interface SharedAlbumInvite {
  readonly id: string;
  readonly albumId: string;
  readonly albumName: string;
  readonly invitedBy: string; // user ID
  readonly invitedAt: number;
  readonly expiresAt?: number;
  readonly accessLevel: 'view' | 'edit';
  readonly status: 'pending' | 'accepted' | 'rejected' | 'expired';
  readonly recipientEmail?: string;
}

// ============================================================================
// Cloud Storage Settings
// ============================================================================

export interface CloudStorageSettings {
  readonly enabled: boolean;
  readonly provider: CloudStorageProvider;
  readonly autoUpload: boolean;
  readonly syncMode: SyncMode;
  readonly uploadPriority: UploadPriority;
  readonly uploadOnCellular: boolean;
  readonly uploadOnlyWifi: boolean;
  readonly maxUploadSize: number; // bytes
  readonly batchUploadSize: number; // number of files
  readonly retryAttempts: number;
  readonly retryDelayMs: number;
  readonly compressionEnabled: boolean;
  readonly compressionQuality: number; // 0-100
}

export interface AutoUploadPolicy {
  readonly enabled: boolean;
  readonly uploadOnCellular: boolean;
  readonly uploadOnlyWifi: boolean;
  readonly chargeRequired: boolean; // phone must be charging
  readonly schedules?: Array<{
    startTime: string; // HH:mm
    endTime: string; // HH:mm
    daysOfWeek: number[]; // 0-6
  }>;
}

export interface UploadSchedule {
  readonly id: string;
  readonly name: string;
  readonly enabled: boolean;
  readonly startTime: string; // HH:mm
  readonly endTime: string; // HH:mm
  readonly daysOfWeek: number[]; // 0=Sunday, 6=Saturday
  readonly uploadPriority: UploadPriority;
  readonly filterByType?: string[]; // MIME types
  readonly filterBySize?: {
    min: number;
    max: number;
  };
}

// ============================================================================
// Upload & Download Management
// ============================================================================

export interface UploadTask {
  readonly id: string;
  readonly fileId: string;
  readonly localPath: string;
  readonly cloudPath: string;
  readonly fileName: string;
  readonly fileSize: number;
  readonly uploadedBytes: number;
  readonly progress: number; // 0-100
  readonly status: CloudStorageStatus;
  readonly priority: UploadPriority;
  readonly createdAt: number;
  readonly startedAt?: number;
  readonly completedAt?: number;
  readonly errorMessage?: string;
  readonly retryCount: number;
  readonly maxRetries: number;
  readonly metadata?: Record<string, any>;
}

export interface DownloadTask {
  readonly id: string;
  readonly fileId: string;
  readonly cloudPath: string;
  readonly localPath: string;
  readonly fileName: string;
  readonly fileSize: number;
  readonly downloadedBytes: number;
  readonly progress: number; // 0-100
  readonly status: CloudStorageStatus;
  readonly createdAt: number;
  readonly startedAt?: number;
  readonly completedAt?: number;
  readonly errorMessage?: string;
  readonly paused: boolean;
}

export interface BatchUploadSession {
  readonly id: string;
  readonly albumId?: string;
  readonly files: UploadTask[];
  readonly totalSize: number;
  readonly uploadedSize: number;
  readonly progress: number; // 0-100
  readonly status: CloudStorageStatus;
  readonly createdAt: number;
  readonly completedAt?: number;
  readonly failedCount: number;
  readonly successCount: number;
}

// ============================================================================
// Storage Quota & Usage
// ============================================================================

export interface CloudStorageQuota {
  readonly totalBytes: number; // total storage allocated
  readonly usedBytes: number; // currently used
  readonly availableBytes: number; // remaining
  readonly fileCount: number;
  readonly albumCount: number;
  readonly lastUpdated: number;
  readonly plan: 'free' | 'pro' | 'enterprise';
}

export interface StorageUsageBreakdown {
  readonly byType: Record<string, {
    count: number;
    totalBytes: number;
  }>;
  readonly byAlbum: Record<string, {
    fileCount: number;
    totalBytes: number;
  }>;
  readonly byDevice: Record<string, {
    fileCount: number;
    totalBytes: number;
  }>;
}

// ============================================================================
// Sharing & Access Control
// ============================================================================

export interface ShareLink {
  readonly id: string;
  readonly fileId: string;
  readonly link: string;
  readonly expiresAt?: number;
  readonly maxDownloads?: number;
  readonly downloadsRemaining?: number;
  readonly accessLevel: FileAccessLevel;
  readonly password?: string; // hashed
  readonly createdAt: number;
  readonly createdBy: string; // user ID
}

export interface FileShare {
  readonly fileId: string;
  readonly sharedWith: string; // email or user ID
  readonly accessLevel: FileAccessLevel;
  readonly sharedAt: number;
  readonly expiresAt?: number;
  readonly message?: string;
}

export interface AlbumShare {
  readonly albumId: string;
  readonly sharedWith: string; // email or user ID
  readonly accessLevel: 'view' | 'edit';
  readonly sharedAt: number;
  readonly expiresAt?: number;
  readonly message?: string;
}

// ============================================================================
// Sync & Backup
// ============================================================================

export interface SyncState {
  readonly lastSyncTime?: number;
  readonly nextSyncTime?: number;
  readonly isSyncing: boolean;
  readonly syncProgress: number; // 0-100
  readonly pendingUploadCount: number;
  readonly pendingDownloadCount: number;
  readonly conflictCount: number;
  readonly errorCount: number;
}

export interface BackupPolicy {
  readonly id: string;
  readonly name: string;
  readonly enabled: boolean;
  readonly frequency: 'daily' | 'weekly' | 'monthly';
  readonly time: string; // HH:mm
  readonly retentionDays: number;
  readonly includeFileTypes: string[]; // MIME types
  readonly excludeFileTypes?: string[];
  readonly maxBackupSize?: number;
}

export interface BackupJob {
  readonly id: string;
  readonly policyId: string;
  readonly startTime: number;
  readonly endTime?: number;
  readonly status: 'pending' | 'running' | 'completed' | 'failed';
  readonly filesBackedUp: number;
  readonly bytesBackedUp: number;
  readonly errorMessage?: string;
}

// ============================================================================
// Search & Organization
// ============================================================================

export interface CloudSearchQuery {
  readonly keywords?: string[];
  readonly fileType?: string; // MIME type
  readonly fromDate?: number; // timestamp
  readonly toDate?: number; // timestamp
  readonly deviceIds?: string[];
  readonly minSize?: number;
  readonly maxSize?: number;
  readonly accessLevel?: FileAccessLevel;
  readonly albums?: string[]; // album IDs
  readonly sharedBy?: string[]; // user IDs
  readonly sortBy?: 'name' | 'date' | 'size';
  readonly sortOrder?: 'asc' | 'desc';
  readonly limit?: number;
  readonly offset?: number;
}

export interface CloudSearchResult {
  readonly totalCount: number;
  readonly results: CloudFile[];
  readonly facets?: {
    fileTypes: Array<{ type: string; count: number }>;
    albums: Array<{ id: string; name: string; count: number }>;
    devices: Array<{ id: string; name: string; count: number }>;
  };
}

export interface CloudAutoOrganization {
  readonly enabled: boolean;
  readonly rules: Array<{
    id: string;
    name: string;
    condition: {
      field: 'fileType' | 'date' | 'deviceId' | 'size';
      operator: 'equals' | 'contains' | 'gt' | 'lt' | 'between';
      value: any;
    };
    action: {
      operation: 'moveToAlbum' | 'addTag' | 'setAccessLevel';
      target: string;
    };
  }>;
}

// ============================================================================
// Result Type for Operations
// ============================================================================

export type CloudResult<T> = 
  | { ok: true; value: T }
  | { ok: false; error: CloudError };

export interface CloudError extends Error {
  readonly code: string;
  readonly message: string;
  readonly details?: Record<string, any>;
  readonly retryable: boolean;
}

// ============================================================================
// Event Types
// ============================================================================

export interface CloudStorageEvent {
  readonly type: CloudEventType;
  readonly timestamp: number;
  readonly data: Record<string, any>;
}

export enum CloudEventType {
  UPLOAD_STARTED = 'upload_started',
  UPLOAD_PROGRESS = 'upload_progress',
  UPLOAD_COMPLETED = 'upload_completed',
  UPLOAD_FAILED = 'upload_failed',
  DOWNLOAD_STARTED = 'download_started',
  DOWNLOAD_PROGRESS = 'download_progress',
  DOWNLOAD_COMPLETED = 'download_completed',
  DOWNLOAD_FAILED = 'download_failed',
  SYNC_STARTED = 'sync_started',
  SYNC_COMPLETED = 'sync_completed',
  SYNC_FAILED = 'sync_failed',
  ALBUM_CREATED = 'album_created',
  ALBUM_UPDATED = 'album_updated',
  ALBUM_DELETED = 'album_deleted',
  FILE_SHARED = 'file_shared',
  ALBUM_SHARED = 'album_shared',
  SHARE_REVOKED = 'share_revoked',
  QUOTA_WARNING = 'quota_warning',
  QUOTA_EXCEEDED = 'quota_exceeded',
  CONFLICT_DETECTED = 'conflict_detected',
}

// ============================================================================
// Transcoding & Processing
// ============================================================================

export interface TranscodingProfile {
  readonly id: string;
  readonly name: string;
  readonly videoCodec: 'h264' | 'h265' | 'vp9';
  readonly audioCodec: 'aac' | 'opus' | 'mp3';
  readonly resolution: '720p' | '1080p' | '2k' | '4k';
  readonly bitrate: number; // kbps
  readonly framerate: number;
}

export interface TranscodingJob {
  readonly id: string;
  readonly fileId: string;
  readonly profileId: string;
  readonly status: 'pending' | 'processing' | 'completed' | 'failed';
  readonly progress: number; // 0-100
  readonly outputFileId?: string;
  readonly startedAt?: number;
  readonly completedAt?: number;
  readonly errorMessage?: string;
}

// ============================================================================
// Analytics & Monitoring
// ============================================================================

export interface CloudStorageAnalytics {
  readonly totalUploads: number;
  readonly totalDownloads: number;
  readonly totalSyncs: number;
  readonly failedUploads: number;
  readonly failedDownloads: number;
  readonly averageUploadSpeed: number; // bytes/sec
  readonly averageDownloadSpeed: number; // bytes/sec
  readonly bandwidthUsedThisMonth: number; // bytes
  readonly storageUsedThisMonth: number; // bytes
  readonly lastAnalyticsUpdate: number;
}

export interface UploadMetrics {
  readonly uploadId: string;
  readonly fileSize: number;
  readonly uploadedBytes: number;
  readonly duration: number; // milliseconds
  readonly averageSpeed: number; // bytes/sec
  readonly peakSpeed: number; // bytes/sec
  readonly retries: number;
  readonly success: boolean;
}
