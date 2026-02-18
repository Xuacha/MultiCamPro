/**
 * Analytics Types for Phase 10
 * Complete type system for tracking usage, bandwidth, storage, and user behavior
 */

// ============================================================================
// METRIC TYPES
// ============================================================================

/**
 * Basic metric measurement
 */
export interface Metric {
  readonly timestamp: number;
  readonly value: number;
  readonly unit: string;
}

/**
 * Time-based metric
 */
export interface TimeSeriesMetric {
  readonly timestamp: number;
  readonly value: number;
  readonly average?: number;
  readonly min?: number;
  readonly max?: number;
  readonly count?: number;
}

// ============================================================================
// UPLOAD ANALYTICS
// ============================================================================

/**
 * Upload statistics
 */
export interface UploadStatistics {
  readonly totalUploads: number;
  readonly successfulUploads: number;
  readonly failedUploads: number;
  readonly successRate: number; // Percentage 0-100
  readonly averageUploadSize: number; // Bytes
  readonly largestUpload: number; // Bytes
  readonly totalUploaded: number; // Bytes
  readonly averageUploadTime: number; // Milliseconds
  readonly totalUploadTime: number; // Milliseconds
}

/**
 * Upload metrics over time
 */
export interface UploadMetrics {
  readonly userId: string;
  readonly period: 'day' | 'week' | 'month' | 'year';
  readonly statistics: UploadStatistics;
  readonly timeline: TimeSeriesMetric[]; // Hourly/daily data
  readonly topUploadHours?: number[]; // Hour 0-23
  readonly averageBandwidth: number; // Bytes/second
  readonly peakBandwidth: number; // Bytes/second
  readonly timestamp: number;
}

/**
 * Upload failure analysis
 */
export interface UploadFailureAnalysis {
  readonly totalFailures: number;
  readonly failureTypes: {
    readonly networkError: number;
    readonly quotaExceeded: number;
    readonly permission: number;
    readonly fileCorrupted: number;
    readonly timeout: number;
    readonly other: number;
  };
  readonly mostCommonReason: string;
  readonly affectedUsers: number;
}

// ============================================================================
// DOWNLOAD ANALYTICS
// ============================================================================

/**
 * Download statistics
 */
export interface DownloadStatistics {
  readonly totalDownloads: number;
  readonly successfulDownloads: number;
  readonly failedDownloads: number;
  readonly successRate: number; // Percentage 0-100
  readonly totalDownloaded: number; // Bytes
  readonly averageDownloadSize: number; // Bytes
  readonly largestDownload: number; // Bytes
  readonly averageDownloadTime: number; // Milliseconds
  readonly totalDownloadTime: number; // Milliseconds
}

/**
 * Download metrics over time
 */
export interface DownloadMetrics {
  readonly userId: string;
  readonly period: 'day' | 'week' | 'month' | 'year';
  readonly statistics: DownloadStatistics;
  readonly timeline: TimeSeriesMetric[];
  readonly topDownloadHours?: number[];
  readonly averageBandwidth: number; // Bytes/second
  readonly peakBandwidth: number; // Bytes/second
  readonly timestamp: number;
}

// ============================================================================
// STORAGE ANALYTICS
// ============================================================================

/**
 * Storage usage breakdown
 */
export interface StorageBreakdown {
  readonly videoFiles: number; // Bytes
  readonly audioFiles: number; // Bytes
  readonly imageFiles: number; // Bytes
  readonly documentFiles: number; // Bytes
  readonly otherFiles: number; // Bytes
  readonly total: number; // Bytes
  readonly byAlbum: {
    readonly [albumId: string]: {
      readonly size: number;
      readonly fileCount: number;
    };
  };
}

/**
 * Storage trends over time
 */
export interface StorageTrends {
  readonly userId: string;
  readonly period: 'day' | 'week' | 'month' | 'year';
  readonly timeline: TimeSeriesMetric[]; // Daily storage usage
  readonly breakdown: StorageBreakdown;
  readonly growthRate: number; // Bytes/day
  readonly projectedFull: number; // Estimated timestamp when quota full
  readonly timestamp: number;
}

/**
 * Quota usage analytics
 */
