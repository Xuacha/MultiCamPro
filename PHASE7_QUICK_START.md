# Phase 7: RTMP Streaming - Quick Start Guide

## 5-Minute Setup

### 1. Verify Phase 6 Complete
Ensure CommandReceiverService, CameraManager, LocationManager, and AudioManager are fully integrated:

```bash
# Check Phase 6 files exist
ls -la android/slave-app/app/src/main/kotlin/com/xuacha/multicampro/managers/
# Should show: CameraManager.kt, LocationManager.kt, AudioManager.kt
```

### 2. Verify Phase 7 Files
Check that new streaming managers are in place:

```bash
ls -la android/slave-app/app/src/main/java/com/xuacha/multicampro/managers/
# Should show: RTMPStreamManager.kt, StreamQualityManager.kt (and Phase 6 managers)
```

### 3. Rebuild Project
```bash
# From workspace root
cd android
./gradlew clean build

# Or in Android Studio
Build > Clean Project
Build > Rebuild Project
```

---

## Send Your First Stream

### Test with Android Studio Emulator

#### 1. Set Up Test Server (Optional)
For local testing without real RTMP server:

```bash
# Using ffmpeg to create local RTMP server
# Terminal 1: Start rtmp server
ffmpeg -listen 1 -i rtmp://localhost:1935/live/test -c copy -f flv "pipe:"

# This creates a local RTMP sink. Real streams would use Wowza/Red5
```

#### 2. Send START_STREAM Command
From controller app or test tool:

```json
{
    "command": "START_STREAM",
    "commandId": "stream-001",
    "commandData": {
        "rtmpUrl": "rtmp://your-server.com/live/multicam",
        "quality": "medium",
        "cameraId": "back"
    }
}
```

#### 3. Expected Response (Success)
```json
{
    "commandId": "stream-001",
    "commandType": "START_STREAM",
    "data": {
        "status": "success",
        "sessionId": "stream-1704067200000-abc123",
        "rtmpUrl": "rtmp://your-server.com/live/multicam",
        "quality": "medium",
        "cameraId": "back",
        "networkStatus": {
            "type": "WIFI",
            "quality": "EXCELLENT",
            "bitrate": 50000
        },
        "timestamp": 1704067200000
    }
}
```

#### 4. Expected Response (Network Warning)
```json
{
    "commandId": "stream-001",
    "commandType": "START_STREAM",
    "data": {
        "status": "warning",
        "message": "Metered cellular connection detected",
        "recommendedQuality": "low",
        "networkStatus": {
            "type": "CELLULAR_4G",
            "quality": "FAIR",
            "bitrate": 7500
        }
    }
}
```

#### 5. Stop Stream
```json
{
    "command": "STOP_STREAM",
    "commandId": "stream-002"
}
```

#### 6. Expected Stop Response
```json
{
    "commandId": "stream-002",
    "commandType": "STOP_STREAM",
    "data": {
        "status": "success",
        "duration": 125000,
        "sessionId": "stream-1704067200000-abc123",
        "rtmpUrl": "rtmp://your-server.com/live/multicam",
        "timestamp": 1704067325000
    }
}
```

---

## Real RTMP Servers

### YouTube Live Setup

1. **Get Streaming URL:**
   - Go to youtube.com > Create > Go Live
   - Select "Stream" or "Stream now"
   - Get RTMP ingest URL: `rtmp://a.rtmp.youtube.com/live2/`
   - Get Stream key from dashboard

2. **Full RTMP URL:**
   ```
   rtmp://a.rtmp.youtube.com/live2/YOUR-STREAM-KEY
   ```

3. **Send Command:**
   ```json
   {
       "command": "START_STREAM",
       "commandId": "yt-001",
       "commandData": {
           "rtmpUrl": "rtmp://a.rtmp.youtube.com/live2/YOUR-STREAM-KEY",
           "quality": "high",
           "cameraId": "back"
       }
   }
   ```

### Twitch Setup

1. **Get Streaming URL:**
   - Go to twitch.tv dashboard
   - Settings > Channel > Primary Stream Key
   - Copy the stream key

