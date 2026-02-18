## PHASE 10: API Reference

Complete API documentation for all Phase 10 services, hooks, and components.

---

## Sharing Service API

### `createShareLink()`

Create a public share link for a file.

```typescript
async function createShareLink(
  fileId: string,
  options?: {
    expirationDays?: number;
    password?: string;
  }
): Promise<Result<ShareLink>>
```

**Parameters:**
- `fileId` - File identifier in cloud storage
- `options.expirationDays` - Days until link expires (default: 30)
- `options.password` - Optional password protection

**Returns:**
- Success: `Result<ShareLink>` with public URL
- Failure: `Result` with error details

**Example:**
```typescript
const result = await createShareLink('file-123', {
  expirationDays: 7,
  password: 'secure'
});

if (result.ok && result.value) {
  const { publicUrl, linkHash } = result.value;
}
```

---

### `revokeShareLink()`

Revoke a public share link.

```typescript
async function revokeShareLink(linkUrl: string): Promise<Result<void>>
```

**Parameters:**
- `linkUrl` - Public URL to revoke

**Returns:**
- Success: Empty Result
- Failure: Result with error details

---

### `shareFileWithUser()`

Share a file with a specific user.

```typescript
async function shareFileWithUser(
  fileId: string,
  recipientEmail: string,
  accessLevel: AccessLevel,
  expirationDays?: number
): Promise<Result<FileSharing>>
```

**Parameters:**
- `fileId` - File to share
- `recipientEmail` - Recipient email address
- `accessLevel` - Permission level (VIEWER | EDITOR | ADMIN | OWNER)
- `expirationDays` - Optional expiration (default: unlimited)

**Returns:**
- Success: `Result<FileSharing>` with sharing details
- Failure: Result with error details

---

### `revokeFileSharing()`

Revoke user access to a file.

```typescript
async function revokeFileSharing(
  fileId: string,
  recipientEmail: string
): Promise<Result<void>>
```

**Parameters:**
- `fileId` - Shared file
- `recipientEmail` - User to revoke access from

**Returns:**
- Success: Empty Result
- Failure: Result with error details

---

### `getFileSharingStatus()`

Get complete sharing status for a file.

```typescript
async function getFileSharingStatus(
  fileId: string
): Promise<Result<FileSharingStatus>>
```

**Returns:**
```typescript
{
  fileId: string;
  ownerId: string;
  sharedWith: FileSharing[];
  publicLinks: ShareLink[];
  invitations: SharingInvitation[];
}
```

---

### `recordShareLinkAccess()`

Track access to a share link.

```typescript
async function recordShareLinkAccess(
  linkId: string,
  userAgent: string,
  ipAddress?: string
): Promise<Result<AccessRecord>>
```

**Parameters:**
- `linkId` - Share link identifier
- `userAgent` - Browser/client user agent
- `ipAddress` - Optional client IP address

**Returns:**
- Success: `Result<AccessRecord>` with access log
- Failure: Result with error details

---

### `createSharingInvitation()`

Send a sharing invitation to a user.

```typescript
async function createSharingInvitation(
  fileId: string,
  recipientEmail: string,
  message?: string
): Promise<Result<SharingInvitation>>
```

**Parameters:**
- `fileId` - File to share
- `recipientEmail` - Recipient email
- `message` - Optional custom message

**Returns:**
- Success: `Result<SharingInvitation>` with invitation details
- Failure: Result with error details

**Invitation Validity:** 30 days

---

### `acceptSharingInvitation()`

Accept a sharing invitation.

```typescript
async function acceptSharingInvitation(
  invitationId: string
): Promise<Result<FileSharing>>
```

**Parameters:**
- `invitationId` - Invitation to accept

**Returns:**
- Success: `Result<FileSharing>` with granted access
- Failure: Result with error details

---

### `getShareLinkAnalytics()`

Get analytics for a share link.

```typescript
async function getShareLinkAnalytics(
  linkId: string
): Promise<Result<ShareAnalytics>>
```

**Returns:**
```typescript
{
  linkId: string;
  totalAccesses: number;
  uniqueVisitors: number;
  accessHistory: AccessRecord[];
  lastAccessed?: Timestamp;
  geolocation?: string[];
}
```

---

## Analytics Service API

### `getUploadMetrics()`

Get upload statistics for a period.

```typescript
async function getUploadMetrics(
  userId: string,
  period: 'day' | 'week' | 'month' | 'year'
): Promise<Result<UploadMetrics>>
```

