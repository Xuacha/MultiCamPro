# Phase 8: Controller UI Implementation Guide

## Overview

Phase 8 introduces the complete **Controller User Interface** for managing multiple remote devices and live streams. This includes device dashboards, real-time stream previews, command panels, file management, and comprehensive settings.

**Key Deliverables:**
- ✅ Controller TypeScript types system (100+ types)
- ✅ Device management hooks and components
- ✅ Stream preview system with monitoring
- ✅ File browser with navigation
- ✅ Recording controls interface
- ✅ Settings management panel
- ✅ Integrated Controller Screen with all features

---

## Architecture

### Component Hierarchy

```
ControllerScreen
├── Header (Title, View Mode Toggle)
├── ScrollView (Main Content)
│   ├── Device Section
│   │   └── FlatList of DeviceCard
│   │       ├── Device Info
│   │       ├── Battery/Storage Bars
│   │       └── Status Indicator
│   │
│   ├── Active Streams Section
│   │   └── FlatList of StreamPreviewCard
│   │       ├── Thumbnail
│   │       ├── Live Badge
│   │       ├── Duration Timer
│   │       └── Quality Badge
│   │
│   ├── Quality Controls
│   │   └── Quality Buttons (Low/Medium/High)
│   │
│   ├── Device Stats Section
│   │   └── Stats Box
│   │       ├── Battery
│   │       ├── Network
│   │       ├── Status
│   │       └── Model
│   │
│   └── File Manager
│       ├── Breadcrumb Navigation
│       ├── File List
│       └── File Actions
│
├── Stream Modal
│   ├── Device Selector
│   ├── RTMP URL Input
│   ├── Quality Options
│   └── Start/Cancel Buttons
│
└── Recording Controls
    ├── Status Bar (REC Timer)
    ├── Control Buttons (Start/Pause/Stop)
    └── Info Box
```

---

## Types System

### Device Management

```typescript
enum DeviceStatus {
  ONLINE = 'online',
  OFFLINE = 'offline',
  CONNECTING = 'connecting',
  ERROR = 'error',
}

interface DeviceInfo {
  deviceId: string;
  name: string;
  model: string;
  osVersion: string;
  status: DeviceStatus;
  lastSeen: number;
  ownerUid: string;
  batteryLevel: number;
  isCharging: boolean;
  networkType: 'WIFI' | '4G' | '5G' | '3G' | 'OFFLINE';
  storageUsed: number;
  storageTotal: number;
}
```

### Streaming Management

```typescript
enum StreamingQuality {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
}

interface StreamSession {
  sessionId: string;
  deviceId: string;
  rtmpUrl: string;
  quality: StreamingQuality;
  status: StreamingStatus;
  startedAt: number;
  duration: number;
  bitrate: number;
  frameRate: number;
  resolution: string;
  viewers?: number;
}

interface StreamPreview {
  streamId: string;
  deviceId: string;
  deviceName: string;
  thumbnailUrl?: string;
  isLive: boolean;
  quality: StreamingQuality;
  viewers?: number;
}
```

### Recording Management

```typescript
interface RecordingSession {
  recordingId: string;
  deviceId: string;
  startedAt: number;
  duration: number;
  status: RecordingStatus;
  size: number;
  quality: StreamingQuality;
  format: 'MP4' | 'MOV' | 'WebM';
  path: string;
}
```

### File Management

```typescript
interface FileInfo {
  fileId: string;
  name: string;
  type: FileType;
  size: number;
  createdAt: number;
  modifiedAt: number;
  path: string;
  deviceId: string;
  isFolder: boolean;
}

interface DirectoryListing {
  currentPath: string;
  files: FileInfo[];
  totalSize: number;
  fileCount: number;
}
```

---

## Hooks

### useDeviceController

Main hook for device and streaming management:

```typescript
const {
  devices,                    // Array of connected devices
  selectedDevice,             // Currently selected device
  activeStreams,              // Array of active stream sessions
  isLoading,                  // Loading state
  error,                      // Error message if any
  selectDevice,               // Select device by ID
  refreshDevices,             // Refresh device list
  getDeviceInfo,              // Get detailed device info
  sendCommand,                // Send command to device
  sendBatchCommand,           // Send command to multiple devices
  startStream,                // Start RTMP stream
  stopStream,                 // Stop active stream
  changeStreamQuality,        // Change quality without stopping
  settings,                   // Current settings
  updateSettings,             // Update settings
} = useDeviceController();
```

**Usage Example:**