2. **Full RTMP URL:**
   ```
   rtmp://live.twitch.tv/app/YOUR-STREAM-KEY
   ```

3. **Send Command:**
   ```json
   {
       "command": "START_STREAM",
       "commandId": "twitch-001",
       "commandData": {
           "rtmpUrl": "rtmp://live.twitch.tv/app/YOUR-STREAM-KEY",
           "quality": "high",
           "cameraId": "back"
       }
   }
   ```

### Wowza Streaming Engine Setup

1. **Configuration:**
   - Install Wowza on server
   - Create "live" application
   - Get server URL: `rtmp://wowza.example.com`

2. **Full RTMP URL:**
   ```
   rtmp://wowza.example.com/live/stream-name
   ```

3. **Send Command:**
   ```json
   {
       "command": "START_STREAM",
       "commandId": "wowza-001",
       "commandData": {
           "rtmpUrl": "rtmp://wowza.example.com/live/multicam",
           "quality": "medium",
           "cameraId": "back"
       }
   }
   ```

---

## Quality Selection

### Automatic Selection Based on Network

```
Network Type      Recommended Quality
─────────────────────────────────────
5G WiFi           high (10 Mbps best)
WiFi (home)       high (10 Mbps)
WiFi (public)     medium (5 Mbps)
4G LTE            medium (5 Mbps)
3G HSPA           low (1 Mbps)
Weak signal       low (1 Mbps)
Metered cellular  low (1 Mbps)
```

### Manual Override

If automatic quality is unsuitable:

```json
{
    "command": "START_STREAM",
    "commandId": "stream-001",
    "commandData": {
        "rtmpUrl": "rtmp://server.com/live/stream",
        "quality": "low",
        "cameraId": "back"
    }
}
```

---

## Monitor Network Conditions

### Check Network Status
The StreamQualityManager automatically monitors network every 5 seconds:

```
Network Type: WIFI
Quality: EXCELLENT
Bitrate: 50000 kbps
Signal: 95%
```

### View Logs
From Android Studio logcat:

```bash
# Filter for streaming logs
adb logcat | grep "STREAM"

# Expected output during streaming:
# "Iniciando stream RTMP hacia: rtmp://server.com/live/stream"
# "Stream iniciado. Session ID: stream-1704067200000-abc123"
# "Bitrate: 5000 kbps, FPS: 30"
```

---

## Troubleshooting

### Stream Fails to Start

**Issue:** START_STREAM returns error
```json
{
    "status": "error",
    "message": "Invalid RTMP URL format"
}
```

**Solution:**
- Verify URL starts with `rtmp://` or `rtmps://`
- Check URL is complete: `rtmp://server.com/live/stream`
- Avoid trailing slashes

---

### Warning: Network Inadequate

**Issue:** START_STREAM returns warning
```json
{
    "status": "warning",
    "message": "Network quality is insufficient for streaming",
    "recommendedQuality": "low"
}
```

**Solution:**
- Use recommended quality: "low" instead of requested
- Switch to WiFi if on cellular
- Move closer to WiFi router
- Reduce other network usage

---

### Stream Quality Drops During Session

**Automatic Handling:** RTMPStreamManager monitors bitrate every 2 seconds and may auto-downgrade quality if network degrades.

**Manual Fix:**
- Check network status via logs
- If necessary, stop stream and restart with "low" quality
- Investigate network interference

---

### Permissions Denied

**Issue:** Stream fails with permission error

**Solution - Android 13+:**
```kotlin
// Request at runtime in controller
if (ContextCompat.checkSelfPermission(context, Manifest.permission.CAMERA)
    != PackageManager.PERMISSION_GRANTED) {
    ActivityCompat.requestPermissions(activity, arrayOf(Manifest.permission.CAMERA), 100)
}
```

**Manifest (already included):**
```xml
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.RECORD_AUDIO" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
```

---

## Performance Tips

