/**
 * Cloud Albums Component
 * Muestra y gestiona álbumes en la nube
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Image,
} from 'react-native';
import { CloudAlbum, CloudStorageStatus } from '@/types/cloud';

interface CloudAlbumsProps {
  albums: CloudAlbum[];
  selectedAlbum: CloudAlbum | null;
  onSelectAlbum: (album: CloudAlbum) => void;
  onCreateAlbum: (name: string, description?: string) => Promise<void>;
  isLoading?: boolean;
}

export function CloudAlbums({
  albums,
  selectedAlbum,
  onSelectAlbum,
  onCreateAlbum,
  isLoading = false,
}: CloudAlbumsProps) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newAlbumName, setNewAlbumName] = useState('');
  const [newAlbumDescription, setNewAlbumDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateAlbum = async () => {
    if (!newAlbumName.trim()) return;

    setIsCreating(true);
    try {
      await onCreateAlbum(newAlbumName, newAlbumDescription);
      setNewAlbumName('');
      setNewAlbumDescription('');
      setShowCreateModal(false);
    } catch (err) {
      console.error('Error creating album:', err);
    } finally {
      setIsCreating(false);
    }
  };

  const renderAlbumCard = ({ item }: { item: CloudAlbum }) => {
    const isSelected = selectedAlbum?.id === item.id;
    const storagePercent = ((item.totalSize / (5 * 1024 * 1024 * 1024)) * 100).toFixed(1);

    return (
      <TouchableOpacity
        style={[
          styles.albumCard,
          isSelected && styles.albumCardSelected,
        ]}
        onPress={() => onSelectAlbum(item)}
      >
        {/* Cover Image */}
        {item.coverImage ? (
          <Image
            source={{ uri: item.coverImage }}
            style={styles.coverImage}
          />
        ) : (
          <View style={styles.placeholderCover}>
            <Text style={styles.placeholderIcon}>📁</Text>
          </View>
        )}

        {/* Album Info */}
        <View style={styles.albumInfo}>
          <Text style={styles.albumName} numberOfLines={1}>
            {item.name}
          </Text>
          
          {item.description && (
            <Text style={styles.albumDescription} numberOfLines={2}>
              {item.description}
            </Text>
          )}

          {/* File Count & Size */}
          <View style={styles.albumStats}>
            <Text style={styles.statText}>
              📸 {item.fileCount} files
            </Text>
            <Text style={styles.statText}>
              💾 {formatBytes(item.totalSize)}
            </Text>
          </View>

          {/* Storage Bar */}
          <View style={styles.storageBar}>
            <View
              style={[
                styles.storageUsed,
                {
                  width: `${Math.min(parseFloat(storagePercent), 100)}%`,
                  backgroundColor: parseFloat(storagePercent) > 80 ? '#ff6b6b' : '#4CAF50',
                },
              ]}
            />
          </View>
        </View>

        {/* Private Badge */}
        {item.isPrivate && (
          <View style={styles.privateBadge}>
            <Text style={styles.privateBadgeText}>🔒</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Albums</Text>
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => setShowCreateModal(true)}
        >
          <Text style={styles.createButtonText}>+ New</Text>
        </TouchableOpacity>
      </View>

      {/* Albums List */}
      {albums.length > 0 ? (
        <FlatList
          data={albums}
          renderItem={renderAlbumCard}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.listContainer}
          scrollEnabled={false}
        />
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📚</Text>
          <Text style={styles.emptyText}>No albums yet</Text>
          <Text style={styles.emptySubText}>Create an album to organize your files</Text>
        </View>
      )}

      {/* Create Album Modal */}
      <Modal
        visible={showCreateModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Create New Album</Text>

            <TextInput
              style={styles.input}
              placeholder="Album name"
              placeholderTextColor="#999"
              value={newAlbumName}
              onChangeText={setNewAlbumName}
              editable={!isCreating}
            />

            <TextInput
              style={[styles.input, styles.descriptionInput]}
              placeholder="Description (optional)"
              placeholderTextColor="#999"
              value={newAlbumDescription}
              onChangeText={setNewAlbumDescription}
              multiline
              numberOfLines={3}
              editable={!isCreating}
            />

            {/* Buttons */}
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowCreateModal(false)}
                disabled={isCreating}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.createModalButton]}
                onPress={handleCreateAlbum}
                disabled={!newAlbumName.trim() || isCreating}
              >
                {isCreating ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.createModalButtonText}>Create</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  createButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#2196F3',
    borderRadius: 6,
  },
  createButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  listContainer: {
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  albumCard: {
    flex: 0.48,
    marginVertical: 8,
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  albumCardSelected: {
    borderWidth: 3,
    borderColor: '#2196F3',
  },
  coverImage: {
    width: '100%',
    height: 120,
    resizeMode: 'cover',
  },
  placeholderCover: {
    width: '100%',
    height: 120,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderIcon: {
    fontSize: 48,
  },
  albumInfo: {
    padding: 12,
  },
  albumName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  albumDescription: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  albumStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  statText: {
    fontSize: 12,
    color: '#666',
  },
  storageBar: {
    height: 6,
    backgroundColor: '#e0e0e0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  storageUsed: {
    height: '100%',
    borderRadius: 3,
  },
  privateBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    padding: 4,
  },
  privateBadgeText: {
    fontSize: 14,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    marginBottom: 12,
    color: '#333',
  },
  descriptionInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    marginTop: 20,
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
  },
  cancelButtonText: {
    color: '#333',
    fontWeight: '600',
  },
  createModalButton: {
    backgroundColor: '#2196F3',
  },
  createModalButtonText: {
    color: '#fff',
    fontWeight: '600',
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
