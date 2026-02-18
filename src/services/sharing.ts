/**
 * Advanced Sharing Service for Phase 10
 * Complete implementation for file and album sharing with links, permissions, and tracking
 */

import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  getDocs,
  Timestamp,
  arrayUnion,
  arrayRemove,
  increment,
} from 'firebase/firestore';
import { ref, deleteObject } from 'firebase/storage';
import { firestore, storage } from '@/config/firebase';
import {
  ShareLink,
  AlbumShareLink,
  SharingPermission,
  AccessLevel,
  AccessRecord,
  FileSharing,
  AlbumSharing,
  SharingInvitation,
  SharingRequest,
  SharingActivity,
  SharingActivityType,
  SharingResult,
  SharingError,
  FileSharingStatus,
  AlbumSharingStatus,
} from '@/types/sharing';

/**
 * Advanced Sharing Service
 * Handles all sharing operations with Firebase
 */

/**
 * Create or update a share link for a file
 */
export async function createShareLink(
  fileId: string,
  userId: string,
  options?: {
    expirationDays?: number;
    password?: string;
    maxAccess?: number;
    accessLevel?: 'view' | 'download' | 'edit';
  }
): Promise<SharingResult<ShareLink>> {
  try {
    const linkId = `${fileId}_${Date.now()}`;
    const createdAt = Date.now();
    const expiresAt = options?.expirationDays 
      ? createdAt + (options.expirationDays * 24 * 60 * 60 * 1000)
      : undefined;

    const shareLink: ShareLink = {
      id: linkId,
      fileId,
      createdBy: userId,
      createdAt,
      expiresAt,
      isExpired: false,
      accessCount: 0,
      maxAccess: options?.maxAccess,
      password: options?.password,
      accessLevel: options?.accessLevel || 'view',
      isActive: true,
      trackingEnabled: true,
      shareLink: `https://multicampro.app/share/${linkId}`,
      metadata: {
        description: `Share link for file ${fileId}`,
        lastAccessedAt: undefined,
      },
    };

    const sharePath = `cloud_shares/${linkId}`;
    await setDoc(doc(firestore, sharePath), {
      ...shareLink,
      createdAt: Timestamp.fromDate(new Date(createdAt)),
      expiresAt: expiresAt ? Timestamp.fromDate(new Date(expiresAt)) : null,
    });

    // Log activity
    await logSharingActivity(userId, SharingActivityType.SHARE_LINK_CREATED, fileId);

    return { ok: true, value: shareLink };
  } catch (error) {
    return {
      ok: false,
      error: {
        code: 'SHARE_LINK_CREATE_FAILED',
        message: 'Failed to create share link',
        name: 'SharingError',
        retryable: true,
      },
    };
  }
}

/**
 * Revoke a share link
 */
export async function revokeShareLink(
  shareLinkId: string,
  userId: string
): Promise<SharingResult<void>> {
  try {
    await deleteDoc(doc(firestore, `cloud_shares/${shareLinkId}`));

    // Log activity
    await logSharingActivity(userId, SharingActivityType.SHARE_LINK_REVOKED);

    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: {
        code: 'SHARE_LINK_REVOKE_FAILED',
        message: 'Failed to revoke share link',
        name: 'SharingError',
        retryable: true,
      },
    };
  }
}

/**
 * Get a share link by ID
 */
export async function getShareLink(shareLinkId: string): Promise<SharingResult<ShareLink>> {
  try {
    const docRef = doc(firestore, `cloud_shares/${shareLinkId}`);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return {
        ok: false,
        error: {
          code: 'SHARE_LINK_NOT_FOUND',
          message: 'Share link not found',
          name: 'SharingError',
          retryable: false,
        },
      };
    }

    const data = docSnap.data();
    return {
      ok: true,
      value: {
        ...data,
        createdAt: data.createdAt?.toMillis?.() || data.createdAt,
        expiresAt: data.expiresAt?.toMillis?.() || data.expiresAt,
      } as ShareLink,
    };
  } catch (error) {
    return {
      ok: false,
      error: {
        code: 'SHARE_LINK_GET_FAILED',
        message: 'Failed to get share link',
        name: 'SharingError',
        retryable: true,
      },
    };
  }
}