export interface QuotaAnalytics {
  readonly userId: string;
  readonly quotaAllocated: number; // Bytes
  readonly quotaUsed: number; // Bytes
  readonly quotaAvailable: number; // Bytes
  readonly usagePercentage: number; // 0-100
  readonly growthTrendDays: number[]; // % growth per day
  readonly estimatedFullDate?: number; // Timestamp
  readonly timestamp: number;
}

// ============================================================================
// BANDWIDTH ANALYTICS
// ============================================================================

/**
 * Bandwidth statistics
 */
export interface BandwidthStatistics {
  readonly uploadBandwidth: number; // Bytes/second
  readonly downloadBandwidth: number; // Bytes/second
  readonly totalBandwidth: number; // Bytes/second
  readonly peakBandwidth: number; // Bytes/second
  readonly averageBandwidth: number; // Bytes/second
  readonly totalDataTransferred: number; // Bytes
}

/**
 * Bandwidth metrics over time
 */
export interface BandwidthMetrics {
  readonly userId: string;
  readonly period: 'day' | 'week' | 'month' | 'year';
  readonly statistics: BandwidthStatistics;
  readonly timeline: TimeSeriesMetric[];
  readonly peakHours: number[];
  readonly timestamp: number;
}

// ============================================================================
// FILE ANALYTICS
// ============================================================================

/**
 * File type distribution
 */
export interface FileTypeDistribution {
  readonly [mimeType: string]: {
    readonly count: number;
    readonly totalSize: number;
    readonly percentage: number; // 0-100
  };
}

/**
 * File statistics
 */
export interface FileStatistics {
  readonly totalFiles: number;
  readonly totalSize: number; // Bytes
  readonly averageFileSize: number; // Bytes
  readonly largestFile: number; // Bytes
  readonly smallestFile: number; // Bytes
  readonly fileTypeDistribution: FileTypeDistribution;
  readonly oldestFile: {
    readonly fileId: string;
    readonly uploadedAt: number;
  };
  readonly newestFile: {
    readonly fileId: string;
    readonly uploadedAt: number;
  };
}

/**
 * File access patterns
 */
export interface FileAccessPatterns {
  readonly mostAccessedFiles: Array<{
    readonly fileId: string;
    readonly accessCount: number;
  }>;
  readonly leastAccessedFiles: Array<{
    readonly fileId: string;
    readonly accessCount: number;
  }>;
  readonly neverAccessedCount: number;
  readonly averageAccessPerFile: number;
}

// ============================================================================
// USER ACTIVITY ANALYTICS
// ============================================================================

/**
 * User session information
 */
export interface UserSession {
  readonly sessionId: string;
  readonly userId: string;
  readonly startedAt: number;
  readonly endedAt?: number;
  readonly duration: number; // Milliseconds
  readonly actions: number;
  readonly lastActivityAt: number;
}

/**
 * User activity statistics
 */
export interface UserActivityStatistics {
  readonly userId: string;
  readonly activeDays: number; // Days with activity
  readonly totalSessions: number;
  readonly averageSessionDuration: number; // Milliseconds
  readonly totalActiveTime: number; // Milliseconds
  readonly actionCount: number;
  readonly actionsPerDay: number;
}

/**
 * Daily active users metric
 */
export interface DailyActiveUsers {
  readonly timestamp: number; // Date start
  readonly activeUsers: number;
  readonly newUsers: number;
  readonly returningUsers: number;
  readonly churnedUsers: number;
}

/**
 * User cohort analysis
 */
export interface UserCohort {
  readonly cohortId: string;
  readonly createdAt: number;
  readonly cohortSize: number;
  readonly retentionByDay: {
    readonly [day: number]: {
      readonly count: number;
      readonly percentage: number;
    };
  };
  readonly metrics: {
    readonly firstWeekRetention: number;
    readonly firstMonthRetention: number;
    readonly qualityScore: number; // 0-100
  };
}

// ============================================================================
// PERFORMANCE ANALYTICS
// ============================================================================

/**
 * Performance metrics
 */
export interface PerformanceMetrics {
  readonly userId: string;
  readonly uploadSpeed: number; // Bytes/second
  readonly downloadSpeed: number; // Bytes/second
  readonly uploadLatency: number; // Milliseconds
  readonly downloadLatency: number; // Milliseconds
  readonly timestamp: number;
}

/**
 * System health metrics
 */
