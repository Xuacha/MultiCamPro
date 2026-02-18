/**
 * Advanced Sharing Types for Phase 10
 * Complete type system for file and album sharing with expiration, tracking, and permissions
 */

// ============================================================================
// SHARE LINK TYPES
// ============================================================================

/**
 * Share link for public file access
 */
export interface ShareLink {
  readonly id: string;
  readonly fileId: string;
  readonly createdBy: string;
  readonly createdAt: number; // Timestamp
  readonly expiresAt?: number; // Optional expiration timestamp
  readonly isExpired: boolean;
  readonly accessCount: number; // Number of times accessed
  readonly maxAccess?: number; // Maximum access limit (null = unlimited)
  readonly password?: string; // Optional password protection
  readonly accessLevel: 'view' | 'download' | 'edit';
  readonly isActive: boolean;
  readonly trackingEnabled: boolean;
  readonly shareLink: string; // Unique shareable URL
  readonly metadata?: {
    readonly description?: string;
    readonly expirationReason?: string;
    readonly lastAccessedAt?: number;
  };
}

/**
 * Album share link (entire album)
 */
export interface AlbumShareLink extends ShareLink {
  readonly albumId: string;
  readonly fileCount: number;
  readonly totalSize: number;
}

// ============================================================================
// SHARING PERMISSIONS TYPES
// ============================================================================

/**
 * Access level permissions
 */
export enum AccessLevel {
  VIEWER = 'viewer',
  EDITOR = 'editor',
  ADMIN = 'admin',
  OWNER = 'owner',
}

/**
 * User sharing permissions
 */
export interface SharingPermission {
  readonly userId: string;
  readonly email: string;
  readonly accessLevel: AccessLevel;
  readonly grantedAt: number; // Timestamp
  readonly grantedBy: string; // User ID who granted permission
  readonly canRevoke: boolean;
  readonly canModifyPermissions: boolean;
}

/**
 * File sharing entry
 */
export interface FileSharing {
  readonly id: string;
  readonly fileId: string;
  readonly ownerId: string;
  readonly permissions: SharingPermission[];
  readonly publicShare?: ShareLink;
  readonly sharedAt: number;
  readonly lastModifiedAt: number;
  readonly accessHistory: AccessRecord[];
}

/**
 * Album sharing entry
 */
export interface AlbumSharing {
  readonly id: string;
  readonly albumId: string;
  readonly ownerId: string;
  readonly permissions: SharingPermission[];
  readonly publicShare?: AlbumShareLink;
  readonly fileCount: number;
  readonly totalSize: number;
  readonly sharedAt: number;
  readonly lastModifiedAt: number;
  readonly accessHistory: AccessRecord[];
}

// ============================================================================
// ACCESS TRACKING TYPES
// ============================================================================

/**
 * Record of access to a shared file or album
 */
export interface AccessRecord {
  readonly id: string;
  readonly userId?: string; // Null for anonymous access
  readonly ipAddress?: string;
  readonly userAgent?: string;
  readonly accessedAt: number; // Timestamp
  readonly accessType: 'view' | 'download' | 'preview';
  readonly duration?: number; // Duration in milliseconds
  readonly downloadSize?: number; // Bytes downloaded
  readonly metadata?: {
    readonly country?: string;
    readonly device?: string;
    readonly browser?: string;
    readonly referrer?: string;
  };
}

/**
 * Access analytics for a share link
 */
export interface ShareAnalytics {
  readonly shareId: string;
  readonly totalAccess: number;
  readonly uniqueUsers: number;
  readonly totalDownloads: number;
  readonly totalSize: number; // Total bytes downloaded
  readonly accessHistory: AccessRecord[];
  readonly lastAccessed?: number;
  readonly createdAt: number;
  readonly expiresAt?: number;
  readonly statistics: {
    readonly viewsPerDay: number;
    readonly downloadsPerDay: number;
    readonly averageSessionDuration: number; // Milliseconds
    readonly topCountries?: string[];
    readonly topDevices?: string[];
  };
}

// ============================================================================
// INVITATION TYPES
// ============================================================================

/**
 * Sharing invitation for a user
 */
