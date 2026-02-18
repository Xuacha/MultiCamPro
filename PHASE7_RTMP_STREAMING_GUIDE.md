# Phase 7: RTMP Streaming - MultiCamPro

## Overview

Phase 7 introduces **real-time live streaming** capabilities via RTMP (Real Time Messaging Protocol). The system includes adaptive quality streaming that responds to network conditions, allowing multi-camera feeds to be broadcast to streaming servers (Wowza, Red5, YouTube Live, Twitch, etc.).

**Key Capabilities:**
- ✅ RTMP streaming protocol support
- ✅ Network-aware quality adaptation (1-10 Mbps range)
- ✅ Three quality tiers: Low/Medium/High
- ✅ Continuous bitrate monitoring
- ✅ Quality warnings for poor network conditions
- ✅ Stream session tracking
- ✅ Event-driven architecture with listeners

---

## Architecture

### Components

```
┌─────────────────────────────────────────────────────────────┐
│                    CommandReceiverService                   │
│  (Orchestrates all slave device operations)                 │
└──────────┬──────────────────────┬──────────────────────────┘
           │                      │
    ┌─────┴────────┐      ┌──────┴───────────┐
    │              │      │                  │
    ▼              ▼      ▼                  ▼
RTMPStreamManager  CameraManager  StreamQualityManager  LocationManager
    │              (Phase 6)         (Phase 7)          (Phase 6)
    │                                    │
    └────────────────┬───────────────────┘
                     │
            ┌────────▼────────┐
            │  RTMP Server    │
            │  (Wowza/Red5)   │
            └─────────────────┘
```

### Stream Flow

```
1. START_STREAM Command
   ├─ Parse command data (rtmpUrl, quality, cameraId)
   ├─ Check network status via StreamQualityManager
   ├─ Validate network adequacy for requested quality
   └─ If valid: Start RTMPStreamManager
   
2. Network Monitoring (Every 5 seconds)
   ├─ StreamQualityManager detects network changes
   ├─ Notifies listeners of quality changes
   └─ Recommends quality adjustment if needed
   
3. Bitrate Monitoring (Every 2 seconds during streaming)
   ├─ RTMPStreamManager monitors stream bitrate
   ├─ Emits bitrate events
   └─ Changes quality if network deteriorates
   
4. STOP_STREAM Command
   ├─ Stop RTMPStreamManager
   ├─ Get stream duration and statistics
   └─ Return session information
```

---

## RTMPStreamManager

### Purpose
Manages RTMP streaming lifecycle: startup, quality control, monitoring, and shutdown.

### Initialization
```kotlin
private lateinit var rtmpStreamManager: RTMPStreamManager

override fun onCreate() {
    super.onCreate()
    rtmpStreamManager = RTMPStreamManager(cameraManager, serviceScope)
}
```

### Public Methods

#### `startStream(rtmpUrl: String, quality: String, cameraId: String): Result<String>`
Initiates RTMP streaming to the specified server.

**Parameters:**
- `rtmpUrl`: RTMP server URL (e.g., `rtmp://streaming.example.com/live/stream`)
- `quality`: Quality tier - "low", "medium", or "high"
- `cameraId`: Camera identifier - "back", "front"

**Returns:**
- `Result<String>`: Success returns session ID, failure returns error message

**Quality Settings:**
| Quality | Bitrate | FPS | Resolution | Use Case |
|---------|---------|-----|------------|----------|
| Low     | 1 Mbps  | 24  | 640×480    | Poor network, mobile data |
| Medium  | 5 Mbps  | 30  | 1280×720   | Standard conditions |
| High    | 10 Mbps | 30  | 1920×1080  | Excellent network, WiFi |

**Example:**
```kotlin
val result = rtmpStreamManager.startStream(
    rtmpUrl = "rtmp://wowza.example.com/live/stream",
    quality = "medium",
    cameraId = "back"
)

when {
    result.isSuccess -> {
        val sessionId = result.getOrNull()
        Logger.log("Stream started: $sessionId")
    }
    result.isFailure -> {
        val error = result.exceptionOrNull()?.message
        Logger.log("Error: $error")
    }
}
```