export interface SystemHealthMetrics {
  readonly timestamp: number;
  readonly cpuUsage: number; // Percentage 0-100
  readonly memoryUsage: number; // Percentage 0-100
  readonly diskUsage: number; // Percentage 0-100
  readonly networkLatency: number; // Milliseconds
  readonly errorRate: number; // Percentage 0-100
  readonly availabilityUptime: number; // Percentage 0-100
}

// ============================================================================
// REPORT TYPES
// ============================================================================

/**
 * Analytics report period
 */
export enum ReportPeriod {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  ANNUAL = 'annual',
  CUSTOM = 'custom',
}

/**
 * Analytics report
 */
export interface AnalyticsReport {
  readonly id: string;
  readonly userId: string;
  readonly period: ReportPeriod;
  readonly startDate: number;
  readonly endDate: number;
  readonly generatedAt: number;
  readonly uploadMetrics: UploadMetrics;
  readonly downloadMetrics: DownloadMetrics;
  readonly storageMetrics: StorageTrends;
  readonly quotaMetrics: QuotaAnalytics;
  readonly bandwidthMetrics: BandwidthMetrics;
  readonly fileStatistics: FileStatistics;
  readonly fileAccessPatterns: FileAccessPatterns;
  readonly userActivity: UserActivityStatistics;
  readonly performanceMetrics: PerformanceMetrics;
  readonly keyInsights: string[]; // AI-generated insights
  readonly recommendations: string[]; // Usage recommendations
}

/**
 * Custom dashboard configuration
 */
export interface DashboardConfig {
  readonly userId: string;
  readonly widgets: DashboardWidget[];
  readonly layout: 'grid' | 'list' | 'compact';
  readonly refreshInterval: number; // Milliseconds
  readonly autoRefresh: boolean;
  readonly dateRange: {
    readonly startDate: number;
    readonly endDate: number;
  };
  readonly savedAt: number;
}

/**
 * Dashboard widget configuration
 */
export interface DashboardWidget {
  readonly id: string;
  readonly type: 'metric' | 'chart' | 'table' | 'gauge' | 'timeline';
  readonly dataSource: string; // Metric type
  readonly position: {
    readonly x: number;
    readonly y: number;
    readonly width: number;
    readonly height: number;
  };
  readonly settings?: Record<string, any>;
  readonly isVisible: boolean;
}

// ============================================================================
// INSIGHT TYPES
// ============================================================================

/**
 * Generated insight from analytics
 */
export interface AnalyticsInsight {
  readonly id: string;
  readonly userId: string;
  readonly type: 'trend' | 'anomaly' | 'recommendation' | 'warning';
  readonly title: string;
  readonly description: string;
  readonly metric: string; // Which metric this relates to
  readonly value?: number;
  readonly previousValue?: number;
  readonly percentChange?: number;
  readonly severity: 'info' | 'warning' | 'critical';
  readonly generatedAt: number;
  readonly actionable: boolean;
  readonly suggestedAction?: string;
}

/**
 * Analytics comparison (e.g., this month vs last month)
 */
export interface AnalyticsComparison {
  readonly metric: string;
  readonly current: number;
  readonly previous: number;
  readonly change: number;
  readonly percentChange: number;
  readonly trend: 'up' | 'down' | 'stable';
}

// ============================================================================
// EXPORT AND RESULT TYPES
// ============================================================================

/**
 * Analytics result wrapper
 */
export interface AnalyticsResult<T> {
  readonly ok: boolean;
  readonly value?: T;
  readonly error?: AnalyticsError;
}

/**
 * Analytics error
 */
export interface AnalyticsError extends Error {
  readonly code: string;
  readonly message: string;
  readonly retryable: boolean;
}

/**
 * Exportable analytics report format
 */
export interface ExportableReport {
  readonly format: 'pdf' | 'csv' | 'json' | 'excel';
  readonly report: AnalyticsReport;
  readonly fileName: string;
  readonly generatedAt: number;
}

// ============================================================================
// EXPORT TYPES
// ============================================================================

export type MetricType = 
  | 'uploads'
  | 'downloads'
  | 'storage'
  | 'bandwidth'
  | 'files'
  | 'users'
  | 'performance';

export type InsightType = 'trend' | 'anomaly' | 'recommendation' | 'warning';
export type WidgetType = 'metric' | 'chart' | 'table' | 'gauge' | 'timeline';
