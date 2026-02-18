/**
 * Analytics Screen for Phase 10
 * Main screen for viewing analytics and reports
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  SafeAreaView,
  FlatList,
  Alert,
} from 'react-native';
import { useAnalytics } from '@/hooks/useAnalytics';
import { AnalyticsDashboard } from '@/components/AnalyticsDashboard';
import { ReportPeriod, AnalyticsReport } from '@/types/analytics';

type TabType = 'overview' | 'uploads' | 'downloads' | 'storage' | 'reports';

interface ReportListItemProps {
  report: AnalyticsReport;
  onPress: (report: AnalyticsReport) => void;
}

/**
 * ReportListItem Component
 */
function ReportListItem({ report, onPress }: ReportListItemProps) {
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <TouchableOpacity style={styles.reportItem} onPress={() => onPress(report)}>
      <View style={styles.reportItemLeft}>
        <Text style={styles.reportItemTitle}>{report.period} Report</Text>
        <Text style={styles.reportItemDate}>{formatDate(report.generatedDate)}</Text>
      </View>

      <View style={styles.reportItemRight}>
        <View style={styles.reportItemStatBadge}>
          <Text style={styles.reportItemStatValue}>
            {report.metrics?.fileStatistics?.totalFiles || 0}
          </Text>
          <Text style={styles.reportItemStatLabel}>Files</Text>
        </View>

        <Text style={styles.reportItemArrow}>→</Text>
      </View>
    </TouchableOpacity>
  );
}

/**
 * PeriodSelector Component
 */
