# ⚡ Fase 8: Controller UI - Quick Start (5 minutos)

Guía rápida para usar los componentes y hooks de Phase 8 en tu aplicación.

---

## 1️⃣ Configuración Base

### Importar tipos

```typescript
// src/screens/ControllerScreen.tsx
import {
  DeviceInfo,
  StreamSession,
  StreamingQuality,
  DeviceStatus,
  CommandType,
} from '@/types/controller';
```

### Usar el hook principal

```typescript
import { useDeviceController } from '@/hooks/useDeviceController';

export function MyControllerScreen() {
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

  return (
    <View>
      {/* Tu UI aquí */}
    </View>
  );
}
```

---

## 2️⃣ Mostrar Lista de Dispositivos

```typescript
import { DeviceCard } from '@/components/DeviceCard';
import { FlatList } from 'react-native';

<FlatList
  data={devices}
  renderItem={({ item }) => (
    <DeviceCard
      device={item}
      isSelected={selectedDevice?.deviceId === item.deviceId}
      onPress={() => selectDevice(item.deviceId)}
      showBattery={true}
      showStorage={true}
    />
  )}
  keyExtractor={(item) => item.deviceId}
/>
```

---

## 3️⃣ Iniciar Stream

```typescript
const handleStartStream = async () => {
  try {
    const result = await startStream(
      selectedDevice!.deviceId,
      'rtmp://live.example.com/app/stream',
      'medium' // 'low' | 'medium' | 'high'
    );

    if (result.ok) {
      // Stream iniciado exitosamente
      console.log('Stream started:', result.value);
    } else {
      // Hubo error
      console.error('Error:', result.error);
    }
  } catch (err) {
    console.error('Failed:', err);
  }
};
```

---

## 4️⃣ Mostrar Streams Activos

```typescript
import { StreamPreviewCard } from '@/components/StreamPreviewCard';

<FlatList
  data={activeStreams}
  renderItem={({ item }) => (
    <StreamPreviewCard
      preview={item}
      onClose={() => stopStream(item.streamId)}
      showMetrics={true}
    />
  )}
  keyExtractor={(item) => item.streamId}
  scrollEnabled={false}
/>
```

---

## 5️⃣ Controles de Grabación

```typescript
import { RecordingControls } from '@/components/RecordingControls';

<RecordingControls
  isEnabled={!!selectedDevice}
  onStart={async () => {
    // Iniciar grabación en dispositivo seleccionado
    await sendCommand(selectedDevice!.deviceId, {
      commandId: `rec-${Date.now()}`,
      type: 'START_RECORDING',
      params: { quality: 'high' },
    });
  }}
  onStop={async () => {
    await sendCommand(selectedDevice!.deviceId, {
      commandId: `stop-rec-${Date.now()}`,
      type: 'STOP_RECORDING',
      params: {},
    });
  }}
/>
```

---

## 6️⃣ Navegación de Archivos

```typescript
import { FileManager } from '@/components/FileManager';
import { useFileBrowser } from '@/hooks/useFileBrowser';

const {
  currentPath,
  files,
  isLoading,
  navigateTo,
  goBack,
  deleteFile,
  downloadFile,
} = useFileBrowser(selectedDevice?.deviceId);

<FileManager
  files={files}
  currentPath={currentPath}
  isLoading={isLoading}
  onNavigate={navigateTo}
  onGoBack={goBack}
  onDelete={deleteFile}
  onDownload={downloadFile}
/>
```

---

## 7️⃣ Panel de Configuración

```typescript
import { SettingsPanel } from '@/components/SettingsPanel';
import { ControllerSettings } from '@/types/controller';

const [settings, setSettings] = useState<ControllerSettings>({
  streaming: {
    defaultQuality: 'medium',
    maxBitrate: 5000,
    autoAdaptQuality: true,
    enablePreview: true,
    previewQuality: 'low',
    reconnectAttempts: 3,
    commandTimeout: 30000,
  },
  notifications: {
    deviceConnected: true,
    deviceDisconnected: true,
    streamStarted: true,
    streamStopped: true,
    commandCompleted: false,
    commandFailed: true,
    batteryLow: true,
    storageWarning: true,
  },
});

<SettingsPanel
  settings={settings}
  onUpdateSettings={setSettings}
/>
```

---

## 8️⃣ Cambiar Calidad de Stream

