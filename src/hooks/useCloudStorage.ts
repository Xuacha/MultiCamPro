/**
 * Cloud Storage Management Hook
 * Gestión de almacenamiento en la nube con auto-sincronización
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  uploadFile,
  batchUploadFiles,
  downloadFile,
  createAlbum,
  getAlbum,
  listAlbums,
  getStorageQuota,
  searchCloudFiles,
  addCloudEventListener,
  formatFileSize,
} from '@/services/cloudStorage';
import {
  CloudFile,
  CloudAlbum,
  CloudStorageQuota,
  CloudStorageStatus,
  UploadTask,
  DownloadTask,
  CloudResult,
  SyncState,
  CloudStorageSettings,
  UploadPriority,
  SyncMode,
  CloudSearchQuery,
  CloudSearchResult,
  CloudEventType,
  CloudStorageEvent,
  AutoUploadPolicy,
} from '@/types/cloud';

// ============================================================================
// Hook State
// ============================================================================

interface CloudStorageState {
  // Files & Albums
  cloudFiles: CloudFile[];
  albums: CloudAlbum[];
  selectedAlbum: CloudAlbum | null;

  // Upload/Download
  activeUploads: Map<string, UploadTask>;
  activeDownloads: Map<string, DownloadTask>;

  // Status
  isLoading: boolean;
  isSyncing: boolean;
  error: Error | null;
  syncState: SyncState;

  // Quota
  quota: CloudStorageQuota | null;

  // Settings
  settings: CloudStorageSettings;
  autoUploadPolicy: AutoUploadPolicy;
}

const defaultSettings: CloudStorageSettings = {
  enabled: true,
  provider: 'firebase',
  autoUpload: false,
  syncMode: SyncMode.MANUAL,
  uploadPriority: UploadPriority.NORMAL,
  uploadOnCellular: false,
  uploadOnlyWifi: true,
  maxUploadSize: 5 * 1024 * 1024 * 1024, // 5GB
  batchUploadSize: 100,
  retryAttempts: 3,
  retryDelayMs: 1000,
  compressionEnabled: true,
  compressionQuality: 85,
};

// ============================================================================
// Custom Hook
// ============================================================================

export function useCloudStorage() {
  const [state, setState] = useState<CloudStorageState>({
    cloudFiles: [],
    albums: [],
    selectedAlbum: null,
    activeUploads: new Map(),
    activeDownloads: new Map(),
    isLoading: false,
    isSyncing: false,
    error: null,
    syncState: {
      isSyncing: false,
      syncProgress: 0,
      pendingUploadCount: 0,
      pendingDownloadCount: 0,
      conflictCount: 0,
      errorCount: 0,
    },
    quota: null,
    settings: defaultSettings,
    autoUploadPolicy: {
      enabled: false,
      uploadOnCellular: false,
      uploadOnlyWifi: true,
      chargeRequired: false,
    },
  });

  const eventUnsubscribeRef = useRef<(() => void) | null>(null);

  // =========================================================================
  // File Operations
  // =========================================================================

  /**
   * Sube un archivo a la nube
   */
  const upload = useCallback(
    async (
      localPath: string,
      fileName: string,
      albumId?: string,
      priority: UploadPriority = UploadPriority.NORMAL
    ): Promise<CloudResult<UploadTask>> => {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      try {
        const result = await uploadFile(localPath, fileName, albumId, priority);
        
        if (result.ok) {
          // Add to active uploads
          setState(prev => {
            const newUploads = new Map(prev.activeUploads);
            newUploads.set(result.value.id, result.value);
            return { ...prev, activeUploads: newUploads };
          });

          // Refresh file list
          await loadCloudFiles();
        } else {
          setState(prev => ({ ...prev, error: result.error }));
        }

        return result;
      } catch (err) {
        const error = err as Error;
        setState(prev => ({ ...prev, error }));
        return {
          ok: false,
          error: {
            code: 'UPLOAD_ERROR',
            message: error.message,
            retryable: true,
          },
        };
      } finally {
        setState(prev => ({ ...prev, isLoading: false }));
      }
    },
    []
  );

  /**
   * Sube múltiples archivos en lote
   */
  const batchUpload = useCallback(
    async (
      files: Array<{ localPath: string; fileName: string }>,
      albumId?: string
    ): Promise<CloudResult<any>> => {
      setState(prev => ({ ...prev, isLoading: true }));

      try {
        const result = await batchUploadFiles(files, albumId);
        
        if (result.ok) {
          // Add all uploads to active
          setState(prev => {
            const newUploads = new Map(prev.activeUploads);
            result.value.files.forEach(file => {
              newUploads.set(file.id, file);
            });
            return { ...prev, activeUploads: newUploads };
          });

          // Refresh
          await loadCloudFiles();
        }

        return result;
      } finally {
        setState(prev => ({ ...prev, isLoading: false }));
      }
    },
    []
  );

  /**
   * Descarga un archivo
   */
  const download = useCallback(
    async (cloudPath: string, localPath: string, fileName: string) => {
      setState(prev => ({ ...prev, isLoading: true }));

      try {
        const result = await downloadFile(cloudPath, localPath, fileName);
        
        if (result.ok) {
          setState(prev => {
            const newDownloads = new Map(prev.activeDownloads);
            newDownloads.set(result.value.id, result.value);
            return { ...prev, activeDownloads: newDownloads };
          });
        }

        return result;
      } finally {
        setState(prev => ({ ...prev, isLoading: false }));
      }
    },
    []
  );

  /**
   * Carga la lista de archivos en la nube
   */
  const loadCloudFiles = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const result = await searchCloudFiles({
        limit: 1000,
      });

      if (result.ok) {
        setState(prev => ({
          ...prev,
          cloudFiles: result.value.results,
          isLoading: false,
        }));
      } else {
        setState(prev => ({
          ...prev,
          error: result.error,
          isLoading: false,
        }));
      }
    } catch (err) {
      setState(prev => ({
        ...prev,
        error: err as Error,
        isLoading: false,
      }));
    }
  }, []);

  // =========================================================================
  // Album Operations
  // =========================================================================

  /**
   * Crea un nuevo álbum
   */
  const createNewAlbum = useCallback(
    async (name: string, description?: string): Promise<CloudResult<CloudAlbum>> => {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      try {
        const result = await createAlbum(name, description);

        if (result.ok) {
          setState(prev => ({
            ...prev,
            albums: [...prev.albums, result.value],
            isLoading: false,
          }));
        } else {
          setState(prev => ({
            ...prev,
            error: result.error,
            isLoading: false,
          }));
        }

        return result;
      } catch (err) {
        const error = err as Error;
        setState(prev => ({ ...prev, error, isLoading: false }));
        return {
          ok: false,
          error: {
            code: 'CREATE_ALBUM_ERROR',
            message: error.message,
            retryable: true,
          },
        };
      }
    },
    []
  );

  /**
   * Selecciona un álbum
   */
  const selectAlbum = useCallback(async (album: CloudAlbum) => {
    setState(prev => ({
      ...prev,
      selectedAlbum: album,
      isLoading: true,
    }));

    try {
      const result = await getAlbum(album.id);
      if (result.ok) {
        setState(prev => ({
          ...prev,
          selectedAlbum: result.value,
          isLoading: false,
        }));
      }
    } catch (err) {
      setState(prev => ({
        ...prev,
        error: err as Error,
        isLoading: false,
      }));
    }
  }, []);

  /**
   * Carga todos los álbumes del usuario
   */
  const loadAlbums = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true }));

    try {
      const result = await listAlbums();

      if (result.ok) {
        setState(prev => ({
          ...prev,
          albums: result.value,
          isLoading: false,
        }));
      }
    } catch (err) {
      setState(prev => ({
        ...prev,
        error: err as Error,
        isLoading: false,
      }));
    }
  }, []);

  // =========================================================================
  // Storage Quota
  // =========================================================================

  /**
   * Carga la información de cuota
   */
  const loadQuota = useCallback(async () => {
    try {
      const result = await getStorageQuota();

      if (result.ok) {
        setState(prev => ({
          ...prev,
          quota: result.value,
        }));

        // Emit warning if quota > 80%
        if (result.value.quota && result.value.usedBytes > result.value.totalBytes * 0.8) {
          setState(prev => ({
            ...prev,
            error: new Error('Storage quota is 80% full'),
          }));
        }
      }
    } catch (err) {
      console.error('Error loading quota:', err);
    }
  }, []);

  // =========================================================================
  // Settings
  // =========================================================================

  /**
   * Actualiza configuración
   */
  const updateSettings = useCallback(
    (newSettings: Partial<CloudStorageSettings>) => {
      setState(prev => ({
        ...prev,
        settings: { ...prev.settings, ...newSettings },
      }));
    },
    []
  );

  /**
   * Actualiza política de auto-carga
   */
  const updateAutoUploadPolicy = useCallback(
    (policy: Partial<AutoUploadPolicy>) => {
      setState(prev => ({
        ...prev,
        autoUploadPolicy: { ...prev.autoUploadPolicy, ...policy },
      }));
    },
    []
  );

  // =========================================================================
  // Sync
  // =========================================================================

  /**
   * Sincroniza archivos
   */
  const sync = useCallback(async () => {
    setState(prev => ({
      ...prev,
      isSyncing: true,
      syncState: { ...prev.syncState, isSyncing: true, syncProgress: 0 },
    }));

    try {
      // Load files and albums
      await loadCloudFiles();
      await loadAlbums();
      await loadQuota();

      setState(prev => ({
        ...prev,
        isSyncing: false,
        syncState: {
          ...prev.syncState,
          isSyncing: false,
          syncProgress: 100,
          lastSyncTime: Date.now(),
        },
      }));
    } catch (err) {
      setState(prev => ({
        ...prev,
        isSyncing: false,
        error: err as Error,
        syncState: {
          ...prev.syncState,
          isSyncing: false,
          errorCount: prev.syncState.errorCount + 1,
        },
      }));
    }
  }, [loadCloudFiles, loadAlbums, loadQuota]);

  // =========================================================================
  // Event Handling
  // =========================================================================

  useEffect(() => {
    // Subscribe to cloud events
    const unsubscribe = addCloudEventListener((event: CloudStorageEvent) => {
      switch (event.type) {
        case CloudEventType.UPLOAD_PROGRESS:
          setState(prev => {
            const uploads = new Map(prev.activeUploads);
            const upload = uploads.get(event.data.uploadId);
            if (upload) {
              upload.progress = event.data.progress;
              uploads.set(event.data.uploadId, upload);
            }
            return { ...prev, activeUploads: uploads };
          });
          break;

        case CloudEventType.UPLOAD_COMPLETED:
          setState(prev => {
            const uploads = new Map(prev.activeUploads);
            uploads.delete(event.data.uploadId);
            return { ...prev, activeUploads: uploads };
          });
          break;

        case CloudEventType.QUOTA_WARNING:
          setState(prev => ({
            ...prev,
            error: new Error('Storage quota warning'),
          }));
          break;

        default:
          break;
      }
    });

    eventUnsubscribeRef.current = unsubscribe;

    // Load initial data
    loadCloudFiles();
    loadAlbums();
    loadQuota();

    return () => {
      if (eventUnsubscribeRef.current) {
        eventUnsubscribeRef.current();
      }
    };
  }, [loadCloudFiles, loadAlbums, loadQuota]);

  // =========================================================================
  // Auto-sync Effect
  // =========================================================================

  useEffect(() => {
    if (state.settings.syncMode === SyncMode.AUTO) {
      const interval = setInterval(sync, 30000); // 30 seconds

      return () => clearInterval(interval);
    }
  }, [state.settings.syncMode, sync]);

  // =========================================================================
  // Return Hook API
  // =========================================================================

  return {
    // State
    cloudFiles: state.cloudFiles,
    albums: state.albums,
    selectedAlbum: state.selectedAlbum,
    activeUploads: Array.from(state.activeUploads.values()),
    activeDownloads: Array.from(state.activeDownloads.values()),
    isLoading: state.isLoading,
    isSyncing: state.isSyncing,
    error: state.error,
    syncState: state.syncState,
    quota: state.quota,
    settings: state.settings,
    autoUploadPolicy: state.autoUploadPolicy,

    // File Operations
    upload,
    batchUpload,
    download,
    loadCloudFiles,

    // Album Operations
    createNewAlbum,
    selectAlbum,
    loadAlbums,

    // Settings
    updateSettings,
    updateAutoUploadPolicy,

    // Quota
    loadQuota,

    // Sync
    sync,

    // Utilities
    formatFileSize,
  };
}