function PeriodSelector({
  selectedPeriod,
  onSelect,
}: {
  selectedPeriod: 'day' | 'week' | 'month' | 'year' | 'custom';
  onSelect: (period: typeof selectedPeriod) => void;
}) {
  const periods = [
    { id: 'day', label: 'Day' },
    { id: 'week', label: 'Week' },
    { id: 'month', label: 'Month' },
    { id: 'year', label: 'Year' },
  ] as const;

  return (
    <View style={styles.periodSelector}>
      {periods.map(period => (
        <TouchableOpacity
          key={period.id}
          style={[styles.periodButton, selectedPeriod === period.id && styles.periodButtonActive]}
          onPress={() => onSelect(period.id)}
        >
          <Text
            style={[styles.periodButtonText, selectedPeriod === period.id && styles.periodButtonTextActive]}
          >
            {period.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

/**
 * AnalyticsScreen Component
 */
export function AnalyticsScreen() {
  const userId = 'current-user-id'; // In real app, get from auth context

  const {
    uploadMetrics,
    downloadMetrics,
    storageMetrics,
    quotaMetrics,
    fileStatistics,
    report,
    isLoading,
    error,
    selectedPeriod,
    getInsights,
    getStorageSummary,
    loadAllMetrics,
    changePeriod,
    generateReport,
    refreshMetrics,
    clearError,
  } = useAnalytics(userId);

  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [reports, setReports] = useState<AnalyticsReport[]>([]);
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState<AnalyticsReport | null>(null);
  const [generatingReport, setGeneratingReport] = useState(false);

  /**
   * Handle period change
   */
  const handlePeriodChange = useCallback(
    async (newPeriod: typeof selectedPeriod) => {
      await changePeriod(newPeriod);
    },
    [changePeriod]
  );

  /**
   * Handle generate report
   */
  const handleGenerateReport = useCallback(
    async (period: ReportPeriod) => {
      setGeneratingReport(true);
      try {
        const result = await generateReport(period);
        if (result.ok && result.value) {
          setReports(prev => [...prev, result.value!]);
          Alert.alert('Success', 'Report generated successfully');
        } else {
          Alert.alert('Error', result.error?.message || 'Failed to generate report');
        }
      } catch (err) {
        Alert.alert('Error', (err as Error).message);
      } finally {
        setGeneratingReport(false);
      }
    },
    [generateReport]
  );

  /**
   * Handle report selection
   */
  const handleSelectReport = useCallback((selectedReport: AnalyticsReport) => {
    setSelectedReport(selectedReport);
    setShowReportModal(true);
  }, []);

  /**
   * Format file size
   */
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  /**
   * Format speed
   */
  const formatSpeed = (bytesPerSecond: number) => {
    return `${(bytesPerSecond / 1024 / 1024).toFixed(2)} MB/s`;
  };

  const insights = getInsights();
  const storageSummary = getStorageSummary();

  /**
   * Render Overview Tab
   */
  const renderOverviewTab = () => (
    <AnalyticsDashboard
      uploadMetrics={uploadMetrics}
      downloadMetrics={downloadMetrics}
      storageMetrics={storageMetrics}
      quotaMetrics={quotaMetrics}
      fileStatistics={fileStatistics}
      insights={insights}
      onRefresh={refreshMetrics}
      isLoading={isLoading}
    />
  );

  /**
   * Render Uploads Tab
   */
  const renderUploadsTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <PeriodSelector selectedPeriod={selectedPeriod} onSelect={handlePeriodChange} />

      {uploadMetrics && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Upload Statistics</Text>

          <View style={styles.statGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Total Uploads</Text>
              <Text style={styles.statValue}>{uploadMetrics.statistics.totalUploads}</Text>
            </View>

            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Success Rate</Text>
              <Text style={styles.statValue}>
                {uploadMetrics.statistics.successRate.toFixed(1)}%
              </Text>
            </View>

            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Avg Size</Text>
              <Text style={styles.statValue}>
                {formatBytes(uploadMetrics.statistics.averageFileSize)}
              </Text>
            </View>

            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Avg Speed</Text>
              <Text style={styles.statValue}>
                {formatSpeed(uploadMetrics.statistics.averageUploadSpeed)}
              </Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>Timeline</Text>
          <View style={styles.timelineContainer}>
            {uploadMetrics.timeline.map((dataPoint, idx) => {
              const maxValue = Math.max(...uploadMetrics.timeline);
              const height = maxValue > 0 ? (dataPoint / maxValue) * 100 : 0;

              return (
                <View key={idx} style={styles.timelineBar}>
                  <View
                    style={[
                      styles.timelineBarFill,
                      {
                        height: `${Math.max(height, 5)}%`,
                      },
                    ]}
                  />
                  <Text style={styles.timelineLabel}>{idx % 7 === 0 ? `D${idx + 1}` : ''}</Text>
                </View>
              );
            })}
          </View>
        </View>
      )}

      {!uploadMetrics && !isLoading && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>No upload data available</Text>
        </View>
      )}
    </ScrollView>
  );

  /**
   * Render Downloads Tab
   */
  const renderDownloadsTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <PeriodSelector selectedPeriod={selectedPeriod} onSelect={handlePeriodChange} />

      {downloadMetrics && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Download Statistics</Text>

          <View style={styles.statGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Total Downloads</Text>
              <Text style={styles.statValue}>{downloadMetrics.statistics.totalDownloads}</Text>
            </View>

            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Avg Speed</Text>
              <Text style={styles.statValue}>
                {formatSpeed(downloadMetrics.statistics.averageDownloadSpeed)}
              </Text>
            </View>

            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Bandwidth</Text>
              <Text style={styles.statValue}>
                {formatBytes(downloadMetrics.statistics.totalBandwidth)}
              </Text>
            </View>

            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Peak Speed</Text>
              <Text style={styles.statValue}>
                {formatSpeed(downloadMetrics.statistics.peakDownloadSpeed)}
              </Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>Timeline</Text>
          <View style={styles.timelineContainer}>
            {downloadMetrics.timeline.map((dataPoint, idx) => {
              const maxValue = Math.max(...downloadMetrics.timeline);
              const height = maxValue > 0 ? (dataPoint / maxValue) * 100 : 0;

              return (
                <View key={idx} style={styles.timelineBar}>
                  <View
                    style={[
                      styles.timelineBarFill,
                      {
                        height: `${Math.max(height, 5)}%`,
                      },
                    ]}
                  />
                  <Text style={styles.timelineLabel}>{idx % 7 === 0 ? `D${idx + 1}` : ''}</Text>
                </View>
              );
            })}
          </View>
        </View>
      )}

      {!downloadMetrics && !isLoading && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>No download data available</Text>
        </View>
      )}
    </ScrollView>
  );

  /**
   * Render Storage Tab
   */
  const renderStorageTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <PeriodSelector selectedPeriod={selectedPeriod} onSelect={handlePeriodChange} />

      {quotaMetrics && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Storage Quota</Text>

          <View style={styles.quotaCard}>
            <View style={styles.quotaInfo}>
              <Text style={styles.quotaLabel}>Used</Text>
              <Text style={styles.quotaValue}>{formatBytes(quotaMetrics.usedBytes)}</Text>
            </View>

            <View style={styles.quotaProgressBg}>
              <View
                style={[
                  styles.quotaProgressFill,
                  { width: `${Math.min(quotaMetrics.usagePercentage, 100)}%` },
                ]}
              />
            </View>

            <View style={styles.quotaInfo}>
              <Text style={styles.quotaLabel}>Available</Text>
              <Text style={styles.quotaValue}>{formatBytes(quotaMetrics.availableBytes)}</Text>
            </View>
          </View>

          {quotaMetrics.estimatedFullDate && (
            <View style={styles.warningCard}>
              <Text style={styles.warningText}>
                📅 Storage will be full by{' '}
                {new Date(quotaMetrics.estimatedFullDate).toLocaleDateString()}
              </Text>
            </View>
          )}
        </View>
      )}

      {storageMetrics && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Storage by Type</Text>

          {storageSummary &&
            Object.entries(storageSummary)
              .filter(([key]) => key !== 'total')
              .map(([type, data]: any) => {
                const percentage = typeof data === 'object' ? data.percentage : 0;
                return (
                  <View key={type} style={styles.storageTypeItem}>
                    <View style={styles.storageTypeHeader}>
                      <Text style={styles.storageTypeName}>{type}</Text>
                      <Text style={styles.storageTypePercentage}>{percentage.toFixed(1)}%</Text>
                    </View>

                    <View style={styles.storageTypeProgressBg}>
                      <View
                        style={[
                          styles.storageTypeProgressFill,
                          { width: `${percentage}%` },
                        ]}
                      />
                    </View>

                    <Text style={styles.storageTypeSize}>
                      {typeof data === 'object' ? formatBytes(data.bytes) : '0 B'}
                    </Text>
                  </View>
                );
              })}
        </View>
      )}

      {!quotaMetrics && !storageMetrics && !isLoading && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>No storage data available</Text>
        </View>
      )}
    </ScrollView>
  );

  /**
   * Render Reports Tab
   */
  const renderReportsTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Generate Report</Text>

        <View style={styles.reportGeneratorGrid}>
          {[ReportPeriod.DAILY, ReportPeriod.WEEKLY, ReportPeriod.MONTHLY, ReportPeriod.QUARTERLY].map(
            period => (
              <TouchableOpacity
                key={period}
                style={styles.generateReportButton}
                onPress={() => handleGenerateReport(period as ReportPeriod)}
                disabled={generatingReport}
              >
                {generatingReport ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Text style={styles.generateReportButtonText}>{period}</Text>
                    <Text style={styles.generateReportButtonSubtext}>Report</Text>
                  </>
                )}
              </TouchableOpacity>
            )
          )}
        </View>
      </View>

      {reports.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Generated Reports</Text>

          <FlatList
            data={reports}
            keyExtractor={(_, idx) => idx.toString()}
            renderItem={({ item }) => (
              <ReportListItem report={item} onPress={handleSelectReport} />
            )}
            scrollEnabled={false}
          />
        </View>
      )}

      {reports.length === 0 && !generatingReport && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>No reports generated yet</Text>
          <Text style={styles.emptyStateSubtext}>Generate a report to get started</Text>
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Error Banner */}
      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorBannerText}>{error.message}</Text>
          <TouchableOpacity onPress={clearError}>
            <Text style={styles.errorBannerClose}>✕</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Tab Bar */}
      <View style={styles.tabBar}>
        {(['overview', 'uploads', 'downloads', 'storage', 'reports'] as TabType[]).map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.tabBarButton, activeTab === tab && styles.tabBarButtonActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text
              style={[styles.tabBarButtonText, activeTab === tab && styles.tabBarButtonTextActive]}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Loading State */}
      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading analytics...</Text>
        </View>
      )}

      {/* Tab Content */}
      {!isLoading && (
        <>
          {activeTab === 'overview' && renderOverviewTab()}
          {activeTab === 'uploads' && renderUploadsTab()}
          {activeTab === 'downloads' && renderDownloadsTab()}
          {activeTab === 'storage' && renderStorageTab()}
          {activeTab === 'reports' && renderReportsTab()}
        </>
      )}

      {/* Report Modal */}
      <Modal visible={showReportModal} transparent animationType="slide">
        <SafeAreaView style={styles.reportModal}>
          <View style={styles.reportModalHeader}>
            <Text style={styles.reportModalTitle}>
              {selectedReport?.period} Report
            </Text>
            <TouchableOpacity onPress={() => setShowReportModal(false)}>
              <Text style={styles.reportModalClose}>✕</Text>
            </TouchableOpacity>
          </View>

          {selectedReport && (
            <ScrollView style={styles.reportModalContent}>
              <View style={styles.reportDetailCard}>
                <Text style={styles.reportDetailTitle}>Report Details</Text>
                <Text style={styles.reportDetailText}>
                  Period: {selectedReport.period}
                </Text>
                <Text style={styles.reportDetailText}>
                  Generated: {new Date(selectedReport.generatedDate).toLocaleDateString()}
                </Text>

                {selectedReport.metrics?.fileStatistics && (
                  <>
                    <Text style={[styles.reportDetailTitle, { marginTop: 16 }]}>
                      File Statistics
                    </Text>
                    <Text style={styles.reportDetailText}>
                      Files: {selectedReport.metrics.fileStatistics.totalFiles}
                    </Text>
                    <Text style={styles.reportDetailText}>
                      Total Size:{' '}
                      {formatBytes(selectedReport.metrics.fileStatistics.totalSize)}
                    </Text>
                  </>
                )}
              </View>
            </ScrollView>
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  errorBanner: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  errorBannerText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  errorBannerClose: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  tabBarButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  tabBarButtonActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#007AFF',
  },
  tabBarButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  tabBarButtonTextActive: {
    color: '#007AFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  tabContent: {
    flex: 1,
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
  },
  periodSelector: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  periodButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    alignItems: 'center',
  },
  periodButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  periodButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  periodButtonTextActive: {
    color: '#fff',
  },
  statGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statCard: {
    flex: 1,
    minWidth: '48%',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    gap: 4,
  },
  statLabel: {
    fontSize: 11,
    color: '#999',
    fontWeight: '500',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
  },
  timelineContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    height: 200,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2,
  },
  timelineBar: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
  },
  timelineBarFill: {
    width: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 2,
    minHeight: 4,
  },
  timelineLabel: {
    fontSize: 9,
    color: '#999',
  },
  quotaCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    gap: 8,
  },
  quotaInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  quotaLabel: {
    fontSize: 12,
    color: '#999',
    fontWeight: '500',
  },
  quotaValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
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
  warningCard: {
    backgroundColor: '#FFF3CD',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  warningText: {
    fontSize: 12,
    color: '#856404',
    fontWeight: '500',
  },
  storageTypeItem: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    gap: 4,
    marginBottom: 8,
  },
  storageTypeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  storageTypeName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    textTransform: 'capitalize',
  },
  storageTypePercentage: {
    fontSize: 12,
    fontWeight: '600',
    color: '#007AFF',
  },
  storageTypeProgressBg: {
    height: 6,
    backgroundColor: '#f0f0f0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  storageTypeProgressFill: {
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 3,
  },
  storageTypeSize: {
    fontSize: 11,
    color: '#999',
    marginLeft: 4,
  },
  reportGeneratorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  generateReportButton: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  generateReportButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  generateReportButtonSubtext: {
    color: '#fff',
    fontSize: 11,
    opacity: 0.8,
  },
  reportItem: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reportItemLeft: {
    flex: 1,
  },
  reportItemTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  reportItemDate: {
    fontSize: 11,
    color: '#999',
    marginTop: 2,
  },
  reportItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  reportItemStatBadge: {
    backgroundColor: '#f0f0f0',
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    alignItems: 'center',
  },
  reportItemStatValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#333',
  },
  reportItemStatLabel: {
    fontSize: 9,
    color: '#999',
  },
  reportItemArrow: {
    fontSize: 16,
    color: '#007AFF',
  },
  reportModal: {
    flex: 1,
    backgroundColor: '#fff',
  },
  reportModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  reportModalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  reportModalClose: {
    fontSize: 20,
    color: '#007AFF',
  },
  reportModalContent: {
    flex: 1,
    padding: 16,
  },
  reportDetailCard: {
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    padding: 16,
    gap: 8,
  },
  reportDetailTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
  },
  reportDetailText: {
    fontSize: 12,
    color: '#666',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#999',
  },
  emptyStateSubtext: {
    fontSize: 13,
    color: '#ccc',
    marginTop: 4,
  },
});