export interface SharingInvitation {
  readonly id: string;
  readonly invitedEmail: string;
  readonly fileId?: string;
  readonly albumId?: string;
  readonly invitedBy: string; // User ID
  readonly accessLevel: AccessLevel;
  readonly createdAt: number;
  readonly expiresAt: number; // Invitation expires after 30 days
  readonly isExpired: boolean;
  readonly status: 'pending' | 'accepted' | 'declined' | 'expired';
  readonly acceptedAt?: number;
  readonly acceptedBy?: string; // Email or user ID
  readonly declinedAt?: number;
  readonly message?: string;
}

/**
 * Batch sharing invitation
 */
export interface BatchSharingInvitation {
  readonly id: string;
  readonly invitees: string[]; // Email addresses
  readonly fileIds?: string[];
  readonly albumIds?: string[];
  readonly invitedBy: string;
  readonly accessLevel: AccessLevel;
  readonly createdAt: number;
  readonly completedAt?: number;
  readonly results: {
    readonly successful: number;
    readonly failed: number;
    readonly pending: number;
  };
}

// ============================================================================
// SHARING REQUEST TYPES
// ============================================================================

/**
 * Request to share a file or album
 */
export interface SharingRequest {
  readonly id: string;
  readonly requestedBy: string; // User ID requesting access
  readonly fileId?: string;
  readonly albumId?: string;
  readonly ownerId: string;
  readonly requestedAccessLevel: AccessLevel;
  readonly message?: string;
  readonly createdAt: number;
  readonly status: 'pending' | 'approved' | 'rejected' | 'expired';
  readonly approvedAt?: number;
  readonly approvedBy?: string;
  readonly rejectedAt?: number;
  readonly rejectionReason?: string;
  readonly expiresAt: number; // Request expires after 14 days
}

// ============================================================================
// SHARING ACTIVITY TYPES
// ============================================================================

/**
 * Activity related to sharing
 */
export enum SharingActivityType {
  FILE_SHARED = 'file_shared',
  FILE_UNSHARED = 'file_unshared',
  ALBUM_SHARED = 'album_shared',
  ALBUM_UNSHARED = 'album_unshared',
  PERMISSION_GRANTED = 'permission_granted',
  PERMISSION_REVOKED = 'permission_revoked',
  PERMISSION_CHANGED = 'permission_changed',
  SHARE_LINK_CREATED = 'share_link_created',
  SHARE_LINK_REVOKED = 'share_link_revoked',
  SHARE_LINK_EXPIRED = 'share_link_expired',
  INVITATION_CREATED = 'invitation_created',
  INVITATION_ACCEPTED = 'invitation_accepted',
  INVITATION_DECLINED = 'invitation_declined',
  INVITATION_EXPIRED = 'invitation_expired',
  REQUEST_CREATED = 'request_created',
  REQUEST_APPROVED = 'request_approved',
  REQUEST_REJECTED = 'request_rejected',
  FILE_ACCESSED = 'file_accessed',
  FILE_DOWNLOADED = 'file_downloaded',
  SETTINGS_CHANGED = 'settings_changed',
}

/**
 * Sharing activity record
 */
export interface SharingActivity {
  readonly id: string;
  readonly userId: string;
  readonly type: SharingActivityType;
  readonly fileId?: string;
  readonly albumId?: string;
  readonly shareId?: string;
  readonly targetUserId?: string; // User affected by the activity
  readonly timestamp: number;
  readonly change?: {
    readonly from?: any;
    readonly to?: any;
  };
  readonly metadata?: Record<string, any>;
}

// ============================================================================
// SHARING SETTINGS TYPES
// ============================================================================

/**
 * User's sharing preferences
 */
export interface SharingSettings {
  readonly userId: string;
  readonly allowPublicSharing: boolean;
  readonly allowSharing: boolean;
  readonly defaultAccessLevel: AccessLevel;
  readonly defaultShareLinkExpiration?: number; // Days, null = no expiration
  readonly requirePassword: boolean;
  readonly trackAccessMetrics: boolean;
  readonly notifyOnShare: boolean;
  readonly notifyOnAccess: boolean;
  readonly notifyOnExpiration: boolean;
  readonly maxShareLinkDuration?: number; // Maximum days for share link
  readonly allowDownload: boolean;
  readonly allowEdit: boolean;
  readonly updatedAt: number;
}

