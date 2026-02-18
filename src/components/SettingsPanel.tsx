import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Picker,
} from 'react-native';
import { ControllerSettings } from '../types/controller';

interface SettingsPanelProps {
  settings: ControllerSettings;
  onSettingsChange?: (settings: Partial<ControllerSettings>) => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  settings,
  onSettingsChange,
}) => {
  const [localSettings, setLocalSettings] = useState(settings);

  const handleSettingChange = (key: string, value: any) => {
    const updated = { ...localSettings };
    
    if (key.includes('.')) {
      const [section, subKey] = key.split('.');
      updated[section as keyof ControllerSettings] = {
        ...updated[section as keyof ControllerSettings],
        [subKey]: value,
      };
    } else {
      updated[key as keyof ControllerSettings] = value;
    }
    
    setLocalSettings(updated);
    onSettingsChange?.(updated);
  };

  const SettingRow: React.FC<{
    label: string;
    value?: string | number;
    children?: React.ReactNode;
  }> = ({ label, value, children }) => (
    <View style={styles.settingRow}>
      <View style={styles.settingLabel}>
        <Text style={styles.label}>{label}</Text>
        {value !== undefined && <Text style={styles.value}>{value}</Text>}
      </View>
      {children}
    </View>
  );

  const ToggleSetting: React.FC<{
    label: string;
    value: boolean;
    onToggle: (value: boolean) => void;
  }> = ({ label, value, onToggle }) => (
    <SettingRow label={label}>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: '#CCCCCC', true: '#81C784' }}
        thumbColor={value ? '#4CAF50' : '#F5F5F5'}
      />
    </SettingRow>
  );

  return (
    <ScrollView style={styles.container}>
      {/* Streaming Settings Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🎬 Streaming Settings</Text>

        <SettingRow label="Default Quality">
          <Picker
            selectedValue={localSettings.streaming.defaultQuality}
            onValueChange={(value) =>
              handleSettingChange('streaming.defaultQuality', value)
            }
            style={styles.picker}
          >
            <Picker.Item label="Low (1 Mbps)" value="low" />
            <Picker.Item label="Medium (5 Mbps)" value="medium" />
            <Picker.Item label="High (10 Mbps)" value="high" />
          </Picker>
        </SettingRow>

        <SettingRow label="Max Bitrate (kbps)" value={localSettings.streaming.maxBitrate}>
          <Text style={styles.settingValue}>{localSettings.streaming.maxBitrate}</Text>
        </SettingRow>

        <ToggleSetting
          label="Auto-adapt Quality"
          value={localSettings.streaming.autoAdaptQuality}
          onToggle={(value) =>
            handleSettingChange('streaming.autoAdaptQuality', value)
          }
        />

        <ToggleSetting
          label="Enable Preview"
          value={localSettings.streaming.enablePreview}
          onToggle={(value) =>
            handleSettingChange('streaming.enablePreview', value)
          }
        />

        <SettingRow label="Preview Quality">
          <Picker
            selectedValue={localSettings.streaming.previewQuality}
            onValueChange={(value) =>
              handleSettingChange('streaming.previewQuality', value)
            }
            style={styles.picker}
          >
            <Picker.Item label="Low" value="low" />
            <Picker.Item label="Medium" value="medium" />
            <Picker.Item label="High" value="high" />
          </Picker>
        </SettingRow>

        <SettingRow label="Reconnect Attempts" value={localSettings.streaming.reconnectAttempts}>
          <Text style={styles.settingValue}>{localSettings.streaming.reconnectAttempts}</Text>
        </SettingRow>

        <SettingRow label="Command Timeout (ms)" value={localSettings.streaming.commandTimeout}>
          <Text style={styles.settingValue}>{localSettings.streaming.commandTimeout}</Text>
        </SettingRow>
      </View>

      {/* Notification Settings Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🔔 Notifications</Text>

        <ToggleSetting
          label="Device Connected"
          value={localSettings.notifications.deviceConnected}
          onToggle={(value) =>
            handleSettingChange('notifications.deviceConnected', value)
          }
        />

        <ToggleSetting
          label="Device Disconnected"
          value={localSettings.notifications.deviceDisconnected}
          onToggle={(value) =>
            handleSettingChange('notifications.deviceDisconnected', value)
          }
        />

        <ToggleSetting
          label="Stream Started"
          value={localSettings.notifications.streamStarted}
          onToggle={(value) =>
            handleSettingChange('notifications.streamStarted', value)
          }
        />

        <ToggleSetting
          label="Stream Stopped"
          value={localSettings.notifications.streamStopped}
          onToggle={(value) =>
            handleSettingChange('notifications.streamStopped', value)
          }
        />

        <ToggleSetting
          label="Command Completed"
          value={localSettings.notifications.commandCompleted}
          onToggle={(value) =>
            handleSettingChange('notifications.commandCompleted', value)
          }
        />

        <ToggleSetting
          label="Command Failed"
          value={localSettings.notifications.commandFailed}
          onToggle={(value) =>
            handleSettingChange('notifications.commandFailed', value)
          }
        />

        <ToggleSetting
          label="Battery Low"
          value={localSettings.notifications.batteryLow}
          onToggle={(value) =>
            handleSettingChange('notifications.batteryLow', value)
          }
        />

        <ToggleSetting
          label="Storage Warning"
          value={localSettings.notifications.storageWarning}
          onToggle={(value) =>
            handleSettingChange('notifications.storageWarning', value)
          }
        />
      </View>

      {/* General Settings Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>⚙️ General</Text>

        <ToggleSetting
          label="Auto-group Devices"
          value={localSettings.autoGroupDevices}
          onToggle={(value) =>
            handleSettingChange('autoGroupDevices', value)
          }
        />

        <SettingRow label="Refresh Interval (ms)" value={localSettings.refreshInterval}>
          <Text style={styles.settingValue}>{localSettings.refreshInterval}</Text>
        </SettingRow>

        <SettingRow label="Theme Mode">
          <Picker
            selectedValue={localSettings.themeMode}
            onValueChange={(value) =>
              handleSettingChange('themeMode', value)
            }
            style={styles.picker}
          >
            <Picker.Item label="Light" value="light" />
            <Picker.Item label="Dark" value="dark" />
            <Picker.Item label="Auto" value="auto" />
          </Picker>
        </SettingRow>

        <SettingRow label="Language">
          <Picker
            selectedValue={localSettings.language}
            onValueChange={(value) =>
              handleSettingChange('language', value)
            }
            style={styles.picker}
          >
            <Picker.Item label="Spanish (ES)" value="es" />
            <Picker.Item label="English (EN)" value="en" />
            <Picker.Item label="Português (PT)" value="pt" />
          </Picker>
        </SettingRow>
      </View>

      {/* About Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>ℹ️ About</Text>
        
        <SettingRow label="Version" value="1.0.0" />
        <SettingRow label="Build" value="2024.02.17" />
        
        <View style={styles.aboutBox}>
          <Text style={styles.aboutTitle}>MultiCamPro Controller</Text>
          <Text style={styles.aboutText}>
            Professional multi-device remote control and streaming management system.
          </Text>
        </View>
      </View>

      <View style={styles.spacer} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  section: {
    marginVertical: 12,
    backgroundColor: '#FFF',
    paddingVertical: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2196F3',
    paddingHorizontal: 16,
    paddingVertical: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#FAFAFA',
  },
  settingLabel: {
    flex: 1,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    color: '#212121',
  },
  value: {
    fontSize: 11,
    color: '#999',
    marginTop: 4,
  },
  settingValue: {
    fontSize: 13,
    color: '#666',
    fontFamily: 'monospace',
  },
  picker: {
    width: 150,
    height: 40,
  },
  aboutBox: {
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 12,
    paddingVertical: 16,
    backgroundColor: '#F0F7FF',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  aboutTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2196F3',
    marginBottom: 8,
  },
  aboutText: {
    fontSize: 12,
    color: '#666',
    lineHeight: 18,
  },
  spacer: {
    height: 20,
  },
});
