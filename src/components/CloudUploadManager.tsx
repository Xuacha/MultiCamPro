/**
 * Cloud Upload Manager Component
 * Gestiona carga de archivos con progreso y estado
 */

import React from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ProgressBarAndroid,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { UploadTask, CloudStorageStatus, UploadPriority } from '@/types/cloud';

interface CloudUploadManagerProps {
  activeUploads: UploadTask[];
  onPauseUpload?: (uploadId: string) => void;
  onResumeUpload?: (uploadId: string) => void;
  onCancelUpload?: (uploadId: string) => void;
  onRetryUpload?: (uploadId: string) => void;
}

export function CloudUploadManager({
  activeUploads,
  onPauseUpload,
  onResumeUpload,
  onCancelUpload,
  onRetryUpload,
}: CloudUploadManagerProps) {
  const renderUploadItem = ({ item }: { item: UploadTask }) => {
    const isCompleted = item.status === CloudStorageStatus.IDLE && item.progress === 100;
    const isFailed = item.status === CloudStorageStatus.ERROR;
    const isPaused = item.status === CloudStorageStatus.PAUSED;
    const isUploading = item.status === CloudStorageStatus.UPLOADING;

    const getPriorityColor = (priority: UploadPriority): string => {
      switch (priority) {
        case UploadPriority.CRITICAL:
          return '#ff4444';
        case UploadPriority.HIGH:
          return '#ff9800';
        case UploadPriority.NORMAL:
          return '#2196F3';
        case UploadPriority.LOW:
          return '#4CAF50';
        default:
          return '#999';
      }
    };

    const getStatusIcon = (): string => {
      if (isCompleted) return '✅';
      if (isFailed) return '❌';
      if (isPaused) return '⏸️';
      if (isUploading) return '⬆️';
      return '🔄';
    };

    return (
      <View style={[styles.uploadItem, isFailed && styles.uploadItemError]}>
        {/* Status Icon */}
        <View style={styles.statusIcon}>
          <Text style={styles.statusIconText}>{getStatusIcon()}</Text>
        </View>

        {/* Upload Info */}
        <View style={styles.uploadInfo}>
          <Text style={styles.fileName} numberOfLines={1}>
            {item.fileName}
          </Text>

          {/* Progress Bar */}
          <View style={styles.progressContainer}>
            <ProgressBarAndroid
              styleAttr="Horizontal"
              indeterminate={false}
              progress={item.progress / 100}
              color={getPriorityColor(item.priority)}
              style={styles.progressBar}
            />
            <Text style={styles.progressText}>{Math.round(item.progress)}%</Text>
          </View>

          {/* File Size & Speed */}
          <View style={styles.uploadStats}>
            <Text style={styles.statText}>
              {formatBytes(item.uploadedBytes)} / {formatBytes(item.fileSize)}
            </Text>
            {isUploading && (
              <Text style={styles.statText}>
                {calculateSpeed(item)}
              </Text>
            )}
          </View>

          {/* Error Message */}
          {isFailed && item.errorMessage && (
            <Text style={styles.errorMessage} numberOfLines={1}>
              {item.errorMessage}
            </Text>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          {isUploading && onPauseUpload && (
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => onPauseUpload(item.id)}
            >
              <Text style={styles.iconButtonText}>⏸</Text>
            </TouchableOpacity>
          )}

          {isPaused && onResumeUpload && (
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => onResumeUpload(item.id)}
            >
              <Text style={styles.iconButtonText}>▶</Text>
            </TouchableOpacity>
          )}

          {isFailed && onRetryUpload && (
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => onRetryUpload(item.id)}
            >
              <Text style={styles.iconButtonText}>🔄</Text>
            </TouchableOpacity>
          )}

          {onCancelUpload && !isCompleted && (
            <TouchableOpacity
              style={[styles.iconButton, styles.cancelButton]}
              onPress={() => onCancelUpload(item.id)}
            >
              <Text style={styles.iconButtonText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  if (activeUploads.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No active uploads</Text>
      </View>
    );
  }

  // Calculate overall progress
  const totalSize = activeUploads.reduce((sum, u) => sum + u.fileSize, 0);
  const uploadedSize = activeUploads.reduce((sum, u) => sum + u.uploadedBytes, 0);
  const overallProgress = totalSize > 0 ? (uploadedSize / totalSize) * 100 : 0;

  return (
    <View style={styles.container}>
      {/* Overall Progress */}
      {activeUploads.some(u => u.status === CloudStorageStatus.UPLOADING) && (
        <View style={styles.overallProgress}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressTitle}>Overall Progress</Text>
            <Text style={styles.progressPercent}>
              {Math.round(overallProgress)}%
            </Text>
          </View>
          <ProgressBarAndroid
            styleAttr="Horizontal"
            indeterminate={false}
            progress={overallProgress / 100}
            color="#2196F3"
            style={styles.overallProgressBar}
          />
          <Text style={styles.progressDetails}>
            {formatBytes(uploadedSize)} / {formatBytes(totalSize)}
          </Text>
        </View>
      )}

      {/* Uploads List */}
      <FlatList
        data={activeUploads}
        renderItem={renderUploadItem}
        keyExtractor={(item) => item.id}
        scrollEnabled={false}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </View>
  );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginVertical: 8,
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: '#999',
    fontSize: 14,
  },
  overallProgress: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  progressPercent: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2196F3',
  },
  overallProgressBar: {
    height: 6,
    marginBottom: 8,
  },
  progressDetails: {
    fontSize: 12,
    color: '#666',
  },
  uploadItem: {
    flexDirection: 'row',
    paddingVertical: 12,
    alignItems: 'center',
  },
  uploadItemError: {
    backgroundColor: '#ffebee',
    marginHorizontal: -12,
    paddingHorizontal: 12,
    marginVertical: -12,
    paddingVertical: 12,
  },
  statusIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  statusIconText: {
    fontSize: 20,
  },
  uploadInfo: {
    flex: 1,
    marginRight: 8,
  },
  fileName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  progressBar: {
    flex: 1,
    height: 6,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    minWidth: 40,
    textAlign: 'right',
  },
  uploadStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statText: {
    fontSize: 12,
    color: '#999',
  },
  errorMessage: {
    fontSize: 12,
    color: '#d32f2f',
    marginTop: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#ffebee',
  },
  iconButtonText: {
    fontSize: 16,
  },
  separator: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginVertical: 8,
  },
});

// ============================================================================
// Helpers
// ============================================================================

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

function calculateSpeed(upload: UploadTask): string {
  if (!upload.startedAt) return '';
  const elapsed = (Date.now() - upload.startedAt) / 1000; // seconds
  if (elapsed === 0) return '';
  const speed = upload.uploadedBytes / elapsed; // bytes per second
  return `${formatBytes(Math.round(speed))}/s`;
}