#### `stopStream(): Result<String>`
Stops the active RTMP stream.

**Returns:**
- `Result<String>`: Success/failure status

**Example:**
```kotlin
val result = rtmpStreamManager.stopStream()
if (result.isSuccess) {
    Logger.log("Stream stopped successfully")
}
```

#### `changeQuality(newQuality: String): Result<Unit>`
Changes streaming quality without stopping the stream.

**Parameters:**
- `newQuality`: New quality tier - "low", "medium", "high"

#### `getQualitySettings(quality: String): Quadruple<Int, Int, Int, Int>`
Returns quality parameters: (bitrate in kbps, fps, width, height)

#### `getStreamInfo(): Map<String, Any>?`
Returns current stream information if streaming:
```kotlin
{
    "sessionId": "stream-1704067200000-abc123",
    "rtmpUrl": "rtmp://streaming.example.com/live/stream", 
    "duration": 125000,  // milliseconds
    "isActive": true
}
```

#### `getStreamDuration(): Long`
Current stream duration in milliseconds.

#### `isStreaming: Boolean`
Property indicating if stream is active.

### Events

#### StreamEvent Sealed Class
Represents state changes during streaming:

```kotlin
sealed class StreamEvent {
    // Stream successfully started
    data class StreamStarted(
        val sessionId: String,
        val rtmpUrl: String,
        val quality: String
    ) : StreamEvent()
    
    // Stream stopped
    data class StreamStopped(
        val sessionId: String,
        val duration: Long
    ) : StreamEvent()
    
    // Quality changed while streaming
    data class StreamQualityChanged(
        val newQuality: String,
        val bitrate: Int,
        val frameRate: Int
    ) : StreamEvent()
    
    // Bitrate monitoring update
    data class StreamBitrate(
        val bitrate: Int,
        val frameRate: Int
    ) : StreamEvent()
    
    // Stream error occurred
    data class StreamError(
        val message: String,
        val exception: Exception
    ) : StreamEvent()
    
    // Stream is ready (technical preparation complete)
    object StreamReady : StreamEvent()
}
```

#### Listener Pattern
```kotlin
interface StreamListener {
    fun onStreamEvent(event: StreamEvent)
}

// Add listener
rtmpStreamManager.addListener(object : StreamListener {
    override fun onStreamEvent(event: StreamEvent) {
        when (event) {
            is StreamEvent.StreamStarted -> {
                Logger.log("Stream ${event.sessionId} started")
            }
            is StreamEvent.StreamBitrate -> {
                Logger.log("Bitrate: ${event.bitrate} kbps")
            }
            is StreamEvent.StreamError -> {
                Logger.log("Error: ${event.message}")
            }
            // ... handle other events
        }
    }
})
```

---

## StreamQualityManager

### Purpose
Continuously monitors network conditions and recommends appropriate streaming quality.

### Initialization
```kotlin
private lateinit var streamQualityManager: StreamQualityManager

override fun onCreate() {
    super.onCreate()
    streamQualityManager = StreamQualityManager(this, serviceScope)
}
```

### Public Methods

#### `getNetworkStatus(): NetworkStatus`
Returns current network conditions.

**Returns:**
```kotlin
data class NetworkStatus(
    val type: NetworkType,           // WIFI, 4G, 5G, 3G, OFFLINE
    val quality: NetworkQuality,     // POOR, FAIR, GOOD, EXCELLENT
    val estimatedBitrate: Int,       // kbps
    val signalStrength: Int,         // 0-100
    val isMetered: Boolean,          // Is cellular data metered?
    val timestamp: Long              // When status was detected
)
```