```typescript
const { startStream, stopStream, devices, selectedDevice } = useDeviceController();

// Start stream
await startStream(
  selectedDevice!.deviceId,
  'rtmp://wowza.example.com/live/stream',
  'medium'
);

// Stop stream
await stopStream(selectedDevice!.deviceId);
```

### useStreamPreview

Manages stream previews and monitoring:

```typescript
const {
  previews,              // Array of stream previews
  selectedStream,        // Currently selected stream
  metrics,               // Stream metrics (bitrate, fps, etc)
  isLoading,             // Loading state
  selectStream,          // Select stream by ID
  addPreview,            // Add preview for new stream
  removePreview,         // Remove preview
  updateMetrics,         // Update metrics data
  startMonitoring,       // Start monitoring stream
  stopMonitoring,        // Stop monitoring
  increaseQuality,       // Increase quality tier
  decreaseQuality,       // Decrease quality tier
} = useStreamPreview();
```

### useFileBrowser

File browser and navigation:

```typescript
const {
  currentPath,           // Current directory path
  files,                 // Files in current directory
  selectedFiles,         // Selected file IDs
  isLoading,             // Loading state
  error,                 // Error message
  navigateTo,            // Navigate to path
  goBack,                // Go back one level
  goUp,                  // Go up one level
  goHome,                // Go to root
  listFiles,             // List files in directory
  deleteFile,            // Delete file
  downloadFile,          // Download file
  selectFile,            // Select file
  deselectFile,          // Deselect file
  selectAll,             // Select all files
  clearSelection,        // Clear selection
  filterByType,          // Filter by file type
  searchFiles,           // Search files
  sortBy,                // Sort by field
} = useFileBrowser();
```

---

## Components

### DeviceCard

Displays device information and status:

```typescript
interface DeviceCardProps {
  device: DeviceInfo;
  isSelected?: boolean;
  onPress?: () => void;
  onLongPress?: () => void;
  showBattery?: boolean;
  showStorage?: boolean;
}
```

**Features:**
- Device name, model, OS version
- Status indicator with color coding
- Battery and storage progress bars
- Network type indicator
- Last seen timestamp for offline devices

### StreamPreviewCard

Shows active stream preview:

```typescript
interface StreamPreviewCardProps {
  preview: StreamPreview;
  isSelected?: boolean;
  onPress?: () => void;
  onClose?: () => void;
  showMetrics?: boolean;
}
```

**Features:**
- Video thumbnail placeholder
- Live badge indicator
- Quality badge with color coding
- Duration timer (updates in real-time)
- Viewer count
- Close button for stopping stream

### RecordingControls

Recording control panel:

```typescript
interface RecordingControlsProps {
  deviceId: string;
  onStartRecording?: (quality: string) => Promise<void>;
  onStopRecording?: () => Promise<void>;
  onPauseRecording?: () => Promise<void>;
  onResumeRecording?: () => Promise<void>;
  isEnabled?: boolean;
}
```

**Features:**
- Real-time duration display
- Record/Pause/Resume/Stop buttons
- Status indicator (● REC)
- Estimated file size

### FileManager

File browser and manager:

```typescript
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
```

**Features:**
- Breadcrumb navigation
- File type icons
- File size and date display
- Quick download/delete actions
- File count and total size summary
- Folder navigation

### SettingsPanel

Settings management interface:

```typescript
interface SettingsPanelProps {
  settings: ControllerSettings;
  onSettingsChange?: (settings: Partial<ControllerSettings>) => void;
}
```

**Settings Sections:**
- Streaming Settings (quality, bitrate, reconnect)
- Notification Preferences (device, stream, command, system)
- General Settings (theme, language, refresh interval)
- About Information (version, build date)

### ControllerScreen

Main controller interface integrating all components:

```typescript
<ControllerScreen />
```

**Features:**
- Device list with selection
- Active streams preview grid
- Quality adjustment controls
- Device stats display
- Stream startup modal
- Refresh functionality
- Error handling with banner

---

## Usage Examples

### Start Streaming to Multiple Destinations

```typescript
const { sendBatchCommand } = useDeviceController();

await sendBatchCommand(
  ['device-1', 'device-2', 'device-3'],
  CommandType.START_STREAM,
  {
    rtmpUrl: 'rtmp://server.com/live/multiplex',
    quality: 'medium',
    cameraId: 'back',
  }
);
```

### Monitor Stream Quality in Real-time

```typescript
const { metrics, startMonitoring, stopMonitoring } = useStreamPreview();

// Start monitoring
startMonitoring(streamId);

// In render
<Text>Bitrate: {metrics?.bitrate || 0} kbps</Text>
<Text>FPS: {metrics?.frameRate || 0}</Text>

// Stop monitoring
stopMonitoring(streamId);
```

