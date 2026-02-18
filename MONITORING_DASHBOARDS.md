# 📊 PRODUCTION MONITORING & DASHBOARDS

**Project**: MultiCamPro v1.0.0  
**Environment**: Production

---

## Monitoring Architecture

### Real-Time Metrics Collection

```
┌─────────────────────┐
│  Mobile App         │  Firebase
│  (iOS/Android)      │  Analytics  → Google Analytics 4
├─────────────────────┤      ↓
│  Backend Server     │  Events → Firestore (events collection)
│  (Node.js/Express)  │      ↓
└────────────┬────────┘  Performance Monitoring
             │
      Firebase SDK
             │
    ┌────────┴─────────────┬───────────────┐
    ↓                      ↓               ↓
Firebase            Firebase          Google
Crashlytics      Performance      Analytics 4
(Errors)         (Performance)     (Behavior)
    |                    |               |
    └────────────────────┴───────────────┘
                         ↓
                  Monitoring
                   Dashboard
```

---

## Firebase Crashlytics Setup

### Configuration

Enable in `src/config/firebase.ts`:

```typescript
import { initializeApp } from 'firebase/app';
import { initializeFirebaseRemoteConfig } from './remoteConfig';
import { initializeAnalytics } from './analytics';

// Crashlytics is auto-initialized by Firebase SDK
const app = initializeApp(firebaseConfig);

// Force-enable Crashlytics in production
if (process.env.APP_ENV === 'production') {
  // Crashlytics auto-initialization handled
  console.log('[Crashlytics] Enabled for production');
}

export { app };
```

### Error Logging Service

Create `src/services/errorTracking.ts`:

```typescript
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

interface ErrorLog {
  timestamp: any;
  userId: string;
  errorMessage: string;
  errorStack: string;
  userAgent?: string;
  currentUrl?: string;
  appVersion: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  context?: Record<string, any>;
}

export const logError = async (
  error: Error,
  severity: 'low' | 'medium' | 'high' | 'critical' = 'high'
): Promise<void> => {
  try {
    const db = getFirestore();
    const auth = getAuth();
    const user = auth.currentUser;

    const errorLog: ErrorLog = {
      timestamp: serverTimestamp(),
      userId: user?.uid || 'anonymous',
      errorMessage: error.message,
      errorStack: error.stack || '',
      appVersion: process.env.APP_VERSION || '1.0.0',
      severity,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
      currentUrl: typeof window !== 'undefined' ? window.location.href : undefined,
    };

    await addDoc(collection(db, 'error_logs'), errorLog);
  } catch (err) {
    // Silent fail - don't crash due to logging error
    console.error('[ErrorTracking] Failed to log error:', err);
  }
};

// Global error handler
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    logError(event.error, 'critical');
  });

  window.addEventListener('unhandledrejection', (event) => {
    logError(
      new Error(`Unhandled Promise Rejection: ${event.reason}`),
      'critical'
    );
  });
}
```

---

## Performance Monitoring

### Firebase Performance Monitoring Setup

```typescript
// src/services/performanceMonitoring.ts
import { initializePerformanceMonitoring, trace } from 'firebase/performance';
import { initializeApp } from 'firebase/app';

const initPerformanceMonitoring = (app: any) => {
  if (process.env.APP_ENV === 'production') {
    const perf = initializePerformanceMonitoring(app);
    console.log('[Performance] Monitoring initialized');
    return perf;
  }
};

// Track specific operations
export const trackAsyncOperation = async <T>(
  operationName: string,
  operation: () => Promise<T>
): Promise<T> => {
  const t = trace(operationName);
  t.start();
  try {
    const result = await operation();
    return result;
  } finally {
    t.stop();
  }
};

// Usage in services:
export const getUploadMetrics = async (userId: string) => {
  return trackAsyncOperation('getUploadMetrics', async () => {
    // actual operation
  });
};
```

---

## Google Analytics 4 Events

### Event Tracking Configuration