/**
 * Share a file with a user
 */
export async function shareFileWithUser(
  fileId: string,
  ownerId: string,
  targetEmail: string,
  accessLevel: AccessLevel = AccessLevel.VIEWER
): Promise<SharingResult<SharingPermission>> {
  try {
    const permission: SharingPermission = {
      userId: targetEmail, // In real app, would look up user ID
      email: targetEmail,
      accessLevel,
      grantedAt: Date.now(),
      grantedBy: ownerId,
      canRevoke: true,
      canModifyPermissions: accessLevel === AccessLevel.EDITOR || accessLevel === AccessLevel.ADMIN,
    };

    // Update file sharing document
    const sharingDocPath = `file_sharing/${fileId}`;
    const sharingDocRef = doc(firestore, sharingDocPath);

    const existingDoc = await getDoc(sharingDocRef);
    if (existingDoc.exists()) {
      await updateDoc(sharingDocRef, {
        permissions: arrayUnion(permission),
        lastModifiedAt: Timestamp.now(),
      });
    } else {
      // Create new sharing document
      const fileSharing: Partial<FileSharing> = {
        id: fileId,
        fileId,
        ownerId,
        permissions: [permission],
        sharedAt: Timestamp.now(),
        lastModifiedAt: Timestamp.now(),
        accessHistory: [],
      };

      await setDoc(sharingDocRef, fileSharing);
    }

    // Send invitation if needed
    await createSharingInvitation(fileId, undefined, targetEmail, ownerId, accessLevel);

    // Log activity
    await logSharingActivity(ownerId, SharingActivityType.PERMISSION_GRANTED, fileId, targetEmail);

    return { ok: true, value: permission };
  } catch (error) {
    return {
      ok: false,
      error: {
        code: 'SHARE_WITH_USER_FAILED',
        message: 'Failed to share file with user',
        name: 'SharingError',
        retryable: true,
      },
    };
  }
}

/**
 * Revoke file sharing with a user
 */
export async function revokeFileSharing(
  fileId: string,
  ownerId: string,
  targetEmail: string
): Promise<SharingResult<void>> {
  try {
    const sharingDocRef = doc(firestore, `file_sharing/${fileId}`);
    const sharingDoc = await getDoc(sharingDocRef);

    if (sharingDoc.exists()) {
      const permissions = sharingDoc.data().permissions || [];
      const updatedPermissions = permissions.filter(
        (p: SharingPermission) => p.email !== targetEmail
      );

      if (updatedPermissions.length === 0) {
        await deleteDoc(sharingDocRef);
      } else {
        await updateDoc(sharingDocRef, {
          permissions: updatedPermissions,
          lastModifiedAt: Timestamp.now(),
        });
      }
    }

    // Log activity
    await logSharingActivity(ownerId, SharingActivityType.PERMISSION_REVOKED, fileId, targetEmail);

    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: {
        code: 'REVOKE_SHARING_FAILED',
        message: 'Failed to revoke file sharing',
        name: 'SharingError',
        retryable: true,
      },
    };
  }
}

/**
 * Get file sharing status
 */
export async function getFileSharingStatus(fileId: string): Promise<SharingResult<FileSharingStatus>> {
  try {
    const sharingDocRef = doc(firestore, `file_sharing/${fileId}`);
    const sharingDoc = await getDoc(sharingDocRef);

    const status: FileSharingStatus = {
      fileId,
      isShared: sharingDoc.exists(),
      sharedWith: sharingDoc.exists() ? sharingDoc.data().permissions || [] : [],
      publicLink: undefined,
      accessHistory: sharingDoc.exists() ? sharingDoc.data().accessHistory || [] : [],
      lastSharedAt: sharingDoc.exists() ? sharingDoc.data().sharedAt?.toMillis?.() : undefined,
      isPubliclyAccessible: !!sharingDoc.data()?.publicLink,
    };

    return { ok: true, value: status };
  } catch (error) {
    return {
      ok: false,
      error: {
        code: 'GET_SHARING_STATUS_FAILED',
        message: 'Failed to get file sharing status',
        name: 'SharingError',
        retryable: true,
      },
    };
  }
}

/**
 * Record file access from a share link
 */
