import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { FileInfo, FileType } from '../types/controller';

interface FileManagerProps {
  files: FileInfo[];
  currentPath: string;
  isLoading?: boolean;
  onFilePress?: (file: FileInfo) => void;
  onFolderPress?: (folder: FileInfo) => void;
  onNavigateUp?: () => void;
  onDelete?: (file: FileInfo) => void;
  onDownload?: (file: FileInfo) => void;
}

const getFileIcon = (type: FileType): string => {
  const icons: Record<FileType, string> = {
    [FileType.VIDEO]: '🎬',
    [FileType.PHOTO]: '📷',
    [FileType.AUDIO]: '🎵',
    [FileType.DOCUMENT]: '📄',
    [FileType.FOLDER]: '📁',
    [FileType.OTHER]: '📦',
  };
  return icons[type] || '📦';
};

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};

export const FileManager: React.FC<FileManagerProps> = ({
  files,
  currentPath,
  isLoading = false,
  onFilePress,
  onFolderPress,
  onNavigateUp,
  onDelete,
  onDownload,
}) => {
  const renderFileItem = ({ item }: { item: FileInfo }) => {
    const isFolder = item.type === FileType.FOLDER;

    return (
      <TouchableOpacity
        style={styles.fileItem}
        onPress={() => {
          if (isFolder && onFolderPress) {
            onFolderPress(item);
          } else if (!isFolder && onFilePress) {
            onFilePress(item);
          }
        }}
        onLongPress={() => {
          // Long press to show options
        }}
      >
        <View style={styles.fileIconContainer}>
          <Text style={styles.fileIcon}>{getFileIcon(item.type)}</Text>
        </View>

        <View style={styles.fileInfo}>
          <Text style={styles.fileName} numberOfLines={1}>
            {item.name}
          </Text>
          <View style={styles.fileDetails}>
            <Text style={styles.fileSize}>{formatFileSize(item.size)}</Text>
            <Text style={styles.fileSeparator}>•</Text>
            <Text style={styles.fileDate}>
              {new Date(item.modifiedAt).toLocaleDateString()}
            </Text>
          </View>
        </View>

        <View style={styles.fileActions}>
          {!isFolder && onDownload && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => onDownload(item)}
            >
              <Text style={styles.actionIcon}>⬇️</Text>
            </TouchableOpacity>
          )}

          {onDelete && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => onDelete(item)}
            >
              <Text style={styles.actionIcon}>🗑️</Text>
            </TouchableOpacity>
          )}

          {isFolder && (
            <Text style={styles.folderIndicator}>›</Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Breadcrumb Navigation */}
      <View style={styles.breadcrumb}>
        {onNavigateUp && currentPath !== '/' && (
          <TouchableOpacity
            style={styles.breadcrumbButton}
            onPress={onNavigateUp}
          >
            <Text style={styles.breadcrumbText}>⬅️ Back</Text>
          </TouchableOpacity>
        )}
        <Text style={styles.pathText}>{currentPath || '/'}</Text>
      </View>

      {/* File List */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2196F3" />
          <Text style={styles.loadingText}>Loading files...</Text>
        </View>
      ) : files.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>📭</Text>
          <Text style={styles.emptyText}>No files found</Text>
        </View>
      ) : (
        <FlatList
          data={files}
          keyExtractor={item => item.fileId}
          renderItem={renderFileItem}
          scrollEnabled={false}
        />
      )}

      {/* Summary */}
      {files.length > 0 && (
        <View style={styles.summary}>
          <Text style={styles.summaryText}>
            {files.length} file{files.length !== 1 ? 's' : ''}
            {' • '}
            {formatFileSize(files.reduce((sum, f) => sum + f.size, 0))}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    marginHorizontal: 12,
    marginVertical: 8,
    overflow: 'hidden',
  },
  breadcrumb: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  breadcrumbButton: {
    marginRight: 12,
  },
  breadcrumbText: {
    color: '#2196F3',
    fontSize: 13,
    fontWeight: '600',
  },
  pathText: {
    flex: 1,
    fontSize: 12,
    color: '#666',
    fontFamily: 'monospace',
  },
  fileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#FAFAFA',
  },
  fileIconContainer: {
    marginRight: 12,
  },
  fileIcon: {
    fontSize: 20,
  },
  fileInfo: {
    flex: 1,
  },
  fileName: {
    fontSize: 13,
    fontWeight: '500',
    color: '#212121',
    marginBottom: 4,
  },
  fileDetails: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fileSize: {
    fontSize: 11,
    color: '#999',
  },
  fileSeparator: {
    marginHorizontal: 6,
    color: '#DDD',
  },
  fileDate: {
    fontSize: 11,
    color: '#999',
  },
  fileActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  actionIcon: {
    fontSize: 16,
  },
  folderIndicator: {
    fontSize: 18,
    color: '#2196F3',
    fontWeight: 'bold',
  },
  loadingContainer: {
    paddingVertical: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#666',
    fontSize: 13,
  },
  emptyContainer: {
    paddingVertical: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: 12,
  },
  emptyText: {
    color: '#999',
    fontSize: 14,
  },
  summary: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
    backgroundColor: '#FAFAFA',
  },
  summaryText: {
    fontSize: 11,
    color: '#666',
    fontWeight: '500',
  },
});
