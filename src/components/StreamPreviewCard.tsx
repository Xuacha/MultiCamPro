import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { StreamPreview } from '../types/controller';

interface StreamPreviewCardProps {
  preview: StreamPreview;
  isSelected?: boolean;
  onPress?: () => void;
  onClose?: () => void;
  showMetrics?: boolean;
}

export const StreamPreviewCard: React.FC<StreamPreviewCardProps> = ({
  preview,
  isSelected = false,
  onPress,
  onClose,
  showMetrics = true,
}) => {
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    if (!preview.isLive) return;

    const interval = setInterval(() => {
      setDuration(prev => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [preview.isLive]);

  const formatDuration = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const qualityColor = {
    low: '#FF9800',
    medium: '#2196F3',
    high: '#4CAF50',
  }[preview.quality];

  return (
    <TouchableOpacity
      style={[
        styles.container,
        isSelected && styles.selected,
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Thumbnail/Placeholder */}
      <View style={styles.thumbnailContainer}>
        {preview.thumbnailUrl ? (
          <Text style={styles.placeholder}>📹</Text>
        ) : (
          <View style={styles.placeholder}>
            <ActivityIndicator size="large" color="#FFF" />
          </View>
        )}

        {/* Live Badge */}
        {preview.isLive && (
          <View style={styles.liveBadge}>
            <Text style={styles.liveText}>● LIVE</Text>
          </View>
        )}

        {/* Quality Badge */}
        <View style={[styles.qualityBadge, { backgroundColor: qualityColor }]}>
          <Text style={styles.qualityText}>{preview.quality.toUpperCase()}</Text>
        </View>

        {/* Close Button */}
        {onClose && (
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeIcon}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Info */}
      <View style={styles.infoContainer}>
        <Text style={styles.deviceName}>{preview.deviceName}</Text>
        
        <View style={styles.statsRow}>
          <Text style={styles.stat}>
            ⏱️ {formatDuration(preview.duration || duration)}
          </Text>
          
          {preview.viewers !== undefined && (
            <Text style={styles.stat}>
              👁️ {preview.viewers} viewers
            </Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    marginVertical: 8,
    marginHorizontal: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  selected: {
    borderWidth: 2,
    borderColor: '#2196F3',
  },
  thumbnailContainer: {
    width: '100%',
    height: 200,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  placeholder: {
    fontSize: 40,
    textAlign: 'center',
  },
  liveBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#F44336',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  liveText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  qualityBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  qualityText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '600',
  },
  closeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeIcon: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  infoContainer: {
    padding: 12,
  },
  deviceName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 8,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  stat: {
    fontSize: 12,
    color: '#666',
  },
});