export async function recordShareLinkAccess(
  shareLinkId: string,
  fileId: string,
  userId?: string
): Promise<SharingResult<void>> {
  try {
    const accessRecord: AccessRecord = {
      id: `${shareLinkId}_${Date.now()}`,
      userId,
      ipAddress: undefined, // Would be captured server-side
      userAgent: undefined, // Would be captured client-side
      accessedAt: Date.now(),
      accessType: 'view',
      metadata: {
        country: undefined,
        device: undefined,
        browser: undefined,
      },
    };

    // Update share link access count
    const shareLinkRef = doc(firestore, `cloud_shares/${shareLinkId}`);
    await updateDoc(shareLinkRef, {
      accessCount: increment(1),
      'metadata.lastAccessedAt': Timestamp.now(),
    });

    // Record access history
    const accessHistoryRef = collection(firestore, `cloud_shares/${shareLinkId}/access_history`);
    await setDoc(doc(accessHistoryRef), {
      ...accessRecord,
      accessedAt: Timestamp.fromDate(new Date(accessRecord.accessedAt)),
    });

    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: {
        code: 'RECORD_ACCESS_FAILED',
        message: 'Failed to record file access',
        name: 'SharingError',
        retryable: true,
      },
    };
  }
}

/**
 * Create a sharing invitation
 */
export async function createSharingInvitation(
  fileId?: string,
  albumId?: string,
  invitedEmail?: string,
  invitedBy?: string,
  accessLevel: AccessLevel = AccessLevel.VIEWER
): Promise<SharingResult<SharingInvitation>> {
  try {
    const invitationId = `inv_${Date.now()}`;
    const createdAt = Date.now();
    const expiresAt = createdAt + (30 * 24 * 60 * 60 * 1000); // 30 days

    const invitation: SharingInvitation = {
      id: invitationId,
      invitedEmail: invitedEmail || '',
      fileId,
      albumId,
      invitedBy: invitedBy || '',
      accessLevel,
      createdAt,
      expiresAt,
      isExpired: false,
      status: 'pending',
    };

    await setDoc(doc(firestore, `sharing_invitations/${invitationId}`), {
      ...invitation,
      createdAt: Timestamp.fromDate(new Date(createdAt)),
      expiresAt: Timestamp.fromDate(new Date(expiresAt)),
    });

    // Log activity
    if (invitedBy) {
      await logSharingActivity(invitedBy, SharingActivityType.INVITATION_CREATED);
    }

    return { ok: true, value: invitation };
  } catch (error) {
    return {
      ok: false,
      error: {
        code: 'INVITATION_CREATE_FAILED',
        message: 'Failed to create invitation',
        name: 'SharingError',
        retryable: true,
      },
    };
  }
}

/**
 * Accept sharing invitation
 */
export async function acceptSharingInvitation(
  invitationId: string,
  userId: string,
  userEmail: string
): Promise<SharingResult<void>> {
  try {
    const invitationRef = doc(firestore, `sharing_invitations/${invitationId}`);
    const invitationDoc = await getDoc(invitationRef);

    if (!invitationDoc.exists()) {
      return {
        ok: false,
        error: {
          code: 'INVITATION_NOT_FOUND',
          message: 'Invitation not found',
          name: 'SharingError',
          retryable: false,
        },
      };
    }

    const invitation = invitationDoc.data();
    
    // Update invitation status
    await updateDoc(invitationRef, {
      status: 'accepted',
      acceptedAt: Timestamp.now(),
      acceptedBy: userEmail,
    });

    // Add sharing permission if file or album
    if (invitation.fileId) {
      await shareFileWithUser(
        invitation.fileId,
        invitation.invitedBy,
        userEmail,
        invitation.accessLevel
      );
    } else if (invitation.albumId) {
      await shareAlbumWithUser(
        invitation.albumId,
        invitation.invitedBy,
        userEmail,
        invitation.accessLevel
      );
    }

    // Log activity
    await logSharingActivity(userId, SharingActivityType.INVITATION_ACCEPTED);

    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: {
        code: 'ACCEPT_INVITATION_FAILED',
        message: 'Failed to accept invitation',
        name: 'SharingError',
        retryable: true,
      },
    };
  }
}