```typescript
// src/services/analytics.ts
import { getAnalytics, logEvent } from 'firebase/analytics';
import { getApp } from 'firebase/app';

const analytics = getAnalytics(getApp());

export const trackEvent = (eventName: string, params?: any) => {
  if (process.env.ENABLE_ANALYTICS === 'true') {
    logEvent(analytics, eventName, params);
  }
};

// Event definitions
export const ANALYTICS_EVENTS = {
  // User
  USER_SIGNED_UP: 'user_signed_up',
  USER_LOGGED_IN: 'user_logged_in',
  USER_LOGGED_OUT: 'user_logged_out',

  // Content
  VIDEO_UPLOADED: 'video_uploaded',
  VIDEO_DOWNLOADED: 'video_downloaded',
  VIDEO_SHARED: 'video_shared',

  // Features
  SHARING_LINK_CREATED: 'sharing_link_created',
  SHARING_INVITE_SENT: 'sharing_invite_sent',
  SHARING_PERMISSION_CHANGED: 'sharing_permission_changed',

  // Analytics
  REPORT_GENERATED: 'report_generated',
  DASHBOARD_VIEWED: 'dashboard_viewed',

  // Performance
  PAGE_LOAD_TIME: 'page_load_time',
  API_CALL_TIME: 'api_call_time',
};

// Usage:
export const logVideoUpload = (videoSize: number, duration: number) => {
  trackEvent(ANALYTICS_EVENTS.VIDEO_UPLOADED, {
    video_size: videoSize,
    duration_seconds: duration,
    timestamp: new Date().toISOString(),
  });
};
```

### Critical Events to Track

```typescript
// High-priority events for monitoring
const CRITICAL_EVENTS = [
  'video_upload_failure',
  'sharing_permission_denied',
  'authentication_failure',
  'payment_failure',
  'quota_exceeded',
  'sync_failure',
  'export_failure',
];

const HIGH_PRIORITY_EVENTS = [
  'video_uploaded',
  'sharing_link_created',
  'report_generated',
  'settings_changed',
  'storage_limit_approaching',
];
```

---

## Firestore Monitoring Collection

### Error Collection Schema

```
collection: error_logs
├── errorId (auto-generated)
├── timestamp (server)
├── userId (string)
├── errorMessage (string)
├── errorStack (string)
├── severity (string: low|medium|high|critical)
├── appVersion (string)
├── userAgent (string)
├── currentUrl (string)
└── context (map)
```

### Performance Collection Schema

```
collection: performance_traces
├── traceId (auto-generated)
├── traceName (string)
├── startTime (timestamp)
├── endTime (timestamp)
├── duration (number)
├── userId (string)
└── attributes (map)
```

### Custom Events Collection Schema

```
collection: analytics_events
├── eventId (auto-generated)
├── eventName (string)
├── timestamp (server)
├── userId (string)
├── sessionId (string)
├── properties (map)
└── source (string: mobile|web)
```

---

## Monitoring Dashboard Components

### Real-Time Dashboard (Firebase Console)

**Crashlytics View**
- Crash-free users percentage (target: > 99.8%)
- Top crashes in last 24h
- Crash trends (7-day, 30-day)
- Affected users count
- Crash details with stack trace

**Performance View**
- App startup time (target: < 2s)
- Page load time (target: < 1s)
- Network request time (target: < 500ms)
- Screen rendering time (target: < 16ms)
- Memory usage (target: < 100MB)

**Analytics View**
- Daily active users (DAU)
- Monthly active users (MAU)
- User retention rates
- Top events
- User demographics
- Device types and OS versions

---

## Monitoring Alerts

### Alert Configuration

```typescript
// src/config/monitoringAlerts.ts

interface AlertConfig {
  name: string;
  metric: string;
  threshold: number;
  comparison: 'greater_than' | 'less_than' | 'equals';
  duration: number; // seconds
  action: 'notify' | 'escalate' | 'auto_remediate';
}

export const ALERT_CONFIGS: AlertConfig[] = [
  {
    name: 'High Error Rate',
    metric: 'error_rate_percentage',
    threshold: 1,
    comparison: 'greater_than',
    duration: 300, // 5 minutes
    action: 'escalate',
  },
  {
    name: 'Slow API Response',
    metric: 'api_response_time',
    threshold: 2000, // 2 seconds
    comparison: 'greater_than',
    duration: 600, // 10 minutes
    action: 'notify',
  },
  {
    name: 'High Memory Usage',
    metric: 'memory_usage_mb',
    threshold: 200,
    comparison: 'greater_than',
    duration: 300,
    action: 'auto_remediate',
  },
  {
    name: 'Database Connection Pool Exhausted',
    metric: 'db_connection_available',
    threshold: 5,
    comparison: 'less_than',
    duration: 60,
    action: 'escalate',
  },
  {
    name: 'Crash Rate Critical',
    metric: 'crash_free_users_percentage',
    threshold: 98,
    comparison: 'less_than',
    duration: 600,
    action: 'escalate',
  },
];
```

