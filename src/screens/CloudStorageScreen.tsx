/**
 * Cloud Storage Screen
 * Pantalla principal para gestión de almacenamiento en la nube
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Modal,
  Switch,
} from 'react-native';
import { useCloudStorage } from '@/hooks/useCloudStorage';
import { CloudAlbums } from '@/components/CloudAlbums';
import { CloudUploadManager } from '@/components/CloudUploadManager';
import {
  CloudStorageStatus,
  SyncMode,
  UploadPriority,
} from '@/types/cloud';

type ViewMode = 'albums' | 'uploads' | 'settings' | 'storage';

export function CloudStorageScreen() {
  const [viewMode, setViewMode] = useState<ViewMode>('albums');
  const [refreshing, setRefreshing] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  const {
    albums,
    selectedAlbum,
    activeUploads,
    isLoading,
    isSyncing,
    error,
    quota,
    settings,
    autoUploadPolicy,
    sync,
    createNewAlbum,
    selectAlbum,
    loadAlbums,
    updateSettings,
    updateAutoUploadPolicy,
    formatFileSize,
  } = useCloudStorage();

  const handleRefresh = async () => {
    setRefreshing(true);
    await sync();
    setRefreshing(false);
  };

  const renderContent = () => {
    switch (viewMode) {
      case 'albums':
        return (
          <CloudAlbums
            albums={albums}
            selectedAlbum={selectedAlbum}
            onSelectAlbum={selectAlbum}
            onCreateAlbum={createNewAlbum}
            isLoading={isLoading}
          />
        );

      case 'uploads':
        return (
          <CloudUploadManager
            activeUploads={activeUploads}
          />
        );

      case 'storage':
        return renderStorageInfo();

      case 'settings':
        return renderSettings();

      default:
        return null;
    }
  };

  const renderStorageInfo = () => {
    if (!quota) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2196F3" />
        </View>
      );
    }

    const usagePercent = (quota.usedBytes / quota.totalBytes) * 100;
    const isWarning = usagePercent > 80;
    const isExceeded = usagePercent >= 100;

    return (
      <ScrollView style={styles.section}>
        {/* Storage Bar */}
        <View style={styles.storageCard}>
          <View style={styles.storageHeader}>
            <Text style={styles.storageTitle}>Storage Usage</Text>
            <Text style={[
              styles.storagePercent,
              isExceeded && { color: '#d32f2f' },
              isWarning && { color: '#ff9800' },
            ]}>
              {Math.round(usagePercent)}%
            </Text>
          </View>

          <View style={styles.storageBarContainer}>
            <View
              style={[
                styles.storageBarUsed,
                {
                  width: `${Math.min(usagePercent, 100)}%`,
                  backgroundColor: isExceeded ? '#d32f2f' : isWarning ? '#ff9800' : '#4CAF50',
                },
              ]}
            />
          </View>

          <View style={styles.storageStats}>
            <Text style={styles.statText}>
              💾 Used: {formatFileSize(quota.usedBytes)}
            </Text>
            <Text style={styles.statText}>
              ✅ Available: {formatFileSize(quota.availableBytes)}
            </Text>
          </View>

          <View style={styles.storageStats}>
            <Text style={styles.statText}>
              📦 Total: {formatFileSize(quota.totalBytes)}
            </Text>
            <Text style={styles.statText}>
              📁 Files: {quota.fileCount}
            </Text>
          </View>

          {isWarning && (
            <View style={styles.warningBanner}>
              <Text style={styles.warningText}>
                ⚠️ Storage quota is {Math.round(usagePercent)}% full
              </Text>
            </View>
          )}
        </View>

        {/* Plan Info */}
        <View style={styles.planCard}>
          <Text style={styles.planTitle}>Plan: {quota.plan.toUpperCase()}</Text>
          <Text style={styles.planText}>
            You're currently on the {quota.plan} plan. Upgrade for more storage!
          </Text>
        </View>
      </ScrollView>
    );
  };

  const renderSettings = () => {
    return (
      <ScrollView style={styles.section}>
        {/* Auto Upload Settings */}
        <View style={styles.settingsCard}>
          <Text style={styles.settingsTitle}>Auto Upload</Text>

          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Enable Auto Upload</Text>
            <Switch
              value={autoUploadPolicy.enabled}
              onValueChange={(val) =>
                updateAutoUploadPolicy({ enabled: val })
              }
              trackColor={{ false: '#ccc', true: '#81c784' }}
              thumbColor={autoUploadPolicy.enabled ? '#2196F3' : '#f0f0f0'}
            />
          </View>

          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Upload on WiFi Only</Text>
            <Switch
              value={autoUploadPolicy.uploadOnlyWifi}
              onValueChange={(val) =>
                updateAutoUploadPolicy({ uploadOnlyWifi: val })
              }
              trackColor={{ false: '#ccc', true: '#81c784' }}
              thumbColor={autoUploadPolicy.uploadOnlyWifi ? '#2196F3' : '#f0f0f0'}
              disabled={!autoUploadPolicy.enabled}
            />
          </View>

          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Require Charging</Text>
            <Switch
              value={autoUploadPolicy.chargeRequired}
              onValueChange={(val) =>
                updateAutoUploadPolicy({ chargeRequired: val })
              }
              trackColor={{ false: '#ccc', true: '#81c784' }}
              thumbColor={autoUploadPolicy.chargeRequired ? '#2196F3' : '#f0f0f0'}
              disabled={!autoUploadPolicy.enabled}
            />
          </View>
        </View>

        {/* Sync Settings */}
        <View style={styles.settingsCard}>
          <Text style={styles.settingsTitle}>Sync Mode</Text>

          <View style={styles.modeOptions}>
            {[SyncMode.MANUAL, SyncMode.AUTO, SyncMode.SCHEDULED].map((mode) => (
              <TouchableOpacity
                key={mode}
                style={[
                  styles.modeOption,
                  settings.syncMode === mode && styles.modeOptionSelected,
                ]}
                onPress={() => updateSettings({ syncMode: mode })}
              >
                <Text
                  style={[
                    styles.modeOptionText,
                    settings.syncMode === mode && styles.modeOptionTextSelected,
                  ]}
                >
                  {mode.charAt(0).toUpperCase() + mode.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Compression Settings */}
        <View style={styles.settingsCard}>
          <Text style={styles.settingsTitle}>Compression</Text>

          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Enable Compression</Text>
            <Switch
              value={settings.compressionEnabled}
              onValueChange={(val) =>
                updateSettings({ compressionEnabled: val })
              }
              trackColor={{ false: '#ccc', true: '#81c784' }}
              thumbColor={settings.compressionEnabled ? '#2196F3' : '#f0f0f0'}
            />
          </View>

          {settings.compressionEnabled && (
            <View>
              <Text style={styles.qualityLabel}>
                Quality: {settings.compressionQuality}%
              </Text>
              <View style={styles.qualitySlider}>
                {/* Placeholder for slider */}
                <View
                  style={{
                    width: `${settings.compressionQuality}%`,
                    height: 4,
                    backgroundColor: '#2196F3',
                    borderRadius: 2,
                  }}
                />
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Cloud Storage</Text>
        <TouchableOpacity
          style={styles.syncButton}
          onPress={sync}
          disabled={isSyncing}
        >
          {isSyncing ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.syncButtonText}>⟲ Sync</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Error Banner */}
      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error.message}</Text>
        </View>
      )}

      {/* Sync Status */}
      {isSyncing && (
        <View style={styles.syncingBanner}>
          <ActivityIndicator color="#2196F3" size="small" />
          <Text style={styles.syncingText}>Syncing...</Text>
        </View>
      )}

      {/* Navigation Tabs */}
      <View style={styles.tabs}>
        {(['albums', 'uploads', 'storage', 'settings'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[
              styles.tab,
              viewMode === tab && styles.tabActive,
            ]}
            onPress={() => setViewMode(tab)}
          >
            <Text
              style={[
                styles.tabText,
                viewMode === tab && styles.tabTextActive,
              ]}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {renderContent()}
      </ScrollView>
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
  syncButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#2196F3',
    borderRadius: 6,
  },
  syncButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  errorBanner: {
    backgroundColor: '#ffebee',
    padding: 12,
    marginHorizontal: 8,
    marginVertical: 8,
    borderRadius: 6,
  },
  errorText: {
    color: '#d32f2f',
    fontSize: 14,
  },
  syncingBanner: {
    backgroundColor: '#e3f2fd',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginHorizontal: 8,
    gap: 12,
    borderRadius: 6,
  },
  syncingText: {
    color: '#1976d2',
    fontWeight: '500',
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  tabActive: {
    borderBottomWidth: 3,
    borderBottomColor: '#2196F3',
  },
  tabText: {
    fontSize: 14,
    color: '#999',
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#2196F3',
  },
  content: {
    flex: 1,
    padding: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    flex: 1,
  },
  storageCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
  },
  storageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  storageTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  storagePercent: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  storageBarContainer: {
    height: 12,
    backgroundColor: '#e0e0e0',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 12,
  },
  storageBarUsed: {
    height: '100%',
  },
  storageStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 8,
  },
  statText: {
    fontSize: 13,
    color: '#666',
  },
  warningBanner: {
    backgroundColor: '#fff3e0',
    borderLeftWidth: 4,
    borderLeftColor: '#ff9800',
    padding: 12,
    marginTop: 12,
    borderRadius: 6,
  },
  warningText: {
    color: '#f57c00',
    fontWeight: '500',
  },
  planCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
  },
  planTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  planText: {
    fontSize: 14,
    color: '#666',
  },
  settingsCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
  },
  settingsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingLabel: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  modeOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  modeOption: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    alignItems: 'center',
  },
  modeOptionSelected: {
    borderColor: '#2196F3',
    backgroundColor: '#e3f2fd',
  },
  modeOptionText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  modeOptionTextSelected: {
    color: '#2196F3',
  },
  qualityLabel: {
    fontSize: 13,
    color: '#666',
    marginVertical: 8,
  },
  qualitySlider: {
    height: 4,
    backgroundColor: '#e0e0e0',
    borderRadius: 2,
    overflow: 'hidden',
  },
});