**Network Type Detection:**
| Type | Characteristics |
|------|-----------------|
| WIFI | ~50 Mbps estimated |
| CELLULAR_5G | LTE-A/5G capable, actual bitrate from SDK |
| CELLULAR_4G | >10 Mbps typical |
| CELLULAR_3G | 1-10 Mbps typical |
| OFFLINE | No connection |
| UNKNOWN | Cannot determine |

**Quality Mapping:**
| Quality | Bitrate | Recommendation |
|---------|---------|-----------------|
| EXCELLENT | >10 Mbps | Stream at "high" (10 Mbps) |
| GOOD | 5-10 Mbps | Stream at "high" or "medium" |
| FAIR | 2-5 Mbps | Stream at "medium" (5 Mbps) |
| POOR | <2 Mbps | Stream at "low" (1 Mbps) |
| UNKNOWN | — | Default to "medium" |

**Example:**
```kotlin
val status = streamQualityManager.getNetworkStatus()
Logger.log("Network: ${status.type}")
Logger.log("Quality: ${status.quality}")
Logger.log("Bitrate: ${status.estimatedBitrate} kbps")
Logger.log("Signal: ${status.signalStrength}%")
```

#### `recommendQuality(): String`
Automatically recommends quality based on current network.

**Returns:** "low", "medium", or "high"

**Example:**
```kotlin
val recommended = streamQualityManager.recommendQuality()
Logger.log("Recommended quality: $recommended")
```

#### `isNetworkAdequateForStreaming(quality: String = "medium"): Boolean`
Validates if network can support requested quality.

**Parameters:**
- `quality`: Quality tier to validate

**Returns:** True if network adequate, false otherwise

**Example:**
```kotlin
if (!streamQualityManager.isNetworkAdequateForStreaming("high")) {
    Logger.log("Network insufficient for high quality")
}
```

#### `getNetworkWarning(): String?`
Returns warning message (null if no warnings).

**Warning Conditions:**
- Network is offline
- Network quality is POOR
- Connection is metered (cellular)
- Signal strength is weak (<30%)

**Example:**
```kotlin
val warning = streamQualityManager.getNetworkWarning()
if (warning != null) {
    sendWarningToController(warning)
}
```

### Network Monitoring

StreamQualityManager continuously monitors network every 5 seconds and notifies listeners of changes:

```kotlin
interface NetworkListener {
    fun onNetworkEvent(event: NetworkEvent)
}

sealed class NetworkEvent {
    data class NetworkStatusChanged(val status: NetworkStatus) : NetworkEvent()
    data class QualityRecommended(val quality: String) : NetworkEvent()
    data class NetworkWarning(val message: String) : NetworkEvent()
}
```

---

## Integration in CommandReceiverService

### Command Handlers

#### START_STREAM Handler
```kotlin
private fun handleStartStream(commandId: String, commandData: String?) {
    // 1. Parse JSON: {"rtmpUrl": "...", "quality": "medium", "cameraId": "back"}
    // 2. Get network status
    // 3. Validate network is adequate
    // 4. Start RTMPStreamManager via coroutine
    // 5. Send response with sessionId or error
    
    // Full implementation in CommandReceiverService.kt lines 306-392
}
```

**Response on Success:**
```json
{
    "status": "success",
    "sessionId": "stream-1704067200000-abc123",
    "rtmpUrl": "rtmp://server.example.com/live/stream",
    "quality": "medium",
    "cameraId": "back",
    "networkStatus": {
        "type": "WIFI",
        "quality": "EXCELLENT",
        "bitrate": 50000
    },
    "timestamp": 1704067200000
}
```

**Response on Warning (Network Inadequate):**
```json
{
    "status": "warning",
    "message": "Metered connection detected",
    "recommendedQuality": "low",
    "networkStatus": {
        "type": "CELLULAR_4G",
        "quality": "FAIR",
        "bitrate": 7000
    }
}
```

#### STOP_STREAM Handler
```kotlin
private fun handleStopStream(commandId: String) {
    // 1. Call rtmpStreamManager.stopStream()
    // 2. Get stream statistics
    // 3. Return duration and session info
    
    // Full implementation in CommandReceiverService.kt lines 394-418
}
```

