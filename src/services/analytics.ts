/**
 * Analytics Service for Phase 10
 * Complete implementation for tracking usage, bandwidth, storage, and user behavior
 */

import {
  collection,
  query,
  where,
  getDocs,
  setDoc,
  doc,
  updateDoc,
  Timestamp,
  limit,
  orderBy,
} from 'firebase/firestore';
import { firestore } from '@/config/firebase';
import {
  UploadMetrics,
  DownloadMetrics,
  StorageTrends,
  QuotaAnalytics,
  BandwidthMetrics,
  FileStatistics,
  FileTypeDistribution,
  UserActivityStatistics,
  AnalyticsReport,
  ReportPeriod,
  AnalyticsResult,
  AnalyticsInsight,
  InsightType,
  UploadStatistics,
  DownloadStatistics,
  PerformanceMetrics,
  UserSession,
} from '@/types/analytics';

/**
 * Analytics Service
 * Handles all analytics operations with Firebase
 */

/**
 * Get upload metrics for a user
 */
export async function getUploadMetrics(
  userId: string,
  period: 'day' | 'week' | 'month' | 'year' = 'month'
): Promise<AnalyticsResult<UploadMetrics>> {
  try {
    const now = Date.now();
    const periodMs = getPeriodMilliseconds(period);
    const startTime = now - periodMs;

    // Query upload tasks
    const q = query(
      collection(firestore, 'upload_tasks'),
      where('userId', '==', userId),
      where('completedAt', '>=', startTime),
      where('status', '==', 'completed')
    );

    const snapshot = await getDocs(q);
    const uploads = snapshot.docs.map(doc => doc.data());

    // Calculate statistics
    const totalUploads = uploads.length;
    const completedUploads = uploads.filter((u: any) => u.status === 'completed').length;
    const totalSize = uploads.reduce((sum: number, u: any) => sum + (u.totalSize || 0), 0);
    const avgSize = totalSize / Math.max(totalUploads, 1);

    const statistics: UploadStatistics = {
      totalUploads,
      successfulUploads: completedUploads,
      failedUploads: totalUploads - completedUploads,
      successRate: (completedUploads / Math.max(totalUploads, 1)) * 100,
      averageUploadSize: avgSize,
      largestUpload: Math.max(...uploads.map((u: any) => u.totalSize || 0), 0),
      totalUploaded: totalSize,
      averageUploadTime: uploads.reduce((sum: number, u: any) => 
        sum + ((u.completedAt || 0) - u.createdAt), 0) / Math.max(completedUploads, 1),
      totalUploadTime: uploads.reduce((sum: number, u: any) => 
        sum + ((u.completedAt || 0) - u.createdAt), 0),
    };

    const metrics: UploadMetrics = {
      userId,
      period,
      statistics,
      timeline: generateTimeline(uploads, period),
      averageBandwidth: statistics.totalUploadTime > 0 
        ? statistics.totalUploaded / (statistics.totalUploadTime / 1000)
        : 0,
      peakBandwidth: calculatePeakBandwidth(uploads),
      timestamp: now,
    };

    return { ok: true, value: metrics };
  } catch (error) {
    return {
      ok: false,
      error: {
        code: 'GET_UPLOAD_METRICS_FAILED',
        message: 'Failed to get upload metrics',
        name: 'AnalyticsError',
        retryable: true,
      },
    };
  }
}

/**
 * Get download metrics for a user
 */