**Returns:**
```typescript
{
  statistics: {
    totalUploads: number;
    successRate: number;
    failedUploads: number;
    averageFileSize: number;
    averageUploadSpeed: number;
    totalBandwidth: number;
    totalTime: number;
  };
  timeline: number[]; // Daily data points
}
```

---

### `getDownloadMetrics()`

Get download statistics for a period.

```typescript
async function getDownloadMetrics(
  userId: string,
  period: 'day' | 'week' | 'month' | 'year'
): Promise<Result<DownloadMetrics>>
```

**Returns:**
```typescript
{
  statistics: {
    totalDownloads: number;
    averageDownloadSpeed: number;
    peakDownloadSpeed: number;
    totalBandwidth: number;
    avgDownloadTime: number;
  };
  timeline: number[];
}
```

---

### `getStorageTrends()`

Get storage growth trends.

```typescript
async function getStorageTrends(
  userId: string,
  period: 'day' | 'week' | 'month' | 'year'
): Promise<Result<StorageTrends>>
```

**Returns:**
```typescript
{
  timeline: {
    date: Timestamp;
    bytes: number;
  }[];
  growthRate: number; // bytes/day
  projection: {
    estimatedFullDate?: Timestamp;
    daysUntilFull?: number;
  };
  breakdown: {
    videoFiles: number;
    audioFiles: number;
    imageFiles: number;
    documentFiles: number;
    otherFiles: number;
    total: number;
  };
}
```

---

### `getQuotaAnalytics()`

Get quota usage and projection.

```typescript
async function getQuotaAnalytics(
  userId: string
): Promise<Result<QuotaAnalytics>>
```

**Returns:**
```typescript
{
  quotaBytes: number;
  usedBytes: number;
  availableBytes: number;
  usagePercentage: number;
  growthTrendDaily: number[];
  estimatedFullDate?: Timestamp;
  projectedUsageDate: Timestamp;
}
```

---

### `generateAnalyticsReport()`

Generate a comprehensive analytics report.

```typescript
async function generateAnalyticsReport(
  userId: string,
  period: ReportPeriod
): Promise<Result<AnalyticsReport>>
```

**Period Options:**
- `DAILY` - Last 24 hours
- `WEEKLY` - Last 7 days
- `MONTHLY` - Last 30 days
- `QUARTERLY` - Last 90 days
- `ANNUAL` - Last 365 days

**Returns:**
```typescript
{
  period: ReportPeriod;
  generatedDate: Timestamp;
  metrics: {
    uploadMetrics?: UploadMetrics;
    downloadMetrics?: DownloadMetrics;
    storageMetrics?: StorageTrends;
    quotaAnalytics?: QuotaAnalytics;
    fileStatistics?: FileStatistics;
  };
  insights: AnalyticsInsight[];
  recommendations: string[];
}
```

---

## Hook APIs

### `useAdvancedSharing(userId)`

State management for sharing operations.

```typescript
const {
  // State
  sharedFiles: File[];
  sharedAlbums: Album[];
  shareLinks: ShareLink[];
  isSharing: boolean;
  error: Error | null;
  invitations: SharingInvitation[];
  selectedFileForSharing: string | null;
  selectedAlbumForSharing: string | null;

  // Methods
  shareFile(): Promise<Result<FileSharing>>;
  createPublicShareLink(): Promise<Result<ShareLink>>;
  revokeLink(): Promise<Result<void>>;
  revokeFileAccess(): Promise<Result<void>>;
  getFileSharingInfo(): Promise<Result<FileSharingStatus>>;
  getShareAnalytics(): Promise<Result<ShareAnalytics>>;
  loadSharedFiles(): Promise<void>;
  acceptInvitation(): Promise<Result<FileSharing>>;
  inviteUser(): Promise<Result<SharingInvitation>>;
  clearError(): void;
} = useAdvancedSharing(userId);
```

---

### `useAnalytics(userId)`

State management for analytics operations.

```typescript
const {
  // State
  uploadMetrics: UploadMetrics | null;
  downloadMetrics: DownloadMetrics | null;
  storageMetrics: StorageTrends | null;
  quotaMetrics: QuotaAnalytics | null;
  fileStatistics: FileStatistics | null;
  report: AnalyticsReport | null;
  isLoading: boolean;
  error: Error | null;
  selectedPeriod: 'day' | 'week' | 'month' | 'year' | 'custom';
  dashboardConfig: DashboardConfig | null;

  // Methods
  loadAllMetrics(): Promise<void>;
  generateReport(): Promise<Result<AnalyticsReport>>;
  refreshMetrics(): Promise<void>;
  changePeriod(): Promise<void>;
  saveDashboardConfig(): void;
  addDashboardWidget(): void;
  removeDashboardWidget(): void;
  getInsights(): string[];
  getStorageSummary(): StorageSummary | null;
  clearError(): void;
} = useAnalytics(userId);
```