### For Better Stream Quality
1. **Use WiFi** - 50 Mbps typical vs 10 Mbps on 4G
2. **Reduce interference** - Keep away from other WiFi networks
3. **Select "high" quality** - Only on excellent networks (>10 Mbps)
4. **Close background apps** - Free up CPU/memory

### For Better Reliability
1. **Start with "medium"** - Safer than "high"
2. **Monitor network** - Check logs for bitrate drops
3. **Use wired connection** - Via USB tethering if possible
4. **Test before live** - Verify server connection works

### For Battery Optimization
1. **Streaming uses 8-10% extra battery** - Plan accordingly
2. **Use "low" quality on cellular** - Saves bandwidth and battery
3. **Run for limited duration** - Stop streaming when not needed
4. **Close display if possible** - Camera uses power regardless

---

## Example: Full Streaming Session

```
┌──────────────────────────────────────────────────────────┐
│ Controller: Start Stream to Wowza Server                │
└──────────────────────────────────────────────────────────┘
                            │
                            ▼
┌──────────────────────────────────────────────────────────┐
│ Slave: Check network status                             │
│ ✓ WiFi detected (50 Mbps estimated)                     │
│ ✓ Quality EXCELLENT                                     │
│ ✓ Network adequate for "medium" quality                 │
└──────────────────────────────────────────────────────────┘
                            │
                            ▼
┌──────────────────────────────────────────────────────────┐
│ Slave: Start RTMPStreamManager                           │
│ ✓ Create session ID: stream-1704067200000-abc123        │
│ ✓ Configure MediaRecorder (5 Mbps, 30 fps, 1280x720)    │
│ ✓ Connect to rtmp://wowza.example.com/live/multicam     │
└──────────────────────────────────────────────────────────┘
                            │
                            ▼
┌──────────────────────────────────────────────────────────┐
│ Controller: Receive success response                    │
│ {                                                       │
│   "status": "success",                                  │
│   "sessionId": "stream-1704067200000-abc123",           │
│   "quality": "medium"                                   │
│ }                                                       │
└──────────────────────────────────────────────────────────┘
                            │
                    ┌───────┴────────┐
                    │                │
        ┌──────────▼──────────┐  ┌──▼──────────────────┐
        │ Stream Active       │  │ Monitor Network     │
        │ 2min 30sec          │  │ Every 5 seconds     │
        │ 5 Mbps bitrate      │  │ Network EXCELLENT   │
        │ 30 fps              │  │ No changes needed   │
        │                     │  │                     │
        └─────────────────────┘  └─────────────────────┘
                    │                    │
                    └───────┬────────────┘
                            │
                            ▼
┌──────────────────────────────────────────────────────────┐
│ Controller: Stop Stream                                 │
└──────────────────────────────────────────────────────────┘
                            │
                            ▼
┌──────────────────────────────────────────────────────────┐
│ Slave: Stop RTMPStreamManager                            │
│ ✓ Stream duration: 150000 ms (2.5 minutes)              │
│ ✓ Final bitrate: 5000 kbps                              │
│ ✓ Session complete                                      │
└──────────────────────────────────────────────────────────┘
                            │
                            ▼
┌──────────────────────────────────────────────────────────┐
│ Controller: Receive stop response                       │
│ {                                                       │
│   "status": "success",                                  │
│   "duration": 150000,                                   │
│   "sessionId": "stream-1704067200000-abc123"            │
│ }                                                       │
└──────────────────────────────────────────────────────────┘
```

---

## Next Steps

1. Test in Android emulator with local test server
2. Test with real RTMP server (YouTube/Twitch/Wowza)
3. Test quality adaptation: switch WiFi to cellular mid-stream
4. Test network failure: disconnect WiFi while streaming
5. Review logs for bitrate and quality changes
6. Proceed to Phase 8 (Controller UI) when confident

---

## Support

For issues or questions:
- Check logs: `adb logcat | grep STREAM`
- Verify RTMP URL format: must start with `rtmp://`
- Test network connectivity: WiFi/Cellular both
- Ensure permissions granted: Camera, Audio, Network