**Response:**
```json
{
    "status": "success",
    "duration": 125000,
    "sessionId": "stream-1704067200000-abc123",
    "rtmpUrl": "rtmp://server.example.com/live/stream",
    "timestamp": 1704067325000
}
```

---

## RTMP Server Configuration

### Wowza Streaming Engine
```
URL Format: rtmp://wowza-server.example.com/live/stream-name
Application: live
Stream Name: stream-name
```

### Red5 Media Server
```
URL Format: rtmp://red5-server.example.com/live/stream-name
Application: live
Stream Name: stream-name
```

### YouTube Live
```
URL Format: rtmp://a.rtmp.youtube.com/live2/rtmp-key
Requires: Valid streaming key from YouTube streaming settings
```

### Twitch
```
URL Format: rtmp://live.twitch.tv/app/stream-key
Requires: Valid streaming key from Twitch dashboard
```

---

## Error Handling

All streaming operations return `Result<T>` for comprehensive error handling:

```kotlin
// Get the result (either success or failure)
val result = rtmpStreamManager.startStream(url, quality, cameraId)

// Check success
if (result.isSuccess) {
    val sessionId = result.getOrNull()
}

// Check failure
if (result.isFailure) {
    val exception = result.exceptionOrNull()
    Logger.log("Stream failed: ${exception?.message}")
}
```

### Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| Invalid RTMP URL format | URL doesn't start with rtmp:// | Validate URL before starting |
| Already streaming | Stream already active | Stop current stream first |
| Network offline | No internet connection | Wait for network restore |
| Inadequate bitrate | Network too slow for quality | Request lower quality tier |
| Media permission denied | Camera/audio not allowed | Request permissions in settings |

---

## Performance Considerations

### Battery Impact
- Network monitoring: Every 5 seconds (minimal)
- Bitrate monitoring: Every 2 seconds during streaming only
- Camera stream: Continuous while streaming (significant)
- Overall: ~8% additional battery drain during active streaming

### Network Impact
- Start quality at "medium" (5 Mbps) by default
- Use "low" (1 Mbps) for cellular/metered connections
- Available for WiFi: "high" (10 Mbps) recommended
- Monitor network continuously to adapt

### CPU Impact
- MediaRecorder encoding: ~25-30% single core
- Quality adaptation: <2% (event-driven)
- Network monitoring: <1%

---

## Security Considerations

1. **RTMP URL Validation**
   - Only rtmp:// and rtmps:// protocols
   - Whitelist known streaming servers
   - Sanitize URL parameters

2. **Authentication**
   - Include auth tokens in RTMP URL if required
   - Use RTMPS (encrypted) for sensitive streams
   - Validate server certificates

3. **Device Permissions**
   - Camera permission (manifest + runtime)
   - Audio recording permission (manifest + runtime)
   - Network state permission (manifest)
   - Location permission (only if tracking enabled)

4. **Rate Limiting**
   - Maximum 1 stream per device at a time
   - Prevent rapid start/stop cycles
   - Implement cooldown between failed attempts

---

## Testing Checklist

- [ ] Stream starts successfully to RTMP server
- [ ] Stream quality matches requested tier
- [ ] Quality changes when network condition changes
- [ ] Stream stops cleanly and returns duration
- [ ] Session ID is unique per stream
- [ ] Network warnings appear for slow connections
- [ ] Stream handles WiFi to cellular switch
- [ ] Stream handles loss of network connection
- [ ] Error messages are informative
- [ ] CPU/Battery impact is acceptable
- [ ] Multiple qualities work correctly (low/medium/high)
- [ ] Stream info available while streaming

---

## Next Steps

1. **Phase 8**: Implement Controller UI for managing streams
2. **Phase 9**: Add cloud storage for stream archives
3. **Phase 10**: Analytics and performance monitoring
4. **Future**: Advanced features like multi-bitrate streaming, WebRTC overlay
