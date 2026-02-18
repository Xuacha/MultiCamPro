/**
 * Advanced Sharing Hook for Phase 10
 * React hook for managing sharing operations and state
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  createShareLink,
  revokeShareLink,
  getShareLink,
  shareFileWithUser,
  revokeFileSharing,
  getFileSharingStatus,
  recordShareLinkAccess,
  createSharingInvitation,
  acceptSharingInvitation,
  shareAlbumWithUser,
  getUserSharedFiles,
  getShareLinkAnalytics,
} from '@/services/sharing';
import {
  ShareLink,
  SharingPermission,
  AccessLevel,
  FileSharing,
  FileSharingStatus,
  AlbumSharing,
  AlbumSharingStatus,
  SharingInvitation,
  SharingResult,
} from '@/types/sharing';

/**
 * useAdvancedSharing Hook
 * Manages file and album sharing operations
 */
export function useAdvancedSharing() {
  const [sharedFiles, setSharedFiles] = useState<FileSharing[]>([]);
  const [sharedAlbums, setSharedAlbums] = useState<AlbumSharing[]>([]);
  const [shareLinks, setShareLinks] = useState<ShareLink[]>([]);
  const [isSharing, setIsSharing] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [invitations, setInvitations] = useState<SharingInvitation[]>([]);

  // Track current users for UI
  const [selectedFileForSharing, setSelectedFileForSharing] = useState<string | null>(null);
  const [selectedAlbumForSharing, setSelectedAlbumForSharing] = useState<string | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  /**
   * Share a file with a specific user
   */
  const shareFile = useCallback(
    async (fileId: string, email: string, accessLevel: AccessLevel = AccessLevel.VIEWER) => {
      setIsSharing(true);
      setError(null);

      try {
        const result = await shareFileWithUser(fileId, '', email, accessLevel);

        if (!result.ok) {
          setError(new Error(result.error?.message));
          return result;
        }

        // Refresh shared files
        await loadSharedFiles();
        return result;
      } catch (err) {
        const error = err as Error;
        setError(error);
        return {
          ok: false,
          error: {
            code: 'SHARE_FILE_ERROR',
            message: error.message,
            name: 'SharingError',
            retryable: true,
          },
        };
      } finally {
        setIsSharing(false);
      }
    },
    []
  );

  /**
   * Create a public share link
   */
  const createPublicShareLink = useCallback(
    async (
      fileId: string,
      options?: {
        expirationDays?: number;
        password?: string;
        maxAccess?: number;
      }
    ) => {
      setIsSharing(true);
      setError(null);

      try {
        const result = await createShareLink(fileId, '', options);

        if (!result.ok) {
          setError(new Error(result.error?.message));
          return result;
        }

        // Add to share links
        setShareLinks(prev => [...prev, result.value!]);
        return result;
      } catch (err) {
        const error = err as Error;
        setError(error);
        return {
          ok: false,
          error: {
            code: 'CREATE_SHARE_LINK_ERROR',
            message: error.message,
            name: 'SharingError',
            retryable: true,
          },
        };
      } finally {
        setIsSharing(false);
      }
    },
    []
  );

  /**
   * Revoke a share link
   */
  const revokeLink = useCallback(async (shareLinkId: string) => {
    setIsSharing(true);
    setError(null);

    try {
      const result = await revokeShareLink(shareLinkId, '');

      if (!result.ok) {
        setError(new Error(result.error?.message));
        return result;
      }

      // Remove from share links
      setShareLinks(prev => prev.filter(link => link.id !== shareLinkId));
      return result;
    } catch (err) {
      const error = err as Error;
      setError(error);
      return {
        ok: false,
        error: {
          code: 'REVOKE_LINK_ERROR',
          message: error.message,
          name: 'SharingError',
          retryable: true,
        },
      };
    } finally {
      setIsSharing(false);
    }
  }, []);

  /**
   * Revoke file sharing with a user
   */
  const revokeFileAccess = useCallback(
    async (fileId: string, userEmail: string) => {
      setIsSharing(true);
      setError(null);

      try {
        const result = await revokeFileSharing(fileId, '', userEmail);

        if (!result.ok) {
          setError(new Error(result.error?.message));
          return result;
        }

        // Refresh shared files
        await loadSharedFiles();
        return result;
      } catch (err) {
        const error = err as Error;
        setError(error);
        return {
          ok: false,
          error: {
            code: 'REVOKE_ACCESS_ERROR',
            message: error.message,
            name: 'SharingError',
            retryable: true,
          },
        };
      } finally {
        setIsSharing(false);
      }
    },
    []
  );

  /**
   * Get file sharing status
   */
  const getFileSharingInfo = useCallback(async (fileId: string) => {
    try {
      const result = await getFileSharingStatus(fileId);
      return result;
    } catch (err) {
      const error = err as Error;
      setError(error);
      return {
        ok: false,
        error: {
          code: 'GET_SHARING_STATUS_ERROR',
          message: error.message,
          name: 'SharingError',
          retryable: true,
        },
      };
    }
  }, []);

  /**
   * Get share link analytics
   */
  const getShareAnalytics = useCallback(async (shareLinkId: string) => {
    try {
      const result = await getShareLinkAnalytics(shareLinkId);
      return result;
    } catch (err) {
      const error = err as Error;
      setError(error);
      return {
        ok: false,
        error: {
          code: 'GET_ANALYTICS_ERROR',
          message: error.message,
          name: 'SharingError',
          retryable: true,
        },
      };
    }
  }, []);

  /**
   * Load user's shared files
   */
  const loadSharedFiles = useCallback(async () => {
    try {
      const result = await getUserSharedFiles('');
      if (result.ok && result.value) {
        setSharedFiles(result.value);
      }
    } catch (err) {
      const error = err as Error;
      setError(error);
    }
  }, []);

  /**
   * Accept sharing invitation
   */
  const acceptInvitation = useCallback(
    async (invitationId: string, userId: string, userEmail: string) => {
      setIsSharing(true);
      setError(null);

      try {
        const result = await acceptSharingInvitation(invitationId, userId, userEmail);

        if (!result.ok) {
          setError(new Error(result.error?.message));
          return result;
        }

        // Remove from invitations
        setInvitations(prev => prev.filter(inv => inv.id !== invitationId));
        return result;
      } catch (err) {
        const error = err as Error;
        setError(error);
        return {
          ok: false,
          error: {
            code: 'ACCEPT_INVITATION_ERROR',
            message: error.message,
            name: 'SharingError',
            retryable: true,
          },
        };
      } finally {
        setIsSharing(false);
      }
    },
    []
  );

  /**
   * Create sharing invitation
   */
  const inviteUser = useCallback(
    async (
      email: string,
      fileId?: string,
      albumId?: string,
      accessLevel: AccessLevel = AccessLevel.VIEWER
    ) => {
      setIsSharing(true);
      setError(null);

      try {
        const result = await createSharingInvitation(
          fileId,
          albumId,
          email,
          '',
          accessLevel
        );

        if (!result.ok) {
          setError(new Error(result.error?.message));
          return result;
        }

        return result;
      } catch (err) {
        const error = err as Error;
        setError(error);
        return {
          ok: false,
          error: {
            code: 'INVITE_USER_ERROR',
            message: error.message,
            name: 'SharingError',
            retryable: true,
          },
        };
      } finally {
        setIsSharing(false);
      }
    },
    []
  );

  /**
   * Clear error
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Cleanup
  useEffect(() => {
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, []);

  return {
    // State
    sharedFiles,
    sharedAlbums,
    shareLinks,
    isSharing,
    error,
    invitations,
    selectedFileForSharing,
    selectedAlbumForSharing,

    // Methods
    shareFile,
    createPublicShareLink,
    revokeLink,
    revokeFileAccess,
    getFileSharingInfo,
    getShareAnalytics,
    loadSharedFiles,
    acceptInvitation,
    inviteUser,
    clearError,
    setSelectedFileForSharing,
    setSelectedAlbumForSharing,
  };
}

/**
 * Hook type export
 */
export type UseAdvancedSharing = ReturnType<typeof useAdvancedSharing>;
