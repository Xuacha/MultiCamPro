## PHASE 10: Quick Start Guide

**Status**: ✅ Complete and Production-Ready

This guide provides a quick overview of Phase 10 features and how to use them.

---

## Installation & Setup

### 1. Type System

All sharing and analytics types are pre-defined in `/src/types/`:

```typescript
import { ShareLink, AccessLevel } from '@/types/sharing';
import { AnalyticsReport, ReportPeriod } from '@/types/analytics';
```

### 2. Service Integration

Services are located in `/src/services/`:

```typescript
import { createShareLink, shareFileWithUser } from '@/services/sharing';
import { generateAnalyticsReport } from '@/services/analytics';
```

### 3. React Hooks

Use hooks for state management:

```typescript
import { useAdvancedSharing } from '@/hooks/useAdvancedSharing';
import { useAnalytics } from '@/hooks/useAnalytics';
```

---

## Core Features

### Sharing

#### Creating Public Share Links

```typescript
const { createPublicShareLink } = useAdvancedSharing(userId);

await createPublicShareLink(fileId, {
  expirationDays: 30,
  password: 'optional_password' // optional
});
```

#### Sharing with Users

```typescript
const { shareFile } = useAdvancedSharing(userId);

await shareFile(fileId, recipientEmail, AccessLevel.VIEWER);
```

**Permission Levels:**
- `VIEWER` - Read-only access
- `EDITOR` - Upload and modify
- `ADMIN` - Full management
- `OWNER` - Complete control

#### Revoking Access

```typescript
const { revokeLink, revokeFileAccess } = useAdvancedSharing(userId);

// Revoke public link
await revokeLink(shareUrl);

// Revoke user access
await revokeFileAccess(fileId, recipientEmail);
```

### Analytics

#### Loading Metrics

```typescript
const { loadAllMetrics } = useAnalytics(userId);

await loadAllMetrics('month'); // day | week | month | year
```

#### Accessing Metrics

```typescript
const {
  uploadMetrics,
  downloadMetrics,
  quotaMetrics,
  fileStatistics
} = useAnalytics(userId);

console.log('Success rate:', uploadMetrics?.statistics.successRate);
console.log('Storage used:', quotaMetrics?.usagePercentage);
```

#### Generating Reports

```typescript
const { generateReport } = useAnalytics(userId);

const result = await generateReport(ReportPeriod.MONTHLY);

if (result.ok && result.value) {
  console.log('Report:', result.value);
}
```

### UI Components

#### Share Dialog

```typescript
import { ShareDialog } from '@/components/ShareDialog';

<ShareDialog
  visible={isDialogOpen}
  onClose={() => setIsDialogOpen(false)}
  fileName="document.pdf"
  onShare={(request) => console.log(request)}
/>
```

#### Analytics Dashboard

```typescript
import { AnalyticsDashboard } from '@/components/AnalyticsDashboard';

<AnalyticsDashboard
  uploadMetrics={uploadMetrics}
  downloadMetrics={downloadMetrics}
  quotaMetrics={quotaMetrics}
  fileStatistics={fileStatistics}
  insights={insights}
  onRefresh={refreshMetrics}
  isLoading={isLoading}
/>
```

#### Analytics Screen (Full UI)

```typescript
import { AnalyticsScreen } from '@/screens/AnalyticsScreen';

// Use as a screen in your navigator
<Stack.Screen
  name="Analytics"
  component={AnalyticsScreen}
/>
```

---

## Common Usage Patterns

### Complete Sharing Workflow

```typescript
function ShareFileExample() {
  const { createPublicShareLink, revokeLink } = useAdvancedSharing(userId);
  const [shareLink, setShareLink] = useState(null);

  const handleCreateLink = async () => {
    const result = await createPublicShareLink(fileId, {
      expirationDays: 7
    });

    if (result.ok && result.value) {
      setShareLink(result.value.publicUrl);
    }
  };

  const handleRevoke = async () => {
    if (shareLink) {
      await revokeLink(shareLink);
      setShareLink(null);
    }
  };

  return (
    <View>
      <Button onPress={handleCreateLink} title="Create Link" />
      {shareLink && (
        <View>
          <Text>{shareLink}</Text>
          <Button onPress={handleRevoke} title="Revoke" />
        </View>
      )}
    </View>
  );
}
```

### analytics Dashboard Integration

```typescript
function AnalyticsDashboardExample() {
  const {
    uploadMetrics,
    quotaMetrics,
    isLoading,
    refreshMetrics,
    getInsights
  } = useAnalytics(userId);

  return (
    <AnalyticsDashboard
      uploadMetrics={uploadMetrics}
      quotaMetrics={quotaMetrics}
      insights={getInsights()}
      onRefresh={refreshMetrics}
      isLoading={isLoading}
    />
  );
}
```

---

## Firebase Collections

Phase 10 uses these Firestore collections:

### cloud_shares
Stores public share links:

```typescript
{
  id: string;
  fileId: string;
  userId: string;
  publicUrl: string;
  linkHash: string;
  expiresAt: Timestamp;
  password?: string;
  createdAt: Timestamp;
  revokedAt?: Timestamp;
}
```

### file_sharing
Stores file-level permissions:

```typescript
{
  id: string;
  fileId: string;
  sharedWithEmail: string;
  accessLevel: 'viewer' | 'editor' | 'admin';
  expiresAt?: Timestamp;
  createdAt: Timestamp;
  revokedAt?: Timestamp;
}
```

### sharing_activities
Stores activity audit log:

```typescript
{
  id: string;
  userId: string;
  activityType: string;
  targetId: string;
  metadata: {
    email?: string;
    permission?: string;
    shareUrl?: string;
  };
  timestamp: Timestamp;
}
```

---

## Error Handling

All operations return `Result<T>` types:

```typescript
const result = await createPublicShareLink(fileId, config);

if (result.ok && result.value) {
  // Success
  console.log('Link:', result.value.publicUrl);
} else {
  // Error
  console.error('Code:', result.error?.code);
  console.error('Message:', result.error?.message);
}
```

Available error codes:
- `INVALID_FILE_ID` - File not found
- `PERMISSION_DENIED` - Insufficient permissions
- `SHARE_ALREADY_EXISTS` - Share link already created
- `FIRESTORE_ERROR` - Database operation failed
- `NETWORK_ERROR` - Network connectivity issue

---

## Configuration & Customization

### Share Link Expiration

Default is 30 days, customizable:

```typescript
await createPublicShareLink(fileId, {
  expirationDays: 7  // 7 days
});
```

### Analytics Periods

Supported periods for queries:

```typescript
'day'    // Last 24 hours
'week'   // Last 7 days
'month'  // Last 30 days
'year'   // Last 365 days
```

### Report Formats

Extensible report generation:

```typescript
ReportPeriod.DAILY      // Daily report
ReportPeriod.WEEKLY     // Weekly report
ReportPeriod.MONTHLY    // Monthly report
ReportPeriod.QUARTERLY  // Quarterly report
ReportPeriod.ANNUAL     // Annual report
```

---

## Performance Tips

1. **Parallel Loading**: All metrics load in parallel automatically
2. **Auto-Refresh**: Metrics refresh every 5 minutes by default
3. **Memoization**: Insights calculated on-demand with useMemo
4. **Error Cleanup**: Always call `clearError()` after handling errors

---

## Testing

### Manual Testing Checklist

- [ ] Create public share link
- [ ] Share link is unique per file
- [ ] Share link expires correctly
- [ ] Password protection works
- [ ] Share with user sends invitation
- [ ] Permission levels respected
- [ ] Revoke link removes access
- [ ] View upload metrics
- [ ] View download metrics
- [ ] Generate and view reports
- [ ] Analytics dashboard displays
- [ ] Insights generated correctly

### Example Test Case

```typescript
async function testSharingFlow() {
  const userId = 'test-user-id';
  const fileId = 'test-file-id';

  // Create public link
  const { createPublicShareLink, revokeLink } = useAdvancedSharing(userId);
  const linkResult = await createPublicShareLink(fileId, {
    expirationDays: 30
  });

  assert(linkResult.ok === true);
  assert(linkResult.value?.publicUrl !== undefined);

  // Revoke link
  const revokeResult = await revokeLink(linkResult.value!.publicUrl);
  assert(revokeResult.ok === true);

  console.log('✅ Sharing flow test passed');
}
```

---

## Troubleshooting

### Share Link Not Created

Check:
1. User is authenticated
2. File exists and is owned by user
3. Firebase permissions allow write access

### Analytics Not Loading

Check:
1. User has upload/download history
2. Firebase collections are accessible
3. Network connection is active

### Permission Denied Errors

Verify:
1. User owns the file/album
2. Recipient email is valid
3. Access level is valid (VIEWER/EDITOR/ADMIN)

---

## Next Steps

1. Review [PHASE10_COMPLETE.md](PHASE10_COMPLETE.md) for detailed documentation
2. Check [PHASE10_SHARING_GUIDE.md](PHASE10_SHARING_GUIDE.md) for advanced sharing patterns
3. Read [PHASE10_ANALYTICS_GUIDE.md](PHASE10_ANALYTICS_GUIDE.md) for analytics deep dive
4. Review TypeScript types in `src/types/` for complete API reference

---

## Summary

Phase 10 provides:
- ✅ Production-ready sharing system with 4 permission levels
- ✅ Comprehensive analytics with real-time metrics
- ✅ Professional UI components with animations
- ✅ Complete type safety with TypeScript
- ✅ Error handling with Result<T> pattern
- ✅ Firebase integration ready for deployment

**Project Status**: 🎉 100% COMPLETE
