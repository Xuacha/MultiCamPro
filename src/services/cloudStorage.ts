/**
 * Firebase Cloud Storage Service
 * Gestión de almacenamiento en la nube con Firebase Storage
 */

import { getStorage, ref, uploadBytes, downloadBytes, deleteObject, listAll, getBytes, getMetadata } from 'firebase/storage';
import { getFirestore, collection, doc, setDoc, getDoc, updateDoc, query, where, getDocs, deleteDoc, writeBatch } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import * as FileSystem from 'expo-file-system';
import * as Crypto from 'expo-crypto';

import {
  CloudFile,
  CloudAlbum,
  CloudStorageQuota,
  UploadTask,
  DownloadTask,
  CloudStorageStatus,
  CloudResult,
  CloudError,
  FileAccessLevel,
  CloudFileMetadata,
  SyncState,
  BatchUploadSession,
  UploadPriority,
  CloudSearchQuery,
  CloudSearchResult,
  CloudEventType,
  CloudStorageEvent,
} from '@/types/cloud';

// ============================================================================
// Constants
// ============================================================================

const STORAGE_BUCKET = 'multicamp-uploads';
const FIRESTORE_COLLECTIONS = {
  FILES: 'cloud_files',
  ALBUMS: 'cloud_albums',
  SHARES: 'cloud_shares',
  UPLOADS: 'upload_tasks',
  BACKUPS: 'backups',
};

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;
const BATCH_SIZE = 100;
const MD5_CHUNK_SIZE = 1024 * 1024; // 1MB

// ============================================================================
// Event Listeners
// ============================================================================

type CloudEventListener = (event: CloudStorageEvent) => void;
const eventListeners: CloudEventListener[] = [];

export function addCloudEventListener(listener: CloudEventListener): () => void {
  eventListeners.push(listener);
  return () => {
    const index = eventListeners.indexOf(listener);
    if (index > -1) eventListeners.splice(index, 1);
  };
}

function emitEvent(type: CloudEventType, data: Record<string, any>): void {
  const event: CloudStorageEvent = {
    type,
    timestamp: Date.now(),
    data,
  };
  eventListeners.forEach(listener => {
    try {
      listener(event);
    } catch (err) {
      console.error('Event listener error:', err);
    }
  });
}

// ============================================================================
// Upload Management
// ============================================================================

/**
 * Inicia carga de archivo a Firebase Storage
 */