---

## Component APIs

### `<ShareDialog />`

Modal dialog for sharing files and albums.

```typescript
<ShareDialog
  visible={boolean}
  onClose={() => void}
  fileName={string}
  albumName={string}
  onShare={(request: SharingRequest) => void}
/>
```

**Props:**
- `visible` - Show/hide dialog
- `onClose` - Dialog closed callback
- `fileName` - File name (optional)
- `albumName` - Album name (optional)
- `onShare` - Share completed callback

---

### `<AnalyticsDashboard />`

Analytics dashboard with metric cards.

```typescript
<AnalyticsDashboard
  uploadMetrics={UploadMetrics | null}
  downloadMetrics={DownloadMetrics | null}
  storageMetrics={StorageTrends | null}
  quotaMetrics={QuotaAnalytics | null}
  fileStatistics={FileStatistics | null}
  insights={string[]}
  onRefresh={() => void}
  isLoading={boolean}
/>
```

**Props:**
- `*Metrics` - Metric data
- `insights` - Insight strings to display
- `onRefresh` - Refresh button callback
- `isLoading` - Loading state

---

### `<AnalyticsScreen />`

Full-page analytics interface with tabs.

```typescript
<AnalyticsScreen />
```

**Tabs:**
- Overview - Dashboard view
- Uploads - Upload statistics
- Downloads - Download statistics
- Storage - Quota and breakdown
- Reports - Report generation

---

## Type Definitions

### ShareLink

```typescript
interface ShareLink {
  id: string;
  fileId: string;
  userId: string;
  publicUrl: string;
  linkHash: string;
  expiresAt: Date;
  password?: string;
  createdAt: Date;
  revokedAt?: Date;
  accessCount: number;
}
```

### AccessLevel

```typescript
enum AccessLevel {
  VIEWER = 'viewer',      // Read-only
  EDITOR = 'editor',      // Read/Write
  ADMIN = 'admin',        // Manage permissions
  OWNER = 'owner'         // Full control
}
```

### FileSharing

```typescript
interface FileSharing {
  id: string;
  fileId: string;
  sharedWithEmail: string;
  accessLevel: AccessLevel;
  expiresAt?: Date;
  createdAt: Date;
  revokedAt?: Date;
}
```

### SharingInvitation

```typescript
interface SharingInvitation {
  id: string;
  fileId: string;
  recipientEmail: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  expiresAt: Date;
  createdAt: Date;
  acceptedAt?: Date;
}
```

### AnalyticsReport

```typescript
interface AnalyticsReport {
  id: string;
  userId: string;
  period: ReportPeriod;
  generatedDate: Date;
  metrics: {
    uploadMetrics?: UploadMetrics;
    downloadMetrics?: DownloadMetrics;
    storageMetrics?: StorageTrends;
    quotaAnalytics?: QuotaAnalytics;
    fileStatistics?: FileStatistics;
  };
  insights: AnalyticsInsight[];
  recommendations: string[];
}
```

---

## Error Codes

### Sharing Errors

| Code | Meaning |
|------|---------|
| `INVALID_FILE_ID` | File not found |
| `PERMISSION_DENIED` | Insufficient permissions |
| `SHARE_ALREADY_EXISTS` | Link already created |
| `INVALID_EMAIL` | Email format invalid |
| `USER_NOT_FOUND` | User doesn't exist |
| `FIRESTORE_ERROR` | Database error |
| `NETWORK_ERROR` | Network unavailable |

### Analytics Errors

| Code | Meaning |
|------|---------|
| `NO_DATA_AVAILABLE` | No metrics to display |
| `INVALID_PERIOD` | Invalid period specified |
| `QUERY_FAILED` | Failed to query Firestore |
| `CALCULATION_ERROR` | Metric calculation failed |

---

## Best Practices

1. **Always check Result<T> status** before accessing values
2. **Call clearError()** after displaying error messages
3. **Memoize callbacks** with useCallback to prevent re-renders
4. **Use auto-refresh** for real-time metrics (5-minute intervals)
5. **Handle async operations** with try-catch or Result types
6. **Clean up listeners** on component unmount

---

## Examples

See [PHASE10_QUICK_START.md](PHASE10_QUICK_START.md) for usage examples.