export async function getDownloadMetrics(
  userId: string,
  period: 'day' | 'week' | 'month' | 'year' = 'month'
): Promise<AnalyticsResult<DownloadMetrics>> {
  try {
    const now = Date.now();
    const periodMs = getPeriodMilliseconds(period);
    const startTime = now - periodMs;

    // Query download tasks
    const q = query(
      collection(firestore, 'download_tasks'),
      where('userId', '==', userId),
      where('completedAt', '>=', startTime),
      where('status', '==', 'completed')
    );

    const snapshot = await getDocs(q);
    const downloads = snapshot.docs.map(doc => doc.data());

    // Calculate statistics
    const totalDownloads = downloads.length;
    const successfulDownloads = downloads.filter((d: any) => d.status === 'completed').length;
    const totalSize = downloads.reduce((sum: number, d: any) => sum + (d.size || 0), 0);
    const avgSize = totalSize / Math.max(totalDownloads, 1);

    const statistics: DownloadStatistics = {
      totalDownloads,
      successfulDownloads,
      failedDownloads: totalDownloads - successfulDownloads,
      successRate: (successfulDownloads / Math.max(totalDownloads, 1)) * 100,
      totalDownloaded: totalSize,
      averageDownloadSize: avgSize,
      largestDownload: Math.max(...downloads.map((d: any) => d.size || 0), 0),
      averageDownloadTime: downloads.reduce((sum: number, d: any) => 
        sum + ((d.completedAt || 0) - d.startedAt), 0) / Math.max(successfulDownloads, 1),
      totalDownloadTime: downloads.reduce((sum: number, d: any) => 
        sum + ((d.completedAt || 0) - d.startedAt), 0),
    };

    const metrics: DownloadMetrics = {
      userId,
      period,
      statistics,
      timeline: generateTimeline(downloads, period),
      averageBandwidth: statistics.totalDownloadTime > 0
        ? statistics.totalDownloaded / (statistics.totalDownloadTime / 1000)
        : 0,
      peakBandwidth: calculatePeakBandwidth(downloads),
      timestamp: now,
    };

    return { ok: true, value: metrics };
  } catch (error) {
    return {
      ok: false,
      error: {
        code: 'GET_DOWNLOAD_METRICS_FAILED',
        message: 'Failed to get download metrics',
        name: 'AnalyticsError',
        retryable: true,
      },
    };
  }
}

/**
 * Get storage trends for a user
 */
export async function getStorageTrends(
  userId: string,
  period: 'day' | 'week' | 'month' | 'year' = 'month'
): Promise<AnalyticsResult<StorageTrends>> {
  try {
    const now = Date.now();

    // Query user's cloud files
    const q = query(
      collection(firestore, 'cloud_files'),
      where('userId', '==', userId)
    );

    const snapshot = await getDocs(q);
    const files = snapshot.docs.map(doc => ({
      ...doc.data(),
      uploadedAt: doc.data().uploadedAt?.toMillis?.() || doc.data().uploadedAt,
    }));

    // Calculate breakdown
    const breakdown = calculateStorageBreakdown(files);

    // Calculate growth rate
    const periodMs = getPeriodMilliseconds(period);
    const startTime = now - periodMs;
    const recentFiles = files.filter((f: any) => f.uploadedAt >= startTime);
    const growthRate = breakdown.total / Math.max((periodMs / (24 * 60 * 60 * 1000)), 1);

    const trends: StorageTrends = {
      userId,
      period,
      timeline: generateStorageTimeline(files, period),
      breakdown,
      growthRate,
      projectedFull: now + (growthRate > 0 ? ((5 * 1024 * 1024 * 1024 - breakdown.total) / growthRate) * 1000 : 0),
      timestamp: now,
    };

    return { ok: true, value: trends };
  } catch (error) {
    return {
      ok: false,
      error: {
        code: 'GET_STORAGE_TRENDS_FAILED',
        message: 'Failed to get storage trends',
        name: 'AnalyticsError',
        retryable: true,
      },
    };
  }
}

/**
 * Get quota analytics for a user
 */