### File Management from Device

```typescript
const { 
  listFiles, 
  downloadFile, 
  deleteFile 
} = useFileBrowser();

// List files in directory
const listing = await listFiles(deviceId, '/storage/movies');

// Download specific file
const blob = await downloadFile(deviceId, '/storage/movies/video.mp4');

// Delete file
await deleteFile(deviceId, '/storage/movies/old.mp4');
```

### Batch Recording Control

```typescript
const handleRecordAll = async () => {
  await sendBatchCommand(
    devices.map(d => d.deviceId),
    CommandType.START_RECORDING,
    { quality: 'high' }
  );
};
```

---

## State Management Flow

```
User Action
    │
    ▼
Component (ControllerScreen)
    │
    ├─→ useDeviceController Hook
    │   ├─→ Device Selection
    │   ├─→ Command Execution
    │   └─→ Stream Management
    │
    ├─→ useStreamPreview Hook
    │   ├─→ Stream Selection
    │   ├─→ Metrics Monitoring
    │   └─→ Quality Adjustment
    │
    └─→ useFileBrowser Hook
        ├─→ File Navigation
        ├─→ File Operations
        └─→ Directory Listing
```

---

## Error Handling

All operations include comprehensive error handling:

```typescript
try {
  const result = await startStream(deviceId, rtmpUrl, quality);
  Alert.alert('Success', `Stream started: ${result}`);
} catch (err) {
  const errorMsg = err instanceof Error ? err.message : 'Unknown error';
  Alert.alert('Error', errorMsg);
}
```

**Common Errors:**
- No device selected
- Invalid RTMP URL
- Network timeout
- Permission denied
- Insufficient storage

---

## Styling

All components use consistent styling:

```typescript
// Color scheme
const colors = {
  primary: '#2196F3',
  success: '#4CAF50',
  warning: '#FF9800',
  error: '#F44336',
  background: '#F5F5F5',
  surface: '#FFFFFF',
  text: '#212121',
  textSecondary: '#666666',
  textTertiary: '#999999',
};

// Spacing
const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
};

// Border radius
const radius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
};
```

---

## Performance Optimization

### Auto-refresh Interval

Configurable refresh interval for device list updates:

```typescript
settings.refreshInterval = 5000; // 5 seconds
```

### Streaming Metrics

Metrics updated every 2 seconds:

```typescript
// In useStreamPreview
const interval = setInterval(() => {
  // Update metrics
}, 2000);
```

### Lazy Loading

File manager supports pagination:

```typescript
// List files with pagination
await listFiles(deviceId, path, { limit: 20, offset: 0 });
```

---

## Integration with Previous Phases

### Phase 5: Communication Layer
- Uses `useCommunication()` from Phase 5
- Socket.io for real-time updates
- Command routing through signaling server

### Phase 6: Media Capture
- References media commands (TAKE_PHOTO, START_VIDEO, etc.)
- Displays media files from device
- Controls recording from slave device

### Phase 7: RTMP Streaming
- Start/Stop stream commands
- Quality selection and adaptation
- Bitrate monitoring and metrics

---

## Testing Checklist

- [ ] Device list displays correctly
- [ ] Stream preview shows duration timer
- [ ] Quality buttons change quality
- [ ] File manager shows files
- [ ] Recording controls work
- [ ] Settings persist after reload
- [ ] Modal opens and closes properly
- [ ] Error messages display on failure
- [ ] Refresh pulls latest device data
- [ ] Batch commands execute

---

## Future Enhancements

1. **Grid View Mode**
   - Arrange devices in grid layout
   - Drag-to-reorder devices
   - Customizable grid size

2. **Advanced Analytics**
   - Device uptime charts
   - Bandwidth usage graphs
   - Error rate analysis

3. **Multi-language Support**
   - Full i18n integration
   - RTL language support

4. **Dark Mode**
   - Complete dark theme
   - High contrast option

5. **Accessibility**
   - Screen reader support
   - Voice control
   - Keyboard navigation

---

## Deployment Checklist

- [ ] All components compile without errors
- [ ] No TypeScript warnings
- [ ] All styles match design system
- [ ] Performance is acceptable
- [ ] Accessibility standards met
- [ ] Documentation is complete
- [ ] Unit tests pass
- [ ] Integration tests pass

---

## API Reference

See [controller.ts](../src/types/controller.ts) for complete type definitions.

All public APIs include JSDoc comments for IDE autocomplete.

---

## Support

For issues or questions:
- Check component prop types
- Review hook return values
- Verify device is connected
- Check network connectivity
- Review error messages in console