export async function uploadFile(
  localPath: string,
  fileName: string,
  albumId?: string,
  priority: UploadPriority = UploadPriority.NORMAL
): Promise<CloudResult<UploadTask>> {
  try {
    const auth = getAuth();
    if (!auth.currentUser) {
      return {
        ok: false,
        error: {
          code: 'AUTH_REQUIRED',
          message: 'User must be authenticated',
          retryable: false,
        } as CloudError,
      };
    }

    // Get file info
    const fileInfo = await FileSystem.getInfoAsync(localPath);
    if (!fileInfo.exists) {
      return {
        ok: false,
        error: {
          code: 'FILE_NOT_FOUND',
          message: `File not found: ${localPath}`,
          retryable: false,
        } as CloudError,
      };
    }

    const fileSize = fileInfo.size || 0;
    const uploadId = `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Calculate MD5 hash
    const md5Hash = await calculateFileMD5(localPath);
    
    // Prepare cloud path
    const cloudPath = `users/${auth.currentUser.uid}/albums/${albumId || 'general'}/${uploadId}/${fileName}`;
    
    // Create upload task record
    const uploadTask: UploadTask = {
      id: uploadId,
      fileId: `file_${uploadId}`,
      localPath,
      cloudPath,
      fileName,
      fileSize,
      uploadedBytes: 0,
      progress: 0,
      status: CloudStorageStatus.UPLOADING,
      priority,
      createdAt: Date.now(),
      retryCount: 0,
      maxRetries: MAX_RETRIES,
    };

    // Emit event
    emitEvent(CloudEventType.UPLOAD_STARTED, {
      uploadId,
      fileName,
      fileSize,
      albumId,
    });

    // Read file and upload
    const fileBytes = await FileSystem.readAsStringAsync(localPath, {
      encoding: FileSystem.EncodingType.Base64,
    });
    
    const buffer = Buffer.from(fileBytes, 'base64');
    
    // Upload to Firebase Storage
    const storage = getStorage();
    const fileRef = ref(storage, cloudPath);
    
    await uploadBytes(fileRef, buffer);
    
    // Create file record in Firestore
    const db = getFirestore();
    const cloudFile: CloudFile = {
      id: uploadTask.fileId,
      name: fileName,
      size: fileSize,
      mimeType: getMimeType(fileName),
      uploadedAt: Date.now(),
      cloudPath,
      md5Hash,
      accessLevel: FileAccessLevel.PRIVATE,
    };

    await setDoc(
      doc(db, FIRESTORE_COLLECTIONS.FILES, uploadTask.fileId),
      {
        ...cloudFile,
        userId: auth.currentUser.uid,
        albumId: albumId || 'general',
        createdAt: Date.now(),
      }
    );

    // Update upload task to completed
    uploadTask.status = CloudStorageStatus.IDLE;
    uploadTask.progress = 100;
    uploadTask.uploadedBytes = fileSize;
    uploadTask.completedAt = Date.now();

    emitEvent(CloudEventType.UPLOAD_COMPLETED, {
      uploadId,
      fileName,
      fileSize,
      result: 'success',
    });

    return { ok: true, value: uploadTask };
  } catch (error) {
    const err = error as Error;
    const cloudError: CloudError = {
      name: 'CloudError',
      code: 'UPLOAD_FAILED',
      message: err.message,
      retryable: true,
      details: { originalError: err },
    };

    emitEvent(CloudEventType.UPLOAD_FAILED, {
      fileName,
      error: err.message,
    });

    return { ok: false, error: cloudError };
  }
}

/**
 * Carga múltiples archivos en lote
 */
export async function batchUploadFiles(
  files: Array<{ localPath: string; fileName: string }>,
  albumId?: string
): Promise<CloudResult<BatchUploadSession>> {
  try {
    const sessionId = `batch_${Date.now()}`;
    const uploadTasks: UploadTask[] = [];
    let totalSize = 0;
    let uploadedSize = 0;

    for (const file of files) {
      const result = await uploadFile(file.localPath, file.fileName, albumId);
      if (result.ok) {
        uploadTasks.push(result.value);
        totalSize += result.value.fileSize;
        uploadedSize += result.value.uploadedBytes;
      }
    }

    const session: BatchUploadSession = {
      id: sessionId,
      albumId,
      files: uploadTasks,
      totalSize,
      uploadedSize,
      progress: (uploadedSize / totalSize) * 100,
      status: CloudStorageStatus.IDLE,
      createdAt: Date.now(),
      failedCount: files.length - uploadTasks.length,
      successCount: uploadTasks.length,
    };

    return { ok: true, value: session };
  } catch (error) {
    const err = error as Error;
    return {
      ok: false,
      error: {
        code: 'BATCH_UPLOAD_FAILED',
        message: err.message,
        retryable: true,
      } as CloudError,
    };
  }
}

// ============================================================================
// Download Management
// ============================================================================

/**
 * Descarga archivo desde Firebase Storage
 */
export async function downloadFile(
  cloudPath: string,
  localPath: string,
  fileName: string
): Promise<CloudResult<DownloadTask>> {
  try {
    const downloadId = `download_${Date.now()}`;

    const downloadTask: DownloadTask = {
      id: downloadId,
      fileId: `file_${downloadId}`,
      cloudPath,
      localPath: `${localPath}/${fileName}`,
      fileName,
      fileSize: 0,
      downloadedBytes: 0,
      progress: 0,
      status: CloudStorageStatus.DOWNLOADING,
      createdAt: Date.now(),
      paused: false,
    };

    emitEvent(CloudEventType.DOWNLOAD_STARTED, {
      downloadId,
      fileName,
    });

    const storage = getStorage();
    const fileRef = ref(storage, cloudPath);

    // Get file size first
    const metadata = await getMetadata(fileRef);
    downloadTask.fileSize = metadata.size || 0;

    // Download file
    const bytes = await getBytes(fileRef);
    const base64String = Buffer.from(bytes).toString('base64');

    // Ensure directory exists
    const dirInfo = await FileSystem.getInfoAsync(localPath);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(localPath, { intermediates: true });
    }

    // Write file
    await FileSystem.writeAsStringAsync(
      `${localPath}/${fileName}`,
      base64String,
      { encoding: FileSystem.EncodingType.Base64 }
    );

    downloadTask.status = CloudStorageStatus.IDLE;
    downloadTask.progress = 100;
    downloadedBytes: bytes.length;

    emitEvent(CloudEventType.DOWNLOAD_COMPLETED, {
      downloadId,
      fileName,
    });

    return { ok: true, value: downloadTask };
  } catch (error) {
    const err = error as Error;
    return {
      ok: false,
      error: {
        code: 'DOWNLOAD_FAILED',
        message: err.message,
        retryable: true,
      } as CloudError,
    };
  }
}

// ============================================================================
// Album Management
// ============================================================================

/**
 * Crea un nuevo álbum en la nube
 */
export async function createAlbum(
  name: string,
  description?: string
): Promise<CloudResult<CloudAlbum>> {
  try {
    const auth = getAuth();
    if (!auth.currentUser) {
      return {
        ok: false,
        error: {
          code: 'AUTH_REQUIRED',
          message: 'User must be authenticated',
          retryable: false,
        } as CloudError,
      };
    }

    const albumId = `album_${Date.now()}`;
    const now = Date.now();

    const album: CloudAlbum = {
      id: albumId,
      name,
      description,
      createdAt: now,
      updatedAt: now,
      files: [],
      totalSize: 0,
      fileCount: 0,
      isPrivate: true,
      owner: auth.currentUser.uid,
    };

    const db = getFirestore();
    await setDoc(doc(db, FIRESTORE_COLLECTIONS.ALBUMS, albumId), {
      ...album,
      userId: auth.currentUser.uid,
    });

    return { ok: true, value: album };
  } catch (error) {
    const err = error as Error;
    return {
      ok: false,
      error: {
        code: 'ALBUM_CREATION_FAILED',
        message: err.message,
        retryable: true,
      } as CloudError,
    };
  }
}

/**
 * Obtiene un álbum específico
 */
export async function getAlbum(albumId: string): Promise<CloudResult<CloudAlbum>> {
  try {
    const auth = getAuth();
    if (!auth.currentUser) {
      return {
        ok: false,
        error: {
          code: 'AUTH_REQUIRED',
          message: 'User must be authenticated',
          retryable: false,
        } as CloudError,
      };
    }

    const db = getFirestore();
    const albumDoc = await getDoc(
      doc(db, FIRESTORE_COLLECTIONS.ALBUMS, albumId)
    );

    if (!albumDoc.exists()) {
      return {
        ok: false,
        error: {
          code: 'ALBUM_NOT_FOUND',
          message: `Album not found: ${albumId}`,
          retryable: false,
        } as CloudError,
      };
    }

    const album = albumDoc.data() as CloudAlbum;
    return { ok: true, value: album };
  } catch (error) {
    const err = error as Error;
    return {
      ok: false,
      error: {
        code: 'GET_ALBUM_FAILED',
        message: err.message,
        retryable: true,
      } as CloudError,
    };
  }
}

/**
 * Lista todos los álbumes del usuario
 */
export async function listAlbums(): Promise<CloudResult<CloudAlbum[]>> {
  try {
    const auth = getAuth();
    if (!auth.currentUser) {
      return {
        ok: false,
        error: {
          code: 'AUTH_REQUIRED',
          message: 'User must be authenticated',
          retryable: false,
        } as CloudError,
      };
    }

    const db = getFirestore();
    const q = query(
      collection(db, FIRESTORE_COLLECTIONS.ALBUMS),
      where('userId', '==', auth.currentUser.uid)
    );

    const albums = await getDocs(q);
    const result = albums.docs.map(doc => doc.data() as CloudAlbum);

    return { ok: true, value: result };
  } catch (error) {
    const err = error as Error;
    return {
      ok: false,
      error: {
        code: 'LIST_ALBUMS_FAILED',
        message: err.message,
        retryable: true,
      } as CloudError,
    };
  }
}

// ============================================================================
// Storage Quota Management
// ============================================================================

/**
 * Obtiene información de cuota de almacenamiento
 */
export async function getStorageQuota(): Promise<CloudResult<CloudStorageQuota>> {
  try {
    const auth = getAuth();
    if (!auth.currentUser) {
      return {
        ok: false,
        error: {
          code: 'AUTH_REQUIRED',
          message: 'User must be authenticated',
          retryable: false,
        } as CloudError,
      };
    }

    const db = getFirestore();
    const q = query(
      collection(db, FIRESTORE_COLLECTIONS.FILES),
      where('userId', '==', auth.currentUser.uid)
    );

    const files = await getDocs(q);
    let totalBytes = 0;
    let fileCount = 0;

    files.forEach(doc => {
      const file = doc.data();
      totalBytes += file.size || 0;
      fileCount++;
    });

    // Get album count
    const albumQuery = query(
      collection(db, FIRESTORE_COLLECTIONS.ALBUMS),
      where('userId', '==', auth.currentUser.uid)
    );
    const albums = await getDocs(albumQuery);

    // Default to 5GB free tier
    const totalAllocated = 5 * 1024 * 1024 * 1024; // 5GB

    const quota: CloudStorageQuota = {
      totalBytes: totalAllocated,
      usedBytes: totalBytes,
      availableBytes: totalAllocated - totalBytes,
      fileCount,
      albumCount: albums.size,
      lastUpdated: Date.now(),
      plan: 'free',
    };

    return { ok: true, value: quota };
  } catch (error) {
    const err = error as Error;
    return {
      ok: false,
      error: {
        code: 'GET_QUOTA_FAILED',
        message: err.message,
        retryable: true,
      } as CloudError,
    };
  }
}

// ============================================================================
// File Search
// ============================================================================

/**
 * Busca archivos en la nube
 */
export async function searchCloudFiles(
  query: CloudSearchQuery
): Promise<CloudResult<CloudSearchResult>> {
  try {
    const auth = getAuth();
    if (!auth.currentUser) {
      return {
        ok: false,
        error: {
          code: 'AUTH_REQUIRED',
          message: 'User must be authenticated',
          retryable: false,
        } as CloudError,
      };
    }

    const db = getFirestore();
    let q = query(
      collection(db, FIRESTORE_COLLECTIONS.FILES),
      where('userId', '==', auth.currentUser.uid)
    );

    const results = await getDocs(q);
    let files = results.docs.map(doc => doc.data() as CloudFile);

    // Apply filters
    if (query.keywords && query.keywords.length > 0) {
      files = files.filter(f =>
        query.keywords!.some(k =>
          f.name.toLowerCase().includes(k.toLowerCase())
        )
      );
    }

    if (query.fileType) {
      files = files.filter(f => f.mimeType.includes(query.fileType!));
    }

    if (query.minSize) {
      files = files.filter(f => f.size >= query.minSize!);
    }

    if (query.maxSize) {
      files = files.filter(f => f.size <= query.maxSize!);
    }

    // Sort results
    const sortField = query.sortBy || 'date';
    const sortOrder = query.sortOrder || 'desc';

    files.sort((a, b) => {
      let aVal: any = a.uploadedAt;
      let bVal: any = b.uploadedAt;

      if (sortField === 'name') {
        aVal = a.name;
        bVal = b.name;
      } else if (sortField === 'size') {
        aVal = a.size;
        bVal = b.size;
      }

      const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    // Apply pagination
    const offset = query.offset || 0;
    const limit = query.limit || 50;
    const paginatedFiles = files.slice(offset, offset + limit);

    const searchResult: CloudSearchResult = {
      totalCount: files.length,
      results: paginatedFiles,
    };

    return { ok: true, value: searchResult };
  } catch (error) {
    const err = error as Error;
    return {
      ok: false,
      error: {
        code: 'SEARCH_FAILED',
        message: err.message,
        retryable: true,
      } as CloudError,
    };
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Calcula hash MD5 de un archivo
 */
async function calculateFileMD5(filePath: string): Promise<string> {
  try {
    const fileContent = await FileSystem.readAsStringAsync(filePath, {
      encoding: FileSystem.EncodingType.Base64,
    });
    const hash = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.MD5,
      fileContent
    );
    return hash;
  } catch {
    return '';
  }
}

/**
 * Determina el MIME type basado en la extensión
 */
function getMimeType(fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase() || '';
  const mimeTypes: Record<string, string> = {
    mp4: 'video/mp4',
    mov: 'video/quicktime',
    avi: 'video/x-msvideo',
    mkv: 'video/x-matroska',
    mp3: 'audio/mpeg',
    wav: 'audio/wav',
    m4a: 'audio/mp4',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    pdf: 'application/pdf',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  };
  return mimeTypes[ext] || 'application/octet-stream';
}

/**
 * Formatea tamaño de archivo de manera legible
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}