export async function getQuotaAnalytics(userId: string): Promise<AnalyticsResult<QuotaAnalytics>> {
  try {
    const now = Date.now();

    // Query user's files to calculate used quota
    const q = query(
      collection(firestore, 'cloud_files'),
      where('userId', '==', userId)
    );

    const snapshot = await getDocs(q);
    const files = snapshot.docs.map(doc => doc.data());
    const quotaUsed = files.reduce((sum: number, f: any) => sum + (f.size || 0), 0);

    const quotaAllocated = 5 * 1024 * 1024 * 1024; // 5GB default
    const quotaAvailable = Math.max(quotaAllocated - quotaUsed, 0);
    const usagePercentage = (quotaUsed / quotaAllocated) * 100;

    // Calculate growth trend
    const thirtyDaysAgo = now - (30 * 24 * 60 * 60 * 1000);
    const growthTrendDays = [];
    for (let i = 29; i >= 0; i--) {
      const dayStart = now - ((i + 1) * 24 * 60 * 60 * 1000);
      const dayEnd = now - (i * 24 * 60 * 60 * 1000);
      const dayFiles = files.filter((f: any) => 
        f.uploadedAt >= dayStart && f.uploadedAt <= dayEnd
      );
      const daySize = dayFiles.reduce((sum: number, f: any) => sum + (f.size || 0), 0);
      growthTrendDays.push((daySize / quotaAllocated) * 100);
    }

    const analytics: QuotaAnalytics = {
      userId,
      quotaAllocated,
      quotaUsed,
      quotaAvailable,
      usagePercentage,
      growthTrendDays,
      estimatedFullDate: usagePercentage > 0
        ? now + ((quotaAvailable / (quotaUsed / thirtyDaysAgo)) * (24 * 60 * 60 * 1000))
        : undefined,
      timestamp: now,
    };

    return { ok: true, value: analytics };
  } catch (error) {
    return {
      ok: false,
      error: {
        code: 'GET_QUOTA_ANALYTICS_FAILED',
        message: 'Failed to get quota analytics',
        name: 'AnalyticsError',
        retryable: true,
      },
    };
  }
}

/**
 * Get file statistics for a user
 */
export async function getFileStatistics(userId: string): Promise<AnalyticsResult<FileStatistics>> {
  try {
    // Query user's files
    const q = query(
      collection(firestore, 'cloud_files'),
      where('userId', '==', userId)
    );

    const snapshot = await getDocs(q);
    const files = snapshot.docs.map(doc => ({
      ...doc.data(),
      uploadedAt: doc.data().uploadedAt?.toMillis?.() || doc.data().uploadedAt,
    }));

    const totalFiles = files.length;
    const totalSize = files.reduce((sum: number, f: any) => sum + (f.size || 0), 0);
    const sizes = files.map((f: any) => f.size || 0).filter(s => s > 0);

    const statistics: FileStatistics = {
      totalFiles,
      totalSize,
      averageFileSize: totalSize / Math.max(totalFiles, 1),
      largestFile: Math.max(...sizes, 0),
      smallestFile: Math.min(...sizes, Infinity),
      fileTypeDistribution: calculateFileTypeDistribution(files),
      oldestFile: {
        fileId: files.reduce((oldest: any, f: any) => 
          !oldest || (f.uploadedAt < oldest.uploadedAt) ? f : oldest
        )?.id || '',
        uploadedAt: Math.min(...files.map((f: any) => f.uploadedAt || 0), Infinity),
      },
      newestFile: {
        fileId: files.reduce((newest: any, f: any) => 
          !newest || (f.uploadedAt > newest.uploadedAt) ? f : newest
        )?.id || '',
        uploadedAt: Math.max(...files.map((f: any) => f.uploadedAt || 0), 0),
      },
    };

    return { ok: true, value: statistics };
  } catch (error) {
    return {
      ok: false,
      error: {
        code: 'GET_FILE_STATISTICS_FAILED',
        message: 'Failed to get file statistics',
        name: 'AnalyticsError',
        retryable: true,
      },
    };
  }
}

/**
 * Generate analytics report
 */
