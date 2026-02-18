/**
 * Analytics Hook for Phase 10
 * React hook for managing analytics data and reports
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  getUploadMetrics,
  getDownloadMetrics,
  getStorageTrends,
  getQuotaAnalytics,
  getFileStatistics,
  generateAnalyticsReport,
} from '@/services/analytics';
import {
  UploadMetrics,
  DownloadMetrics,
  StorageTrends,
  QuotaAnalytics,
  FileStatistics,
  AnalyticsReport,
  ReportPeriod,
  DashboardConfig,
  DashboardWidget,
  AnalyticsResult,
} from '@/types/analytics';

/**
 * useAnalytics Hook
 * Manages analytics data and report generation
 */
export function useAnalytics(userId: string) {
  const [uploadMetrics, setUploadMetrics] = useState<UploadMetrics | null>(null);
  const [downloadMetrics, setDownloadMetrics] = useState<DownloadMetrics | null>(null);
  const [storageMetrics, setStorageMetrics] = useState<StorageTrends | null>(null);
  const [quotaMetrics, setQuotaMetrics] = useState<QuotaAnalytics | null>(null);
  const [fileStatistics, setFileStatistics] = useState<FileStatistics | null>(null);
  const [report, setReport] = useState<AnalyticsReport | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<'day' | 'week' | 'month' | 'year' | 'custom'>('month');
  const [dashboardConfig, setDashboardConfig] = useState<DashboardConfig | null>(null);

  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const metricsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Load all metrics
   */
  const loadAllMetrics = useCallback(
    async (period: 'day' | 'week' | 'month' | 'year' = 'month') => {
      setIsLoading(true);
      setError(null);

      try {
        // Load all metrics in parallel
        const [uploads, downloads, storage, quota, files] = await Promise.all([
          getUploadMetrics(userId, period),
          getDownloadMetrics(userId, period),
          getStorageTrends(userId, period),
          getQuotaAnalytics(userId),
          getFileStatistics(userId),
        ]);

        if (uploads.ok && uploads.value) setUploadMetrics(uploads.value);
        if (downloads.ok && downloads.value) setDownloadMetrics(downloads.value);
        if (storage.ok && storage.value) setStorageMetrics(storage.value);
        if (quota.ok && quota.value) setQuotaMetrics(quota.value);
        if (files.ok && files.value) setFileStatistics(files.value);

        // Handle any errors
        if (!uploads.ok) setError(new Error(uploads.error?.message));
        if (!downloads.ok) setError(new Error(downloads.error?.message));
        if (!storage.ok) setError(new Error(storage.error?.message));
        if (!quota.ok) setError(new Error(quota.error?.message));
        if (!files.ok) setError(new Error(files.error?.message));
      } catch (err) {
        const error = err as Error;
        setError(error);
      } finally {
        setIsLoading(false);
      }
    },
    [userId]
  );

  /**
   * Generate analytics report
   */
  const generateReport = useCallback(async (period: ReportPeriod = ReportPeriod.MONTHLY) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await generateAnalyticsReport(userId, period);

      if (result.ok && result.value) {
        setReport(result.value);
        return result;
      } else {
        setError(new Error(result.error?.message));
        return result;
      }
    } catch (err) {
      const error = err as Error;
      setError(error);
      return {
        ok: false,
        error: {
          code: 'GENERATE_REPORT_ERROR',
          message: error.message,
          name: 'AnalyticsError',
          retryable: true,
        },
      };
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  /**
   * Refresh metrics
   */
  const refreshMetrics = useCallback(async () => {
    await loadAllMetrics(selectedPeriod as any);
  }, [loadAllMetrics, selectedPeriod]);

  /**
   * Change period and reload
   */
  const changePeriod = useCallback(async (newPeriod: typeof selectedPeriod) => {
    setSelectedPeriod(newPeriod);
    if (newPeriod !== 'custom') {
      await loadAllMetrics(newPeriod as any);
    }
  }, [loadAllMetrics]);

  /**
   * Save dashboard configuration
   */
  const saveDashboardConfig = useCallback((config: DashboardConfig) => {
    setDashboardConfig(config);
    // In real app, would persist to Firebase
  }, []);

  /**
   * Add widget to dashboard
   */
  const addDashboardWidget = useCallback((widget: DashboardWidget) => {
    setDashboardConfig(prev => {
      if (!prev) return null;
      return {
        ...prev,
        widgets: [...prev.widgets, widget],
      };
    });
  }, []);

  /**
   * Remove dashboard widget
   */
  const removeDashboardWidget = useCallback((widgetId: string) => {
    setDashboardConfig(prev => {
      if (!prev) return null;
      return {
        ...prev,
        widgets: prev.widgets.filter(w => w.id !== widgetId),
      };
    });
  }, []);

  /**
   * Get insights from metrics
   */
  const getInsights = useCallback(() => {
    const insights: string[] = [];

    if (quotaMetrics) {
      if (quotaMetrics.usagePercentage > 80) {
        insights.push(`⚠️ Storage usage: ${quotaMetrics.usagePercentage.toFixed(1)}% - Consider upgrading`);
      }

      if (quotaMetrics.estimatedFullDate) {
        const daysUntilFull = Math.ceil(
          (quotaMetrics.estimatedFullDate - Date.now()) / (24 * 60 * 60 * 1000)
        );
        if (daysUntilFull > 0 && daysUntilFull <= 7) {
          insights.push(`⚠️ Storage will be full in ${daysUntilFull} days`);
        }
      }
    }

    if (uploadMetrics?.statistics) {
      if (uploadMetrics.statistics.successRate < 80) {
        insights.push(`⚠️ Upload success rate: ${uploadMetrics.statistics.successRate.toFixed(1)}%`);
      }
      
      if (uploadMetrics.statistics.totalUploads === 0) {
        insights.push('ℹ️ You haven\'t uploaded any files yet');
      }
    }

    if (fileStatistics) {
      if (fileStatistics.totalFiles === 0) {
        insights.push('ℹ️ Your cloud storage is empty');
      }

      const largeFiles = fileStatistics.largestFile / (1024 * 1024 * 1024);
      if (largeFiles > 1) {
        insights.push(`📦 Largest file: ${largeFiles.toFixed(2)} GB`);
      }
    }

    return insights;
  }, [quotaMetrics, uploadMetrics, fileStatistics]);

  /**
   * Get storage breakdown summary
   */
  const getStorageSummary = useCallback(() => {
    if (!storageMetrics?.breakdown) return null;

    const { breakdown } = storageMetrics;
    const total = breakdown.total;

    return {
      total,
      video: {
        bytes: breakdown.videoFiles,
        percentage: (breakdown.videoFiles / Math.max(total, 1)) * 100,
      },
      audio: {
        bytes: breakdown.audioFiles,
        percentage: (breakdown.audioFiles / Math.max(total, 1)) * 100,
      },
      images: {
        bytes: breakdown.imageFiles,
        percentage: (breakdown.imageFiles / Math.max(total, 1)) * 100,
      },
      documents: {
        bytes: breakdown.documentFiles,
        percentage: (breakdown.documentFiles / Math.max(total, 1)) * 100,
      },
      other: {
        bytes: breakdown.otherFiles,
        percentage: (breakdown.otherFiles / Math.max(total, 1)) * 100,
      },
    };
  }, [storageMetrics]);

  /**
   * Clear error
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Setup auto-refresh
   */
  useEffect(() => {
    // Initial load
    loadAllMetrics(selectedPeriod as any);

    // Setup auto-refresh every 5 minutes
    refreshIntervalRef.current = setInterval(() => {
      loadAllMetrics(selectedPeriod as any);
    }, 5 * 60 * 1000);

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [loadAllMetrics, selectedPeriod]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (metricsTimeoutRef.current) {
        clearTimeout(metricsTimeoutRef.current);
      }
    };
  }, []);

  return {
    // State
    uploadMetrics,
    downloadMetrics,
    storageMetrics,
    quotaMetrics,
    fileStatistics,
    report,
    isLoading,
    error,
    selectedPeriod,
    dashboardConfig,

    // Methods
    loadAllMetrics,
    generateReport,
    refreshMetrics,
    changePeriod,
    saveDashboardConfig,
    addDashboardWidget,
    removeDashboardWidget,
    getInsights,
    getStorageSummary,
    clearError,
  };
}

/**
 * Hook type export
 */
export type UseAnalytics = ReturnType<typeof useAnalytics>;
