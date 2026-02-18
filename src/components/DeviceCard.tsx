import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { DeviceInfo, DeviceStatus } from '../types/controller';

interface DeviceCardProps {
  device: DeviceInfo;
  isSelected?: boolean;
  onPress?: () => void;
  onLongPress?: () => void;
  showBattery?: boolean;
  showStorage?: boolean;
}

export const DeviceCard: React.FC<DeviceCardProps> = ({
  device,
  isSelected = false,
  onPress,
  onLongPress,
  showBattery = true,
  showStorage = true,
}) => {
  const statusColor = {
    [DeviceStatus.ONLINE]: '#4CAF50',
    [DeviceStatus.OFFLINE]: '#9E9E9E',
    [DeviceStatus.CONNECTING]: '#FF9800',
    [DeviceStatus.ERROR]: '#F44336',
  }[device.status];

  const getNetworkIcon = (networkType: string) => {
    const icons: Record<string, string> = {
      WIFI: '📶',
      '4G': '4️⃣',
      '5G': '5️⃣',
      '3G': '3️⃣',
      OFFLINE: '❌',
    };
    return icons[networkType] || '?';
  };

  const storagePercent = Math.round((device.storageUsed / device.storageTotal) * 100);

  return (
    <TouchableOpacity
      style={[
        styles.container,
        isSelected && styles.selected,
        { borderLeftColor: statusColor },
      ]}
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.7}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.name}>{device.name}</Text>
          <Text style={styles.model}>{device.model}</Text>
        </View>
        <View style={styles.statusContainer}>
          <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
          <Text style={styles.status}>{device.status}</Text>
        </View>
      </View>

      {/* Info Row */}
      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>OS:</Text>
        <Text style={styles.infoValue}>{device.osVersion}</Text>
        
        <Text style={styles.infoSeparator}>•</Text>
        
        <Text style={styles.infoLabel}>Network:</Text>
        <Text style={styles.infoValue}>
          {getNetworkIcon(device.networkType)} {device.networkType}
        </Text>
      </View>

      {/* Battery & Storage */}
      <View style={styles.metricsRow}>
        {showBattery && (
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Battery</Text>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${device.batteryLevel}%`,
                    backgroundColor: device.batteryLevel > 30 ? '#4CAF50' : '#FF9800',
                  },
                ]}
              />
            </View>
            <Text style={styles.metricValue}>
              {device.batteryLevel}% {device.isCharging && '🔌'}
            </Text>
          </View>
        )}

        {showStorage && (
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Storage</Text>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${storagePercent}%`,
                    backgroundColor: storagePercent > 80 ? '#F44336' : '#2196F3',
                  },
                ]}
              />
            </View>
            <Text style={styles.metricValue}>{storagePercent}%</Text>
          </View>
        )}
      </View>

      {/* Last Seen */}
      {device.status === DeviceStatus.OFFLINE && (
        <Text style={styles.lastSeen}>
          Last seen: {new Date(device.lastSeen).toLocaleTimeString()}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    marginHorizontal: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  selected: {
    backgroundColor: '#E3F2FD',
    borderLeftColor: '#2196F3',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  titleContainer: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 4,
  },
  model: {
    fontSize: 13,
    color: '#757575',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  status: {
    fontSize: 12,
    color: '#666',
    textTransform: 'capitalize',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    flexWrap: 'wrap',
  },
  infoLabel: {
    fontSize: 12,
    color: '#999',
    marginRight: 4,
  },
  infoValue: {
    fontSize: 12,
    color: '#333',
    fontWeight: '500',
  },
  infoSeparator: {
    marginHorizontal: 8,
    color: '#DDD',
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 16,
    marginVertical: 10,
  },
  metricItem: {
    flex: 1,
  },
  metricLabel: {
    fontSize: 11,
    color: '#999',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  progressBar: {
    height: 6,
    backgroundColor: '#EEEEEE',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  metricValue: {
    fontSize: 11,
    color: '#212121',
    fontWeight: '500',
  },
  lastSeen: {
    fontSize: 11,
    color: '#FF9800',
    marginTop: 8,
    fontStyle: 'italic',
  },
});