export async function generateAnalyticsReport(
  userId: string,
  period: ReportPeriod = ReportPeriod.MONTHLY
): Promise<AnalyticsResult<AnalyticsReport>> {
  try {
    const now = Date.now();
    const startDate = now - getPeriodMilliseconds(period as any);
    const endDate = now;

    // Gather all metrics
    const uploadMetrics = await getUploadMetrics(userId, period as any);
    const downloadMetrics = await getDownloadMetrics(userId, period as any);
    const storageMetrics = await getStorageTrends(userId, period as any);
    const quotaMetrics = await getQuotaAnalytics(userId);
    const fileStatistics = await getFileStatistics(userId);

    const report: AnalyticsReport = {
      id: `report_${userId}_${now}`,
      userId,
      period: period as ReportPeriod,
      startDate,
      endDate,
      generatedAt: now,
      uploadMetrics: uploadMetrics.value || {} as UploadMetrics,
      downloadMetrics: downloadMetrics.value || {} as DownloadMetrics,
      storageMetrics: storageMetrics.value || {} as StorageTrends,
      quotaMetrics: quotaMetrics.value || {} as QuotaAnalytics,
      bandwidthMetrics: {} as BandwidthMetrics,
      fileStatistics: fileStatistics.value || {} as FileStatistics,
      fileAccessPatterns: {
        mostAccessedFiles: [],
        leastAccessedFiles: [],
        neverAccessedCount: 0,
        averageAccessPerFile: 0,
      },
      userActivity: {} as UserActivityStatistics,
      performanceMetrics: {} as PerformanceMetrics,
      keyInsights: generateInsights(
        uploadMetrics.value,
        downloadMetrics.value,
        quotaMetrics.value
      ),
      recommendations: generateRecommendations(
        uploadMetrics.value,
        downloadMetrics.value,
        quotaMetrics.value
      ),
    };

    // Save report
    await setDoc(doc(firestore, `analytics_reports/${report.id}`), {
      ...report,
      generatedAt: Timestamp.fromDate(new Date(now)),
      startDate: Timestamp.fromDate(new Date(startDate)),
      endDate: Timestamp.fromDate(new Date(endDate)),
    });

    return { ok: true, value: report };
  } catch (error) {
    return {
      ok: false,
      error: {
        code: 'GENERATE_REPORT_FAILED',
        message: 'Failed to generate analytics report',
        name: 'AnalyticsError',
        retryable: true,
      },
    };
  }
}

/**
 * Helper: Get milliseconds for a period
 */
function getPeriodMilliseconds(period: 'day' | 'week' | 'month' | 'year'): number {
  switch (period) {
    case 'day':
      return 24 * 60 * 60 * 1000;
    case 'week':
      return 7 * 24 * 60 * 60 * 1000;
    case 'month':
      return 30 * 24 * 60 * 60 * 1000;
    case 'year':
      return 365 * 24 * 60 * 60 * 1000;
    default:
      return 30 * 24 * 60 * 60 * 1000;
  }
}

/**
 * Helper: Generate timeline data
 */
function generateTimeline(data: any[], period: string) {
  const timeline = [];
  const now = Date.now();
  const periodMs = getPeriodMilliseconds(period as any);

  for (let i = 0; i < 30; i++) {
    const dayStart = now - ((i + 1) * 24 * 60 * 60 * 1000);
    const dayEnd = now - (i * 24 * 60 * 60 * 1000);

    const dayData = data.filter((d: any) => 
      (d.completedAt || d.createdAt) >= dayStart && 
      (d.completedAt || d.createdAt) <= dayEnd
    );

    timeline.push({
      timestamp: dayStart,
      value: dayData.reduce((sum: number, d: any) => sum + (d.totalSize || d.size || 0), 0),
    });
  }

  return timeline;
}

/**
 * Helper: Generate storage timeline
 */
function generateStorageTimeline(files: any[], period: string) {
  const timeline = [];
  const now = Date.now();

  for (let i = 0; i < 30; i++) {
    const dayStart = now - ((i + 1) * 24 * 60 * 60 * 1000);
    const dayEnd = now - (i * 24 * 60 * 60 * 1000);

    const dayFiles = files.filter((f: any) => f.uploadedAt <= dayEnd);
    const daySize = dayFiles.reduce((sum: number, f: any) => sum + (f.size || 0), 0);

    timeline.push({
      timestamp: dayStart,
      value: daySize,
    });
  }

  return timeline;
}