/**
 * Share an album with a user
 */
export async function shareAlbumWithUser(
  albumId: string,
  ownerId: string,
  targetEmail: string,
  accessLevel: AccessLevel = AccessLevel.VIEWER
): Promise<SharingResult<SharingPermission>> {
  try {
    const permission: SharingPermission = {
      userId: targetEmail,
      email: targetEmail,
      accessLevel,
      grantedAt: Date.now(),
      grantedBy: ownerId,
      canRevoke: true,
      canModifyPermissions: accessLevel === AccessLevel.EDITOR || accessLevel === AccessLevel.ADMIN,
    };

    const sharingDocPath = `album_sharing/${albumId}`;
    const sharingDocRef = doc(firestore, sharingDocPath);

    const existingDoc = await getDoc(sharingDocRef);
    if (existingDoc.exists()) {
      await updateDoc(sharingDocRef, {
        permissions: arrayUnion(permission),
        lastModifiedAt: Timestamp.now(),
      });
    } else {
      const albumSharing: Partial<AlbumSharing> = {
        id: albumId,
        albumId,
        ownerId,
        permissions: [permission],
        sharedAt: Timestamp.now(),
        lastModifiedAt: Timestamp.now(),
        accessHistory: [],
      };

      await setDoc(sharingDocRef, albumSharing);
    }

    // Log activity
    await logSharingActivity(ownerId, SharingActivityType.PERMISSION_GRANTED, undefined, targetEmail);

    return { ok: true, value: permission };
  } catch (error) {
    return {
      ok: false,
      error: {
        code: 'SHARE_ALBUM_FAILED',
        message: 'Failed to share album with user',
        name: 'SharingError',
        retryable: true,
      },
    };
  }
}

/**
 * Get user's shared files
 */
export async function getUserSharedFiles(userId: string): Promise<SharingResult<FileSharing[]>> {
  try {
    const q = query(
      collection(firestore, 'file_sharing'),
      where('ownerId', '==', userId)
    );

    const querySnapshot = await getDocs(q);
    const files = querySnapshot.docs.map(doc => ({
      ...doc.data(),
      sharedAt: doc.data().sharedAt?.toMillis?.() || doc.data().sharedAt,
      lastModifiedAt: doc.data().lastModifiedAt?.toMillis?.() || doc.data().lastModifiedAt,
    })) as FileSharing[];

    return { ok: true, value: files };
  } catch (error) {
    return {
      ok: false,
      error: {
        code: 'GET_SHARED_FILES_FAILED',
        message: 'Failed to get shared files',
        name: 'SharingError',
        retryable: true,
      },
    };
  }
}

/**
 * Log sharing activity
 */
async function logSharingActivity(
  userId: string,
  type: SharingActivityType,
  fileId?: string,
  targetUserId?: string
): Promise<void> {
  try {
    const activity: SharingActivity = {
      id: `act_${Date.now()}`,
      userId,
      type,
      fileId,
      targetUserId,
      timestamp: Date.now(),
    };

    await setDoc(doc(firestore, `sharing_activities/${activity.id}`), {
      ...activity,
      timestamp: Timestamp.fromDate(new Date(activity.timestamp)),
    });
  } catch (error) {
    console.error('Failed to log sharing activity:', error);
  }
}

/**
 * Get share link access analytics
 */
export async function getShareLinkAnalytics(shareLinkId: string) {
  try {
    const accessHistoryRef = collection(firestore, `cloud_shares/${shareLinkId}/access_history`);
    const snapshot = await getDocs(accessHistoryRef);
    const accessRecords = snapshot.docs.map(doc => doc.data()) as AccessRecord[];

    const analytics = {
      totalAccess: accessRecords.length,
      uniqueUsers: new Set(accessRecords.map(r => r.userId)).size,
      lastAccessed: Math.max(...accessRecords.map(r => r.accessedAt)),
      accessHistory: accessRecords,
    };

    return { ok: true, value: analytics };
  } catch (error) {
    return {
      ok: false,
      error: {
        code: 'GET_ANALYTICS_FAILED',
        message: 'Failed to get share link analytics',
        name: 'SharingError',
        retryable: true,
      },
    };
  }
}