/**
 * Organization sharing policies
 */
export interface SharingPolicy {
  readonly id: string;
  readonly organizationId: string;
  readonly name: string;
  readonly description?: string;
  readonly allowPublicSharing: boolean;
  readonly maxAccessTime?: number; // Days
  readonly requirePassword: boolean;
  readonly requireApproval: boolean;
  readonly allowedDomains?: string[]; // Restrict sharing to domains
  readonly blockedDomains?: string[];
  readonly maxSharesPerUser?: number;
  readonly createdAt: number;
  readonly updatedAt: number;
}

// ============================================================================
// SHARING RESULT TYPES
// ============================================================================

/**
 * Result of sharing operation
 */
export interface SharingResult<T> {
  readonly ok: boolean;
  readonly value?: T;
  readonly error?: SharingError;
}

/**
 * Sharing-specific error
 */
export interface SharingError extends Error {
  readonly code: string;
  readonly message: string;
  readonly details?: {
    readonly fieldName?: string;
    readonly invalidValue?: any;
    readonly reason?: string;
  };
  readonly retryable: boolean;
}

// ============================================================================
// SHARE DIALOG TYPES
// ============================================================================

/**
 * Share dialog input data
 */
export interface ShareDialogInput {
  readonly fileId?: string;
  readonly albumId?: string;
  readonly fileName?: string;
  readonly currentPermissions: SharingPermission[];
  readonly currentShareLink?: ShareLink;
  readonly onlyPublic?: boolean; // If true, show only public sharing
}

/**
 * Share dialog output data
 */
export interface ShareDialogOutput {
  readonly action: 'share' | 'unshare' | 'update' | 'createLink' | 'revokeLink' | 'cancel';
  readonly invitees?: string[]; // Email addresses
  readonly accessLevel?: AccessLevel;
  readonly message?: string;
  readonly shareLink?: ShareLink;
  readonly expirationDays?: number;
  readonly includePassword?: boolean;
  readonly password?: string;
}

// ============================================================================
// SHARING HISTORY TYPES
// ============================================================================

/**
 * Sharing history entry
 */
export interface SharingHistoryEntry {
  readonly id: string;
  readonly fileId?: string;
  readonly albumId?: string;
  readonly userId: string;
  readonly action: 'shared' | 'unshared' | 'updated' | 'accessed';
  readonly target: string; // Email or user ID
  readonly timestamp: number;
  readonly details?: Record<string, any>;
}

/**
 * Complete sharing status of a file
 */
export interface FileSharingStatus {
  readonly fileId: string;
  readonly isShared: boolean;
  readonly sharedWith: SharingPermission[];
  readonly publicLink?: ShareLink;
  readonly accessHistory: AccessRecord[];
  readonly lastSharedAt?: number;
  readonly isPubliclyAccessible: boolean;
}

/**
 * Complete sharing status of an album
 */
export interface AlbumSharingStatus {
  readonly albumId: string;
  readonly isShared: boolean;
  readonly fileCount: number;
  readonly sharedWith: SharingPermission[];
  readonly publicLink?: AlbumShareLink;
  readonly accessHistory: AccessRecord[];
  readonly lastSharedAt?: number;
  readonly isPubliclyAccessible: boolean;
}

// ============================================================================
// BATCH SHARING TYPES
// ============================================================================

/**
 * Batch sharing operation
 */
export interface BatchSharingOperation {
  readonly id: string;
  readonly fileIds: string[];
  readonly albumIds: string[];
  readonly invitees: string[];
  readonly accessLevel: AccessLevel;
  readonly createdBy: string;
  readonly createdAt: number;
  readonly completedAt?: number;
  readonly status: 'pending' | 'in_progress' | 'completed' | 'failed';
  readonly progress: {
    readonly total: number;
    readonly completed: number;
    readonly failed: number;
  };
}

// ============================================================================
// EXPORT TYPES FOR SHARING
// ============================================================================

export type SharingEntity = FileSharing | AlbumSharing;
export type ShareLinkType = ShareLink | AlbumShareLink;
export type SharingStatusType = FileSharingStatus | AlbumSharingStatus;