/**
 * Helper: Calculate peak bandwidth
 */
function calculatePeakBandwidth(data: any[]): number {
  let peakBandwidth = 0;

  for (let i = 0; i < data.length; i++) {
    const item = data[i];
    const duration = (item.completedAt || item.endedAt || 0) - (item.createdAt || item.startedAt || 0);
    const bandwidth = duration > 0 ? (item.totalSize || item.size || 0) / (duration / 1000) : 0;
    peakBandwidth = Math.max(peakBandwidth, bandwidth);
  }

  return peakBandwidth;
}

/**
 * Helper: Calculate storage breakdown
 */
function calculateStorageBreakdown(files: any[]): any {
  const breakdown = {
    videoFiles: 0,
    audioFiles: 0,
    imageFiles: 0,
    documentFiles: 0,
    otherFiles: 0,
    total: 0,
    byAlbum: {} as any,
  };

  files.forEach((f: any) => {
    const size = f.size || 0;
    const mimeType = f.mimeType || '';

    breakdown.total += size;

    if (mimeType.startsWith('video/')) {
      breakdown.videoFiles += size;
    } else if (mimeType.startsWith('audio/')) {
      breakdown.audioFiles += size;
    } else if (mimeType.startsWith('image/')) {
      breakdown.imageFiles += size;
    } else if (mimeType.startsWith('application/')) {
      breakdown.documentFiles += size;
    } else {
      breakdown.otherFiles += size;
    }

    // By album
    const albumId = f.albumId || 'unorganized';
    if (!breakdown.byAlbum[albumId]) {
      breakdown.byAlbum[albumId] = { size: 0, fileCount: 0 };
    }
    breakdown.byAlbum[albumId].size += size;
    breakdown.byAlbum[albumId].fileCount += 1;
  });

  return breakdown;
}

/**
 * Helper: Calculate file type distribution
 */
function calculateFileTypeDistribution(files: any[]): FileTypeDistribution {
  const distribution: FileTypeDistribution = {};
  const total = files.reduce((sum: number, f: any) => sum + (f.size || 0), 0);

  files.forEach((f: any) => {
    const mimeType = f.mimeType || 'unknown';
    if (!distribution[mimeType]) {
      distribution[mimeType] = { count: 0, totalSize: 0, percentage: 0 };
    }
    distribution[mimeType].count += 1;
    distribution[mimeType].totalSize += f.size || 0;
  });

  Object.keys(distribution).forEach(type => {
    distribution[type].percentage = (distribution[type].totalSize / Math.max(total, 1)) * 100;
  });

  return distribution;
}

/**
 * Helper: Generate insights
 */
function generateInsights(
  uploadMetrics: any,
  downloadMetrics: any,
  quotaMetrics: any
): string[] {
  const insights: string[] = [];

  if (uploadMetrics?.statistics?.successRate < 80) {
    insights.push('Your upload success rate is below 80%. Consider checking your network connection.');
  }

  if (quotaMetrics?.usagePercentage > 80) {
    insights.push('You are using over 80% of your storage quota. Consider upgrading your plan.');
  }

  if (uploadMetrics?.statistics?.totalUploads === 0) {
    insights.push('You have not uploaded any files yet. Get started by creating your first album!');
  }

  return insights;
}

/**
 * Helper: Generate recommendations
 */
function generateRecommendations(
  uploadMetrics: any,
  downloadMetrics: any,
  quotaMetrics: any
): string[] {
  const recommendations: string[] = [];

  if (uploadMetrics?.statistics?.averageUploadSize > 500 * 1024 * 1024) {
    recommendations.push('Consider compressing large files before uploading to save bandwidth.');
  }

  if (quotaMetrics?.usagePercentage > 70) {
    recommendations.push('Your storage is running low. Review and delete old files if needed.');
  }

  return recommendations;
}
