import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useDeviceController } from '../hooks/useDeviceController';
import { useStreamPreview } from '../hooks/useStreamPreview';
import { DeviceCard } from '../components/DeviceCard';
import { StreamPreviewCard } from '../components/StreamPreviewCard';
import { StreamingQuality } from '../types/controller';

export const ControllerScreen: React.FC = () => {
  const {
    devices,
    selectedDevice,
    activeStreams,
    isLoading,
    error,
    selectDevice,
    refreshDevices,
    startStream,
    stopStream,
    changeStreamQuality,
  } = useDeviceController();

  const {
    previews,
    selectedStream,
    selectStream,
    addPreview,
    removePreview,
  } = useStreamPreview();

  const [showStreamModal, setShowStreamModal] = useState(false);
  const [rtmpUrl, setRtmpUrl] = useState('');
  const [selectedQuality, setSelectedQuality] = useState<StreamingQuality>('medium');
  const [isStartingStream, setIsStartingStream] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  // Add previews when streams start
  useEffect(() => {
    activeStreams.forEach(stream => {
      const existing = previews.find(p => p.streamId === stream.sessionId);
      if (!existing) {
        addPreview(stream);
      }
    });
  }, [activeStreams]);

  const handleRefresh = useCallback(async () => {
    await refreshDevices();
  }, [refreshDevices]);

  const handleStartStream = useCallback(async () => {
    if (!selectedDevice || !rtmpUrl.trim()) {
      Alert.alert('Error', 'Please select a device and enter RTMP URL');
      return;
    }

    setIsStartingStream(true);
    try {
      const sessionId = await startStream(
        selectedDevice.deviceId,
        rtmpUrl,
        selectedQuality
      );
      
      Alert.alert('Success', `Stream started with ID: ${sessionId}`);
      setShowStreamModal(false);
      setRtmpUrl('');
      setSelectedQuality('medium');
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to start stream';
      Alert.alert('Error', errorMsg);
    } finally {
      setIsStartingStream(false);
    }
  }, [selectedDevice, rtmpUrl, selectedQuality, startStream]);

  const handleStopStream = useCallback(
    async (deviceId: string) => {
      Alert.alert(
        'Stop Stream',
        'Are you sure you want to stop this stream?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Stop',
            style: 'destructive',
            onPress: async () => {
              try {
                await stopStream(deviceId);
                removePreview(selectedStream?.streamId || '');
                Alert.alert('Success', 'Stream stopped');
              } catch (err) {
                const errorMsg = err instanceof Error ? err.message : 'Failed to stop stream';
                Alert.alert('Error', errorMsg);
              }
            },
          },
        ]
      );
    },
    [stopStream, selectedStream, removePreview]
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>MultiCamPro Controller</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.viewModeButton}
            onPress={() => setViewMode(viewMode === 'list' ? 'grid' : 'list')}
          >
            <Text style={styles.viewModeIcon}>{viewMode === 'list' ? '▦' : '▣'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Error Message */}
      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>⚠️ {error}</Text>
        </View>
      )}

      {/* Main Content */}
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={handleRefresh}
            tintColor="#2196F3"
          />
        }
      >
        {/* Devices Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              📱 Devices ({devices.length})
            </Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => {
                if (selectedDevice) {
                  setShowStreamModal(true);
                } else {
                  Alert.alert('Info', 'Please select a device first');
                }
              }}
            >
              <Text style={styles.addButtonText}>+ Stream</Text>
            </TouchableOpacity>
          </View>

          {isLoading && devices.length === 0 ? (
            <View style={styles.centerContent}>
              <ActivityIndicator size="large" color="#2196F3" />
              <Text style={styles.loadingText}>Loading devices...</Text>
            </View>
          ) : devices.length === 0 ? (
            <View style={styles.centerContent}>
              <Text style={styles.emptyText}>No devices connected</Text>
            </View>
          ) : (
            <FlatList
              scrollEnabled={false}
              data={devices}
              keyExtractor={device => device.deviceId}
              renderItem={({ item }) => (
                <DeviceCard
                  device={item}
                  isSelected={selectedDevice?.deviceId === item.deviceId}
                  onPress={() => selectDevice(item.deviceId)}
                  showBattery
                  showStorage
                />
              )}
            />
          )}
        </View>

        {/* Active Streams Section */}
        {previews.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                🎬 Active Streams ({previews.length})
              </Text>
            </View>

            <FlatList
              scrollEnabled={false}
              data={previews}
              keyExtractor={preview => preview.streamId}
              renderItem={({ item }) => (
                <StreamPreviewCard
                  preview={item}
                  isSelected={selectedStream?.streamId === item.streamId}
                  onPress={() => selectStream(item.streamId)}
                  onClose={() => handleStopStream(item.deviceId)}
                  showMetrics
                />
              )}
            />
          </View>
        )}

        {/* Quality Quick Actions */}
        {selectedStream && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>⚙️ Quality Adjustment</Text>
            <View style={styles.qualityGrid}>
              {(['low', 'medium', 'high'] as const).map(quality => (
                <TouchableOpacity
                  key={quality}
                  style={[
                    styles.qualityButton,
                    selectedStream.quality === quality && styles.qualityButtonActive,
                  ]}
                  onPress={() => changeStreamQuality(selectedStream.deviceId, quality)}
                >
                  <Text style={styles.qualityButtonText}>{quality.toUpperCase()}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Info Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ℹ️ Device Stats</Text>
          {selectedDevice ? (
            <View style={styles.statsBox}>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Battery:</Text>
                <Text style={styles.statValue}>{selectedDevice.batteryLevel}%</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Network:</Text>
                <Text style={styles.statValue}>{selectedDevice.networkType}</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Status:</Text>
                <Text style={styles.statValue}>{selectedDevice.status}</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Model:</Text>
                <Text style={styles.statValue}>{selectedDevice.model}</Text>
              </View>
            </View>
          ) : (
            <Text style={styles.emptyText}>Select a device to view stats</Text>
          )}
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Stream Modal */}
      <Modal
        visible={showStreamModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowStreamModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Start Stream</Text>

            <Text style={styles.inputLabel}>Device</Text>
            <View style={styles.deviceSelectBox}>
              <Text style={styles.deviceSelectText}>
                {selectedDevice?.name || 'No device selected'}
              </Text>
            </View>

            <Text style={styles.inputLabel}>RTMP URL</Text>
            <TextInput
              style={styles.textInput}
              placeholder="rtmp://server.com/live/stream"
              placeholderTextColor="#999"
              value={rtmpUrl}
              onChangeText={setRtmpUrl}
              editable={!isStartingStream}
            />

            <Text style={styles.inputLabel}>Quality</Text>
            <View style={styles.qualityOptions}>
              {(['low', 'medium', 'high'] as const).map(quality => (
                <TouchableOpacity
                  key={quality}
                  style={[
                    styles.qualityOption,
                    selectedQuality === quality && styles.qualityOptionActive,
                  ]}
                  onPress={() => setSelectedQuality(quality)}
                  disabled={isStartingStream}
                >
                  <Text
                    style={[
                      styles.qualityOptionText,
                      selectedQuality === quality && styles.qualityOptionTextActive,
                    ]}
                  >
                    {quality.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.button, styles.buttonSecondary]}
                onPress={() => setShowStreamModal(false)}
                disabled={isStartingStream}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.buttonPrimary]}
                onPress={handleStartStream}
                disabled={isStartingStream || !selectedDevice || !rtmpUrl.trim()}
              >
                {isStartingStream ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Text style={styles.buttonText}>Start Stream</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    backgroundColor: '#2196F3',
    paddingTop: 12,
    paddingHorizontal: 16,
    paddingBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  viewModeButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewModeIcon: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  errorBanner: {
    backgroundColor: '#FFEBEE',
    padding: 12,
    marginHorizontal: 12,
    marginTop: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#F44336',
  },
  errorText: {
    color: '#C62828',
    fontSize: 13,
  },
  section: {
    marginTop: 16,
    marginBottom: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
  },
  addButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  addButtonText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  centerContent: {
    padding: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#666',
    fontSize: 14,
  },
  emptyText: {
    color: '#999',
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 20,
  },
  qualityGrid: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
  },
  qualityButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: '#EEE',
    alignItems: 'center',
  },
  qualityButtonActive: {
    backgroundColor: '#2196F3',
  },
  qualityButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  statsBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 12,
  },
  statItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  statLabel: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  statValue: {
    fontSize: 13,
    color: '#212121',
    fontWeight: '600',
  },
  bottomSpacer: {
    height: 20,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    width: '85%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212121',
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
    marginTop: 12,
    marginBottom: 8,
  },
  deviceSelectBox: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#DDD',
  },
  deviceSelectText: {
    fontSize: 13,
    color: '#212121',
  },
  textInput: {
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: '#212121',
  },
  qualityOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  qualityOption: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#DDD',
    alignItems: 'center',
  },
  qualityOptionActive: {
    backgroundColor: '#2196F3',
    borderColor: '#2196F3',
  },
  qualityOptionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  qualityOptionTextActive: {
    color: '#FFF',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonPrimary: {
    backgroundColor: '#2196F3',
  },
  buttonSecondary: {
    backgroundColor: '#EEE',
  },
  buttonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFF',
  },
});
