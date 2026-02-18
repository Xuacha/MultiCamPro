/**
 * Analytics Dashboard Component for Phase 10
 * UI component for displaying analytics metrics and trends
 */

import React, { useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { UploadMetrics, DownloadMetrics, StorageTrends, QuotaAnalytics, FileStatistics } from '@/types/analytics';

interface AnalyticsDashboardProps {
  uploadMetrics?: UploadMetrics | null;
  downloadMetrics?: DownloadMetrics | null;
  storageMetrics?: StorageTrends | null;
  quotaMetrics?: QuotaAnalytics | null;
  fileStatistics?: FileStatistics | null;
  insights?: string[];
  onRefresh?: () => void;
  isLoading?: boolean;
}

/**
 * MetricCard Component
 */
function MetricCard({
  title,
  value,
  subtitle,
  trend,
  icon,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: number;
  icon?: string;
}) {
  const trendColor = trend && trend > 0 ? '#34C759' : trend && trend < 0 ? '#FF3B30' : '#999';
  const trendIcon = trend && trend > 0 ? '↑' : trend && trend < 0 ? '↓' : '→';

  return (
    <View style={styles.metricCard}>
      <View style={styles.metricHeader}>
        <Text style={styles.metricTitle}>{title}</Text>
        {icon && <Text style={styles.metricIcon}>{icon}</Text>}
      </View>

      <View style={styles.metricContent}>
        <Text style={styles.metricValue}>{value}</Text>
        {subtitle && <Text style={styles.metricSubtitle}>{subtitle}</Text>}
      </View>

      {trend !== undefined && (
        <View style={styles.metricTrend}>
          <Text style={[styles.trendIcon, { color: trendColor }]}>{trendIcon}</Text>
          <Text style={[styles.trendText, { color: trendColor }]}>
            {Math.abs(trend).toFixed(1)}%
          </Text>
        </View>
      )}
    </View>
  );
}

/**
 * StorageBreakdownCard Component
 */
function StorageBreakdownCard({ breakdown }: { breakdown: any }) {
  const total = breakdown?.total || 0;
  const categories = [
    { name: 'Video', size: breakdown?.videoFiles || 0, color: '#FF3B30' },
    { name: 'Audio', size: breakdown?.audioFiles || 0, color: '#FF9500' },
    { name: 'Images', size: breakdown?.imageFiles || 0, color: '#34C759' },
    { name: 'Documents', size: breakdown?.documentFiles || 0, color: '#007AFF' },
    { name: 'Other', size: breakdown?.otherFiles || 0, color: '#999' },
  ];

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <View style={styles.breakdownCard}>
      <Text style={styles.breakdownTitle}>Storage Breakdown</Text>

      {/* Progress bar */}
      <View style={styles.progressContainer}>
        {categories.map((cat, idx) => {
          const percentage = total > 0 ? (cat.size / total) * 100 : 0;
          return percentage > 0 ? (
            <View
              key={idx}
              style={[
                styles.progressBar,
                {
                  flex: percentage,
                  backgroundColor: cat.color,
                },
              ]}
            />
          ) : null;
        })}
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        {categories.map((cat, idx) => {
          const percentage = total > 0 ? (cat.size / total) * 100 : 0;
          return (
            <View key={idx} style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: cat.color }]} />
              <View style={styles.legendInfo}>
                <Text style={styles.legendName}>{cat.name}</Text>
                <Text style={styles.legendSize}>
                  {percentage.toFixed(1)}% ({formatBytes(cat.size)})
                </Text>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

/**
 * InsightsCard Component
 */
function InsightsCard({ insights }: { insights?: string[] }) {
  if (!insights || insights.length === 0) {
    return null;
  }

  return (
    <View style={styles.insightsCard}>
      <Text style={styles.insightsTitle}>Insights & Recommendations</Text>
      <View style={styles.insightsList}>
        {insights.map((insight, idx) => (
          <View key={idx} style={styles.insightItem}>
            <Text style={styles.insightText}>{insight}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

/**
 * AnalyticsDashboard Component
 */
export function AnalyticsDashboard({
  uploadMetrics,
  downloadMetrics,
  storageMetrics,
  quotaMetrics,
  fileStatistics,
  insights,
  onRefresh,
  isLoading,
}: AnalyticsDashboardProps) {
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat().format(num);
  };

  // Calculate metrics
  const uploadMetricsComputed = useMemo(() => {
    if (!uploadMetrics) return null;

    const stats = uploadMetrics.statistics;
    const timeline = uploadMetrics.timeline;
    const totalUploads = formatNumber(stats.totalUploads);
    const successRate = `${stats.successRate.toFixed(1)}%`;
    const avgSize = formatBytes(stats.averageFileSize);
    const trend = timeline.length > 1 ? ((timeline[timeline.length - 1] - timeline[0]) / timeline[0]) * 100 : 0;

    return { totalUploads, successRate, avgSize, trend };
  }, [uploadMetrics]);

  const downloadMetricsComputed = useMemo(() => {
    if (!downloadMetrics) return null;

    const stats = downloadMetrics.statistics;
    const timeline = downloadMetrics.timeline;
    const totalDownloads = formatNumber(stats.totalDownloads);
    const avgSpeed = `${(stats.averageDownloadSpeed / 1024 / 1024).toFixed(2)} MB/s`;
    const bandwidth = formatBytes(stats.totalBandwidth);
    const trend = timeline.length > 1 ? ((timeline[timeline.length - 1] - timeline[0]) / timeline[0]) * 100 : 0;

    return { totalDownloads, avgSpeed, bandwidth, trend };
  }, [downloadMetrics]);

  const fileStatsComputed = useMemo(() => {
    if (!fileStatistics) return null;

    const totalFiles = formatNumber(fileStatistics.totalFiles);
    const avgSize = formatBytes(fileStatistics.averageFileSize);
    const totalSize = formatBytes(fileStatistics.totalSize);

    return { totalFiles, avgSize, totalSize };
  }, [fileStatistics]);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Analytics Dashboard</Text>
        {onRefresh && (
          <TouchableOpacity
            onPress={onRefresh}
            style={[styles.refreshButton, isLoading && styles.refreshButtonLoading]}
          >
            <Text style={styles.refreshButtonText}>↻</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Storage & Quota Section */}
      {quotaMetrics && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Storage & Quota</Text>

          <View style={styles.metricsGrid}>
            <MetricCard
              title="Storage Used"
              value={formatBytes(quotaMetrics.usedBytes)}
              subtitle={`of ${formatBytes(quotaMetrics.quotaBytes)}`}
              icon="💾"
            />

            <MetricCard
              title="Usage"
              value={`${quotaMetrics.usagePercentage.toFixed(1)}%`}
              subtitle={formatBytes(quotaMetrics.availableBytes) + ' available'}
              icon="📊"
            />
          </View>

          {/* Quota Progress Bar */}
          <View style={styles.quotaContainer}>
            <View style={styles.quotaProgressBg}>
              <View
                style={[
                  styles.quotaProgressFill,
                  { width: `${Math.min(quotaMetrics.usagePercentage, 100)}%` },
                ]}
              />
            </View>
            <Text style={styles.quotaText}>
              {quotaMetrics.estimatedFullDate
                ? `Full by ${new Date(quotaMetrics.estimatedFullDate).toLocaleDateString()}`
                : 'Unlimited storage'}
            </Text>
          </View>
        </View>
      )}

      {/* Upload Metrics Section */}
      {uploadMetricsComputed && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Upload Activity</Text>

          <View style={styles.metricsGrid}>
            <MetricCard
              title="Total Uploads"
              value={uploadMetricsComputed.totalUploads}
              trend={uploadMetricsComputed.trend}
              icon="⬆️"
            />

            <MetricCard
              title="Success Rate"
              value={uploadMetricsComputed.successRate}
              subtitle={uploadMetricsComputed.avgSize + ' avg file'}
              icon="✓"
            />
          </View>
        </View>
      )}

      {/* Download Metrics Section */}
      {downloadMetricsComputed && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Download Activity</Text>

          <View style={styles.metricsGrid}>
            <MetricCard
              title="Total Downloads"
              value={downloadMetricsComputed.totalDownloads}
              trend={downloadMetricsComputed.trend}
              icon="⬇️"
            />

            <MetricCard
              title="Avg Speed"
              value={downloadMetricsComputed.avgSpeed}
              subtitle={downloadMetricsComputed.bandwidth + ' total'}
              icon="⚡"
            />
          </View>
        </View>
      )}

      {/* File Statistics Section */}
      {fileStatsComputed && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>File Statistics</Text>

          <View style={styles.metricsGrid}>
            <MetricCard
              title="Total Files"
              value={fileStatsComputed.totalFiles}
              subtitle={fileStatsComputed.avgSize + ' average'}
              icon="📁"
            />

            <MetricCard
              title="Total Size"
              value={fileStatsComputed.totalSize}
              icon="📦"
            />
          </View>
        </View>
      )}

      {/* Storage Breakdown */}
      {storageMetrics?.breakdown && (
        <View style={styles.section}>
          <StorageBreakdownCard breakdown={storageMetrics.breakdown} />
        </View>
      )}

      {/* Insights */}
      {insights && insights.length > 0 && (
        <View style={styles.section}>
          <InsightsCard insights={insights} />
        </View>
      )}

      {/* Empty State */}
      {!uploadMetrics && !downloadMetrics && !quotaMetrics && !fileStatistics && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>No analytics data available yet</Text>
          <Text style={styles.emptyStateSubtext}>Start uploading and downloading files to see analytics</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  refreshButtonLoading: {
    opacity: 0.6,
  },
  refreshButtonText: {
    fontSize: 18,
    fontWeight: '600',
  },
  section: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    gap: 8,
    minHeight: 120,
  },
  metricHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metricTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    flex: 1,
  },
  metricIcon: {
    fontSize: 16,
  },
  metricContent: {
    flex: 1,
    justifyContent: 'center',
    gap: 4,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  metricSubtitle: {
    fontSize: 11,
    color: '#999',
  },
  metricTrend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  trendIcon: {
    fontSize: 12,
    fontWeight: '600',
  },
  trendText: {
    fontSize: 11,
    fontWeight: '600',
  },
  quotaContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  quotaProgressBg: {
    height: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  quotaProgressFill: {
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 4,
  },
  quotaText: {
    fontSize: 12,
    color: '#666',
  },
  breakdownCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    gap: 12,
  },
  breakdownTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
  },
  progressContainer: {
    height: 24,
    flexDirection: 'row',
    borderRadius: 6,
    overflow: 'hidden',
    backgroundColor: '#f0f0f0',
    gap: 0,
  },
  progressBar: {
    height: '100%',
  },
  legend: {
    gap: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 2,
  },
  legendInfo: {
    flex: 1,
  },
  legendName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
  legendSize: {
    fontSize: 11,
    color: '#999',
  },
  insightsCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    gap: 12,
  },
  insightsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
  },
  insightsList: {
    gap: 8,
  },
  insightItem: {
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    padding: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#007AFF',
  },
  insightText: {
    fontSize: 12,
    color: '#333',
    lineHeight: 16,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 16,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#999',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#ccc',
  },
});
