# ⚡ Fase 9: Cloud Storage - Quick Start (5 Minutes)

**Get up and running with Phase 9 cloud storage in 5 minutes!**

---

## 1️⃣ Import & Use Hook

```typescript
import { useCloudStorage } from '@/hooks/useCloudStorage';

function YourComponent() {
  const {
    upload,
    activeUploads,
    albums,
    settings,
    downloadFile,
  } = useCloudStorage();

  // Your code...
}
```

---

## 2️⃣ Upload a File

```typescript
// Single upload
const result = await upload(
  '/path/to/file.mp4',
  'my_video.mp4',
  'album_123'  // optional album ID
);

if (result.ok) {
  console.log('Upload started!', result.value.id);
} else {
  console.error('Upload error:', result.error);
}
```

---

## 3️⃣ Batch Upload Multiple Files

```typescript
const files = [
  { localPath: '/path/file1.mp4', fileName: 'video1.mp4' },
  { localPath: '/path/file2.mp4', fileName: 'video2.mp4' },
];

const result = await batchUpload(files, 'album_123');
```

---

## 4️⃣ Display Upload Progress

```typescript
{activeUploads.map(upload => (
  <View key={upload.id}>
    <Text>{upload.fileName}</Text>
    <ProgressBar value={upload.progress} />
    <Text>{upload.progress}%</Text>
  </View>
))}
```

---

## 5️⃣ Create an Album

```typescript
const result = await createNewAlbum(
  'My Trip',
  'Photos from my vacation'
);

if (result.ok) {
  console.log('Album created!', result.value.id);
}
```

---

## 6️⃣ View & Select Albums

```typescript
{albums.map(album => (
  <Pressable
    key={album.id}
    onPress={() => selectAlbum(album)}
  >
    <Text>{album.name}</Text>
    <Text>{album.fileCount} files</Text>
  </Pressable>
))}
```

---

## 7️⃣ Enable Auto-Upload

```typescript
updateAutoUploadPolicy({
  enabled: true,
  uploadOnlyWifi: true,     // WiFi only
  chargeRequired: false,     // Not required
  uploadInterval: 3600,      // Every hour (seconds)
});
```

---

## 8️⃣ Check Storage Quota

```typescript
const { quota } = useCloudStorage();

if (quota) {
  const percentUsed = (quota.used / quota.total) * 100;
  console.log(`Using ${percentUsed}% of storage`);
  
  if (percentUsed > 80) {
    console.log('⚠️ Storage warning: >80% used');
  }
}
```

---

## 9️⃣ Download a File

```typescript
const result = await downloadFile(
  'path/in/cloud',
  '/local/download/path',
  'filename.mp4'
);

if (result.ok) {
  console.log('Download complete!');
}
```

---

## 🔟 Manual Sync

```typescript
import { Button } from '@/components/Button';

<Button
  title="Sync Cloud Storage"
  onPress={() => sync()}
/>
```

---

## 🎯 Components to Use

### CloudAlbums
Display and manage albums
```tsx
<CloudAlbums
  albums={albums}
  selectedAlbum={selectedAlbum}
  onSelectAlbum={selectAlbum}
  onCreateAlbum={createNewAlbum}
/>
```

### CloudUploadManager
Monitor active uploads
```tsx
<CloudUploadManager
  activeUploads={activeUploads}
  onCancelUpload={(uploadId) => {
    // Cancel upload with ID
  }}
/>
```

### CloudStorageScreen
Full cloud interface (all-in-one)
```tsx
<Stack.Screen
  name="CloudStorage"
  component={CloudStorageScreen}
/>
```

---

## 🚨 Error Handling

```typescript
const result = await upload(localPath, fileName);

if (result.ok) {
  // Success: result.value is UploadTask
  const uploadTask = result.value;
} else {
  // Error: result.error is CloudError
  console.error(result.error.code);     // Error code
  console.error(result.error.message);  // Human-readable message
  console.error(result.error.toString()); // Full error
}
```

---

## 📊 Monitor Sync Status

```typescript
const { syncState, isSyncing } = useCloudStorage();

if (isSyncing) {
  console.log(`Syncing... ${syncState.syncProgress}%`);
  console.log(`Pending: ${syncState.pendingUploadCount} uploads`);
}
```

---

## 🔄 Listen to Events

```typescript
useEffect(() => {
  const unsubscribe = addEventListener(
    CloudEventType.UPLOAD_COMPLETED,
    (event) => {
      console.log('Upload done!', event.uploadId);
    }
  );

  return unsubscribe;
}, []);
```

---

## ✅ Checklist for Integration

- [ ] Import `useCloudStorage` hook
- [ ] Render `CloudStorageScreen` in navigation
- [ ] Test single file upload
- [ ] Test batch upload
- [ ] Test album creation
- [ ] Test auto-upload settings
- [ ] Test download functionality
- [ ] Verify quota display
- [ ] Test error scenarios
- [ ] Check Firebase security rules

---

## 🎓 Learn More

Read full documentation in:
- 📖 [PHASE9_CLOUD_STORAGE_GUIDE.md](PHASE9_CLOUD_STORAGE_GUIDE.md) - Complete API reference
- ✔️ [PHASE9_VALIDATION_CHECKLIST.md](PHASE9_VALIDATION_CHECKLIST.md) - Testing procedures

---

**Cloud Storage Ready! 🚀**