### Notification Channels

**Slack Integration**
```typescript
// src/services/notifications.ts
const notifySlack = async (
  channel: string,
  message: string,
  severity: 'low' | 'medium' | 'high' | 'critical'
) => {
  const color =
    severity === 'critical' ? '#FF0000' :
    severity === 'high' ? '#FF9900' :
    severity === 'medium' ? '#FFFF00' :
    '#00FF00';

  const response = await fetch(process.env.SLACK_WEBHOOK_URL!, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      attachments: [{
        color,
        title: `[${severity.toUpperCase()}] ${message}`,
        ts: Math.floor(Date.now() / 1000),
      }],
    }),
  });

  return response.ok;
};
```

**Email Alerts**
```typescript
const notifyEmail = async (
  recipients: string[],
  subject: string,
  message: string
) => {
  // Send via SendGrid, AWS SES, or similar
  await sendEmailAlert({
    to: recipients,
    subject,
    body: message,
  });
};
```

---

## Health Check Endpoints

### Backend Health Check (`/health`)

```typescript
// Backend route
app.get('/health', async (req, res) => {
  const health = {
    status: 'up',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    checks: {
      database: await checkDatabaseHealth(),
      firebase: await checkFirebaseHealth(),
      external_apis: await checkExternalAPIs(),
    },
  };

  res.json(health);
});
```

### Metrics Endpoint (`/metrics`)

```typescript
// Expose Prometheus-style metrics
app.get('/metrics', (req, res) => {
  res.set('Content-Type', 'text/plain');
  res.send(`
# HELP requests_total Total requests processed
# TYPE requests_total counter
requests_total{method="GET"} ${getMetric.total}
requests_total{method="POST"} ${postMetric.total}

# HELP errors_total Total errors
# TYPE errors_total counter
errors_total${errorMetric.total}

# HELP response_time_ms Response time in milliseconds
# TYPE response_time_ms histogram
response_time_ms_bucket{le="100"} ${responseTime.bucket100}
response_time_ms_bucket{le="500"} ${responseTime.bucket500}
response_time_ms_bucket{le="1000"} ${responseTime.bucket1000}
response_time_ms_bucket{le="+Inf"} ${responseTime.bucketInf}
  `);
});
```

---

## Production Monitoring Schedule

### Hourly
- [ ] Check error rates (target: < 0.1%)
- [ ] Verify no critical alerts
- [ ] Monitor API response times
- [ ] Check server resource usage

### Daily
- [ ] Review crash logs
- [ ] Check performance metrics
- [ ] Review user feedback
- [ ] Verify backup completion
- [ ] Check storage usage

### Weekly
- [ ] Analyze usage trends
- [ ] Review cost metrics
- [ ] Check security logs
- [ ] Generate performance report
- [ ] Plan optimizations

### Monthly
- [ ] Full performance review
- [ ] Security audit
- [ ] Capacity planning
- [ ] Cost analysis
- [ ] User satisfaction review

---

## Dashboard URLs

Once deployed, access:

- **Firebase Crashlytics**: `https://console.firebase.google.com/project/[PROJECT-ID]/crashlytics`
- **Firebase Performance**: `https://console.firebase.google.com/project/[PROJECT-ID]/performance`
- **Google Analytics 4**: `https://analytics.google.com/analytics/web/#/`
- **Custom Dashboards**: To be created in your preferred tool (Grafana, etc.)

---

**Status**: ✅ Monitoring Ready  
**Last Updated**: February 17, 2026