```typescript
const handleQualityChange = async (quality: StreamingQuality) => {
  if (!selectedDevice || !activeStreams[0]) return;

  const result = await changeStreamQuality(
    activeStreams[0].streamId,
    quality
  );

  if (result.ok) {
    console.log('Quality changed to:', quality);
  }
};

<View style={styles.qualityButtons}>
  <Button
    title="Low"
    onPress={() => handleQualityChange('low')}
  />
  <Button
    title="Medium"
    onPress={() => handleQualityChange('medium')}
  />
  <Button
    title="High"
    onPress={() => handleQualityChange('high')}
  />
</View>
```

---

## 9️⃣ Manejo de Errores

```typescript
if (error) {
  return (
    <View style={styles.errorBanner}>
      <Text style={styles.errorText}>{error.message}</Text>
      <Button title="Reintentar" onPress={refreshDevices} />
    </View>
  );
}
```

---

## 🔟 Ejemplo Completo: Controller Screen

```typescript
import React from 'react';
import {
  View,
  FlatList,
  Text,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useDeviceController } from '@/hooks/useDeviceController';
import { DeviceCard } from '@/components/DeviceCard';
import { StreamPreviewCard } from '@/components/StreamPreviewCard';
import { RecordingControls } from '@/components/RecordingControls';
import { SettingsPanel } from '@/components/SettingsPanel';

export function ControllerScreen() {
  const [refreshing, setRefreshing] = React.useState(false);
  const [showSettings, setShowSettings] = React.useState(false);

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
  } = useDeviceController();

  const handleRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await refreshDevices();
    setRefreshing(false);
  }, [refreshDevices]);

  if (error) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Error: {error.message}</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      {/* Error Banner */}
      {error && (
        <View style={{ padding: 10, backgroundColor: '#ffebee' }}>
          <Text style={{ color: '#c62828' }}>{error.message}</Text>
        </View>
      )}

      {/* Device List */}
      <View style={{ flex: 1 }}>
        {isLoading && !devices.length ? (
          <ActivityIndicator size="large" />
        ) : (
          <FlatList
            data={devices}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
            }
            renderItem={({ item }) => (
              <DeviceCard
                device={item}
                isSelected={selectedDevice?.deviceId === item.deviceId}
                onPress={() => selectDevice(item.deviceId)}
                showBattery={true}
                showStorage={true}
              />
            )}
            keyExtractor={(item) => item.deviceId}
          />
        )}
      </View>

      {/* Active Streams */}
      {activeStreams.length > 0 && (
        <View style={{ padding: 10, backgroundColor: '#f5f5f5' }}>
          <Text style={{ fontWeight: 'bold', marginBottom: 10 }}>
            Streams Activos ({activeStreams.length})
          </Text>
          <FlatList
            data={activeStreams}
            renderItem={({ item }) => (
              <StreamPreviewCard
                preview={item}
                onClose={() => stopStream(item.streamId)}
              />
            )}
            keyExtractor={(item) => item.streamId}
            scrollEnabled={false}
          />
        </View>
      )}

      {/* Recording Controls */}
      {selectedDevice && (
        <RecordingControls isEnabled={true} onStart={() => {}} onStop={() => {}} />
      )}

      {/* Settings Button */}
      <Button
        title={showSettings ? 'Cerrar' : 'Configuración'}
        onPress={() => setShowSettings(!showSettings)}
      />

      {showSettings && <SettingsPanel settings={defaultSettings} onUpdateSettings={() => {}} />}
    </View>
  );
}
```

---

## 📚 Para Más Información

- [**PHASE8_CONTROLLER_UI_GUIDE.md**](./PHASE8_CONTROLLER_UI_GUIDE.md) - Documentación completa
- [**PHASE8_VALIDATION_CHECKLIST.md**](./PHASE8_VALIDATION_CHECKLIST.md) - Lista de validación
- [**src/types/controller.ts**](./src/types/controller.ts) - Definiciones de tipos
- [**src/hooks/useDeviceController.ts**](./src/hooks/useDeviceController.ts) - Hook principal

---

## 💡 Tips

1. **Auto-refresh**: El hook `useDeviceController` auto-refresca dispositivos cada 5 segundos
2. **Error Handling**: Usa Result<T> pattern para manejo de errores seguro
3. **Memory Leaks**: Los hooks limpian listeners automáticamente en cleanup
4. **Performance**: Usa FlatList para listas grandes, `scrollEnabled={false}` para FlatList anidadas
5. **Offline Support**: Los comandos se encolan en el servidor si el dispositivo está offline

---

**¡Listo para usar Phase 8! 🚀**
