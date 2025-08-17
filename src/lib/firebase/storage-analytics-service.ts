/**
 * Storage Analytics and Monitoring Service
 * Provides comprehensive analytics, monitoring, and insights
 * for Firebase Storage usage, performance, and compliance
 */

import { 
  doc, 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from './firebase-config';
import { 
  FileType, 
  UserType, 
  FileMetadata, 
  FilePerformanceMetrics,
  AccessPattern,
  FileClassification,
  StorageSummary
} from './storage-architecture';

interface StorageAnalytics {
  period: 'daily' | 'weekly' | 'monthly' | 'yearly';
  startDate: Date;
  endDate: Date;
  
  // Usage metrics
  totalFiles: number;
  totalSize: number;
  newFiles: number;
  deletedFiles: number;
  
  // User metrics
  activeUsers: number;
  topUsers: Array<{
    userId: string;
    fileCount: number;
    totalSize: number;
  }>;
  
  // File type distribution
  fileTypeDistribution: Record<FileType, {
    count: number;
    size: number;
    percentage: number;
  }>;
  
  // Access pattern distribution
  accessPatternDistribution: Record<AccessPattern, {
    count: number;
    size: number;
    percentage: number;
  }>;
  
  // Performance metrics
  averageUploadTime: number;
  averageDownloadTime: number;
  averageThroughput: number;
  cacheHitRate: number;
  errorRate: number;
  
  // Compliance metrics
  complianceScore: number;
  gdprCompliantFiles: number;
  anonymizedFiles: number;
  retentionPolicyViolations: number;
  
  // Cost optimization
  storageOptimizationScore: number;
  coldStorageOpportunities: number;
  duplicateFiles: number;
  
  // Trends
  trends: {
    uploadTrend: 'increasing' | 'decreasing' | 'stable';
    sizeGrowthRate: number; // percentage
    userGrowthRate: number; // percentage
    performanceTrend: 'improving' | 'degrading' | 'stable';
  };
}

interface StorageAlert {
  id: string;
  type: 'quota_warning' | 'performance_degradation' | 'compliance_violation' | 'security_concern';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  affectedResources: string[];
  recommendations: string[];
  createdAt: Date;
  resolvedAt?: Date;
  metadata?: Record<string, any>;
}

interface UsageProjection {
  timeframe: '1_month' | '3_months' | '6_months' | '1_year';
  projectedSize: number;
  projectedFiles: number;
  projectedCost: number; // estimated Firebase Storage cost
  confidence: number; // 0-1 confidence score
  assumptions: string[];
}

export class StorageAnalyticsService {
  
  /**
   * Generate comprehensive storage analytics for a given period
   */
  async generateStorageAnalytics(
    period: 'daily' | 'weekly' | 'monthly' | 'yearly',
    startDate?: Date,
    endDate?: Date
  ): Promise<StorageAnalytics> {
    const { start, end } = this.calculatePeriodDates(period, startDate, endDate);
    
    const analytics: StorageAnalytics = {
      period,
      startDate: start,
      endDate: end,
      totalFiles: 0,
      totalSize: 0,
      newFiles: 0,
      deletedFiles: 0,
      activeUsers: 0,
      topUsers: [],
      fileTypeDistribution: {} as any,
      accessPatternDistribution: {} as any,
      averageUploadTime: 0,
      averageDownloadTime: 0,
      averageThroughput: 0,
      cacheHitRate: 0,
      errorRate: 0,
      complianceScore: 0,
      gdprCompliantFiles: 0,
      anonymizedFiles: 0,
      retentionPolicyViolations: 0,
      storageOptimizationScore: 0,
      coldStorageOpportunities: 0,
      duplicateFiles: 0,
      trends: {
        uploadTrend: 'stable',
        sizeGrowthRate: 0,
        userGrowthRate: 0,
        performanceTrend: 'stable'
      }
    };

    // Get all files in the period
    const filesInPeriod = await this.getFilesInPeriod(start, end);
    analytics.totalFiles = filesInPeriod.length;
    analytics.totalSize = filesInPeriod.reduce((sum, file) => sum + file.size, 0);

    // Calculate new and deleted files
    analytics.newFiles = filesInPeriod.filter(file => 
      file.uploadedAt >= start && file.uploadedAt <= end
    ).length;

    // Get performance metrics
    const performanceMetrics = await this.getPerformanceMetrics(start, end);
    if (performanceMetrics.length > 0) {
      analytics.averageUploadTime = this.calculateAverageMetric(
        performanceMetrics.filter(m => m.operation === 'upload'),
        'duration'
      );
      
      analytics.averageDownloadTime = this.calculateAverageMetric(
        performanceMetrics.filter(m => m.operation === 'download'),
        'duration'
      );
      
      analytics.averageThroughput = this.calculateAverageMetric(performanceMetrics, 'throughput');
      
      const cacheHits = performanceMetrics.filter(m => m.cacheHit === true);
      analytics.cacheHitRate = (cacheHits.length / performanceMetrics.length) * 100;
      
      const errors = performanceMetrics.filter(m => m.errorCode);
      analytics.errorRate = (errors.length / performanceMetrics.length) * 100;
    }

    // Calculate file type distribution
    analytics.fileTypeDistribution = this.calculateFileTypeDistribution(filesInPeriod);
    
    // Calculate access pattern distribution
    analytics.accessPatternDistribution = this.calculateAccessPatternDistribution(filesInPeriod);
    
    // Calculate user metrics
    const userMetrics = this.calculateUserMetrics(filesInPeriod);
    analytics.activeUsers = userMetrics.activeUsers;
    analytics.topUsers = userMetrics.topUsers;
    
    // Calculate compliance metrics
    const complianceMetrics = this.calculateComplianceMetrics(filesInPeriod);
    analytics.complianceScore = complianceMetrics.score;
    analytics.gdprCompliantFiles = complianceMetrics.gdprCompliant;
    analytics.anonymizedFiles = complianceMetrics.anonymized;
    analytics.retentionPolicyViolations = complianceMetrics.violations;
    
    // Calculate optimization metrics
    const optimizationMetrics = await this.calculateOptimizationMetrics(filesInPeriod);
    analytics.storageOptimizationScore = optimizationMetrics.score;
    analytics.coldStorageOpportunities = optimizationMetrics.coldStorageOpportunities;
    analytics.duplicateFiles = optimizationMetrics.duplicates;
    
    // Calculate trends
    analytics.trends = await this.calculateTrends(period, start, end);
    
    // Save analytics to database
    await this.saveAnalytics(analytics);
    
    return analytics;
  }

  /**
   * Monitor storage health and generate alerts
   */
  async monitorStorageHealth(): Promise<StorageAlert[]> {
    const alerts: StorageAlert[] = [];
    
    // Check quota warnings
    const quotaAlerts = await this.checkQuotaWarnings();
    alerts.push(...quotaAlerts);
    
    // Check performance degradation
    const performanceAlerts = await this.checkPerformanceDegradation();
    alerts.push(...performanceAlerts);
    
    // Check compliance violations
    const complianceAlerts = await this.checkComplianceViolations();
    alerts.push(...complianceAlerts);
    
    // Check security concerns
    const securityAlerts = await this.checkSecurityConcerns();
    alerts.push(...securityAlerts);
    
    // Save alerts to database
    for (const alert of alerts) {
      await this.saveAlert(alert);
    }
    
    return alerts;
  }

  /**
   * Generate usage projections based on historical data
   */
  async generateUsageProjections(
    userId?: string,
    organizationId?: string
  ): Promise<UsageProjection[]> {
    const projections: UsageProjection[] = [];
    const timeframes: UsageProjection['timeframe'][] = ['1_month', '3_months', '6_months', '1_year'];
    
    // Get historical data for the last year
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    
    const historicalData = await this.getHistoricalUsageData(oneYearAgo, new Date(), userId, organizationId);
    
    for (const timeframe of timeframes) {
      const projection = this.calculateProjection(historicalData, timeframe);
      projections.push(projection);
    }
    
    return projections;
  }

  /**
   * Get storage cost breakdown and optimization recommendations
   */
  async getStorageCostAnalysis(
    userId?: string,
    organizationId?: string
  ): Promise<{
    currentCost: number;
    costBreakdown: {
      hotStorage: number;
      warmStorage: number;
      coldStorage: number;
      operations: number;
      networkEgress: number;
    };
    optimizationRecommendations: Array<{
      action: string;
      potentialSavings: number;
      impact: 'low' | 'medium' | 'high';
      effort: 'low' | 'medium' | 'high';
    }>;
  }> {
    // Firebase Storage pricing (approximate)
    const pricing = {
      hotStorage: 0.026, // per GB per month
      warmStorage: 0.018, // per GB per month  
      coldStorage: 0.012, // per GB per month
      operations: 0.0004, // per 10k operations
      networkEgress: 0.12 // per GB
    };

    // Get storage usage data
    let filesQuery = collection(db, 'file_metadata');
    if (userId) {
      filesQuery = query(filesQuery, where('uploadedBy', '==', userId));
    } else if (organizationId) {
      filesQuery = query(filesQuery, where('ownerId', '==', organizationId));
    }

    const snapshot = await getDocs(filesQuery);
    const files = snapshot.docs.map(doc => doc.data() as FileMetadata);

    // Calculate storage by access pattern
    const storageByPattern = {
      hot: 0,
      warm: 0,
      cold: 0
    };

    files.forEach(file => {
      const sizeInGB = file.size / (1024 * 1024 * 1024);
      storageByPattern[file.accessPattern] += sizeInGB;
    });

    // Calculate costs
    const costBreakdown = {
      hotStorage: storageByPattern.hot * pricing.hotStorage,
      warmStorage: storageByPattern.warm * pricing.warmStorage,
      coldStorage: storageByPattern.cold * pricing.coldStorage,
      operations: files.length * pricing.operations / 10000, // Rough estimate
      networkEgress: 0 // Would need actual download data
    };

    const currentCost = Object.values(costBreakdown).reduce((sum, cost) => sum + cost, 0);

    // Generate optimization recommendations
    const optimizationRecommendations = [];

    // Recommend moving old files to cold storage
    const oldHotFiles = files.filter(file => 
      file.accessPattern === AccessPattern.HOT &&
      file.lastAccessed &&
      (Date.now() - file.lastAccessed.getTime()) > (30 * 24 * 60 * 60 * 1000) // 30 days
    );

    if (oldHotFiles.length > 0) {
      const potentialSavings = oldHotFiles.reduce((sum, file) => {
        const sizeInGB = file.size / (1024 * 1024 * 1024);
        return sum + (sizeInGB * (pricing.hotStorage - pricing.coldStorage));
      }, 0);

      optimizationRecommendations.push({
        action: `Move ${oldHotFiles.length} inactive hot storage files to cold storage`,
        potentialSavings,
        impact: potentialSavings > 10 ? 'high' : potentialSavings > 5 ? 'medium' : 'low',
        effort: 'low'
      });
    }

    // Recommend compression for large text files
    const largeTextFiles = files.filter(file =>
      file.size > 1024 * 1024 && // > 1MB
      (file.mimeType.startsWith('text/') || file.mimeType === 'application/json') &&
      !file.compressionEnabled
    );

    if (largeTextFiles.length > 0) {
      const potentialSavings = largeTextFiles.reduce((sum, file) => {
        const sizeInGB = file.size / (1024 * 1024 * 1024);
        const compressionSavings = sizeInGB * 0.7; // Assume 70% compression
        return sum + (compressionSavings * pricing.warmStorage);
      }, 0);

      optimizationRecommendations.push({
        action: `Enable compression for ${largeTextFiles.length} large text files`,
        potentialSavings,
        impact: 'medium',
        effort: 'low'
      });
    }

    return {
      currentCost,
      costBreakdown,
      optimizationRecommendations
    };
  }

  /**
   * Private helper methods
   */
  private calculatePeriodDates(
    period: 'daily' | 'weekly' | 'monthly' | 'yearly',
    startDate?: Date,
    endDate?: Date
  ): { start: Date; end: Date } {
    const end = endDate || new Date();
    const start = startDate || new Date();

    if (!startDate) {
      switch (period) {
        case 'daily':
          start.setDate(end.getDate() - 1);
          break;
        case 'weekly':
          start.setDate(end.getDate() - 7);
          break;
        case 'monthly':
          start.setMonth(end.getMonth() - 1);
          break;
        case 'yearly':
          start.setFullYear(end.getFullYear() - 1);
          break;
      }
    }

    return { start, end };
  }

  private async getFilesInPeriod(start: Date, end: Date): Promise<FileMetadata[]> {
    const filesQuery = query(
      collection(db, 'file_metadata'),
      where('uploadedAt', '>=', start),
      where('uploadedAt', '<=', end)
    );

    const snapshot = await getDocs(filesQuery);
    return snapshot.docs.map(doc => doc.data() as FileMetadata);
  }

  private async getPerformanceMetrics(start: Date, end: Date): Promise<FilePerformanceMetrics[]> {
    const metricsQuery = query(
      collection(db, 'performance_metrics'),
      where('timestamp', '>=', start),
      where('timestamp', '<=', end)
    );

    const snapshot = await getDocs(metricsQuery);
    return snapshot.docs.map(doc => doc.data() as FilePerformanceMetrics);
  }

  private calculateAverageMetric(metrics: FilePerformanceMetrics[], field: keyof FilePerformanceMetrics): number {
    if (metrics.length === 0) return 0;
    const sum = metrics.reduce((total, metric) => total + (metric[field] as number), 0);
    return sum / metrics.length;
  }

  private calculateFileTypeDistribution(files: FileMetadata[]): Record<FileType, any> {
    const distribution = {};
    const totalSize = files.reduce((sum, file) => sum + file.size, 0);

    for (const fileType of Object.values(FileType)) {
      const typeFiles = files.filter(file => file.fileType === fileType);
      const typeSize = typeFiles.reduce((sum, file) => sum + file.size, 0);
      
      distribution[fileType] = {
        count: typeFiles.length,
        size: typeSize,
        percentage: totalSize > 0 ? (typeSize / totalSize) * 100 : 0
      };
    }

    return distribution;
  }

  private calculateAccessPatternDistribution(files: FileMetadata[]): Record<AccessPattern, any> {
    const distribution = {};
    const totalSize = files.reduce((sum, file) => sum + file.size, 0);

    for (const pattern of Object.values(AccessPattern)) {
      const patternFiles = files.filter(file => file.accessPattern === pattern);
      const patternSize = patternFiles.reduce((sum, file) => sum + file.size, 0);
      
      distribution[pattern] = {
        count: patternFiles.length,
        size: patternSize,
        percentage: totalSize > 0 ? (patternSize / totalSize) * 100 : 0
      };
    }

    return distribution;
  }

  private calculateUserMetrics(files: FileMetadata[]): {
    activeUsers: number;
    topUsers: Array<{ userId: string; fileCount: number; totalSize: number }>;
  } {
    const userStats = new Map<string, { fileCount: number; totalSize: number }>();

    files.forEach(file => {
      const userId = file.uploadedBy;
      const current = userStats.get(userId) || { fileCount: 0, totalSize: 0 };
      userStats.set(userId, {
        fileCount: current.fileCount + 1,
        totalSize: current.totalSize + file.size
      });
    });

    const topUsers = Array.from(userStats.entries())
      .map(([userId, stats]) => ({ userId, ...stats }))
      .sort((a, b) => b.totalSize - a.totalSize)
      .slice(0, 10);

    return {
      activeUsers: userStats.size,
      topUsers
    };
  }

  private calculateComplianceMetrics(files: FileMetadata[]): {
    score: number;
    gdprCompliant: number;
    anonymized: number;
    violations: number;
  } {
    let gdprCompliant = 0;
    let anonymized = 0;
    let violations = 0;

    files.forEach(file => {
      if (file.retentionBasis && file.dataClassification) {
        gdprCompliant++;
      } else {
        violations++;
      }

      if (file.isAnonymized) {
        anonymized++;
      }
    });

    const score = files.length > 0 ? (gdprCompliant / files.length) * 100 : 100;

    return { score, gdprCompliant, anonymized, violations };
  }

  private async calculateOptimizationMetrics(files: FileMetadata[]): Promise<{
    score: number;
    coldStorageOpportunities: number;
    duplicates: number;
  }> {
    // Calculate cold storage opportunities (files not accessed in 30+ days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const coldStorageOpportunities = files.filter(file =>
      file.accessPattern === AccessPattern.HOT &&
      file.lastAccessed &&
      file.lastAccessed < thirtyDaysAgo
    ).length;

    // Simple duplicate detection based on file size and name
    const duplicates = this.findDuplicateFiles(files);

    // Calculate optimization score (simplified)
    const optimizedFiles = files.filter(file =>
      file.accessPattern === AccessPattern.COLD ||
      (file.compressionEnabled && file.size > 1024 * 1024)
    ).length;

    const score = files.length > 0 ? (optimizedFiles / files.length) * 100 : 100;

    return { score, coldStorageOpportunities, duplicates };
  }

  private findDuplicateFiles(files: FileMetadata[]): number {
    const sizeMap = new Map<string, FileMetadata[]>();

    files.forEach(file => {
      const key = `${file.originalName}_${file.size}`;
      const existing = sizeMap.get(key) || [];
      existing.push(file);
      sizeMap.set(key, existing);
    });

    let duplicates = 0;
    sizeMap.forEach(fileGroup => {
      if (fileGroup.length > 1) {
        duplicates += fileGroup.length - 1; // Count extras as duplicates
      }
    });

    return duplicates;
  }

  private async calculateTrends(
    period: string,
    start: Date,
    end: Date
  ): Promise<StorageAnalytics['trends']> {
    try {
      // Get data from previous period for comparison
      const periodLength = end.getTime() - start.getTime();
      const previousStart = new Date(start.getTime() - periodLength);
      const previousEnd = new Date(start.getTime());

      const [currentFiles, previousFiles, currentMetrics, previousMetrics] = await Promise.all([
        this.getFilesInPeriod(start, end),
        this.getFilesInPeriod(previousStart, previousEnd),
        this.getPerformanceMetrics(start, end),
        this.getPerformanceMetrics(previousStart, previousEnd)
      ]);

      // Calculate upload trend
      const currentUploads = currentFiles.length;
      const previousUploads = previousFiles.length;
      const uploadChange = previousUploads === 0 ? 0 : 
        ((currentUploads - previousUploads) / previousUploads) * 100;
      
      const uploadTrend = uploadChange > 10 ? 'increasing' : 
                         uploadChange < -10 ? 'decreasing' : 'stable';

      // Calculate size growth rate
      const currentSize = currentFiles.reduce((sum, file) => sum + file.size, 0);
      const previousSize = previousFiles.reduce((sum, file) => sum + file.size, 0);
      const sizeGrowthRate = previousSize === 0 ? 0 : 
        ((currentSize - previousSize) / previousSize) * 100;

      // Calculate user growth rate
      const currentUsers = new Set(currentFiles.map(f => f.uploadedBy)).size;
      const previousUsers = new Set(previousFiles.map(f => f.uploadedBy)).size;
      const userGrowthRate = previousUsers === 0 ? 0 : 
        ((currentUsers - previousUsers) / previousUsers) * 100;

      // Calculate performance trend
      const currentAvgTime = currentMetrics.length > 0 ? 
        currentMetrics.reduce((sum, m) => sum + m.duration, 0) / currentMetrics.length : 0;
      const previousAvgTime = previousMetrics.length > 0 ? 
        previousMetrics.reduce((sum, m) => sum + m.duration, 0) / previousMetrics.length : 0;
      
      const performanceChange = previousAvgTime === 0 ? 0 : 
        ((currentAvgTime - previousAvgTime) / previousAvgTime) * 100;
      
      const performanceTrend = performanceChange < -10 ? 'improving' : 
                              performanceChange > 10 ? 'degrading' : 'stable';

      return {
        uploadTrend,
        sizeGrowthRate: Math.round(sizeGrowthRate * 100) / 100,
        userGrowthRate: Math.round(userGrowthRate * 100) / 100,
        performanceTrend
      };
    } catch (error) {
      console.error('Failed to calculate trends:', error);
      return {
        uploadTrend: 'stable',
        sizeGrowthRate: 0,
        userGrowthRate: 0,
        performanceTrend: 'stable'
      };
    }
  }

  private calculateProjection(
    historicalData: any[],
    timeframe: UsageProjection['timeframe']
  ): UsageProjection {
    const months = timeframe === '1_month' ? 1 : 
                  timeframe === '3_months' ? 3 :
                  timeframe === '6_months' ? 6 : 12;

    // Calculate average monthly growth from historical data
    let avgSizeGrowth = 0.05; // Default 5% monthly growth
    let avgFileGrowth = 0.08; // Default 8% monthly file growth
    let confidence = 0.5; // Lower confidence for default values

    if (historicalData && historicalData.length >= 3) {
      // Calculate growth rates from historical data
      const growthRates = [];
      const fileGrowthRates = [];
      
      for (let i = 1; i < historicalData.length; i++) {
        const current = historicalData[i];
        const previous = historicalData[i - 1];
        
        if (previous.totalSize > 0) {
          const sizeGrowth = (current.totalSize - previous.totalSize) / previous.totalSize;
          growthRates.push(sizeGrowth);
        }
        
        if (previous.totalFiles > 0) {
          const fileGrowth = (current.totalFiles - previous.totalFiles) / previous.totalFiles;
          fileGrowthRates.push(fileGrowth);
        }
      }
      
      if (growthRates.length > 0) {
        avgSizeGrowth = growthRates.reduce((sum, rate) => sum + rate, 0) / growthRates.length;
        confidence = Math.min(0.9, 0.5 + (growthRates.length * 0.1));
      }
      
      if (fileGrowthRates.length > 0) {
        avgFileGrowth = fileGrowthRates.reduce((sum, rate) => sum + rate, 0) / fileGrowthRates.length;
      }
    }

    // Project forward based on compound growth
    const currentSize = historicalData?.[historicalData.length - 1]?.totalSize || 0;
    const currentFiles = historicalData?.[historicalData.length - 1]?.totalFiles || 0;
    
    const projectedSize = Math.round(currentSize * Math.pow(1 + avgSizeGrowth, months));
    const projectedFiles = Math.round(currentFiles * Math.pow(1 + avgFileGrowth, months));
    
    // Estimate Firebase Storage cost (approximate)
    const projectedSizeGB = projectedSize / (1024 * 1024 * 1024);
    const projectedCost = projectedSizeGB * 0.026 * months; // $0.026 per GB per month
    
    const assumptions = [
      `${(avgSizeGrowth * 100).toFixed(1)}% monthly storage growth assumed`,
      `${(avgFileGrowth * 100).toFixed(1)}% monthly file count growth assumed`,
      'Firebase Storage pricing at $0.026/GB/month',
      'No major changes in usage patterns or pricing'
    ];
    
    if (historicalData.length < 3) {
      assumptions.push('Limited historical data - projections based on industry averages');
    }

    return {
      timeframe,
      projectedSize,
      projectedFiles,
      projectedCost: Math.round(projectedCost * 100) / 100,
      confidence: Math.round(confidence * 100) / 100,
      assumptions
    };
  }

  private async getHistoricalUsageData(
    start: Date,
    end: Date,
    userId?: string,
    organizationId?: string
  ): Promise<any[]> {
    try {
      let analyticsQuery = query(
        collection(db, 'storage_analytics'),
        where('startDate', '>=', start),
        where('endDate', '<=', end),
        orderBy('startDate', 'asc')
      );

      // Filter by user or organization if specified
      if (userId) {
        // Get user-specific analytics if available
        const userAnalyticsQuery = query(
          collection(db, 'user_storage_analytics'),
          where('userId', '==', userId),
          where('date', '>=', start),
          where('date', '<=', end),
          orderBy('date', 'asc')
        );
        
        const userSnapshot = await getDocs(userAnalyticsQuery);
        return userSnapshot.docs.map(doc => doc.data());
      }
      
      if (organizationId) {
        // Get organization-specific analytics if available
        const orgAnalyticsQuery = query(
          collection(db, 'organization_storage_analytics'),
          where('organizationId', '==', organizationId),
          where('date', '>=', start),
          where('date', '<=', end),
          orderBy('date', 'asc')
        );
        
        const orgSnapshot = await getDocs(orgAnalyticsQuery);
        return orgSnapshot.docs.map(doc => doc.data());
      }

      // Get global analytics
      const snapshot = await getDocs(analyticsQuery);
      return snapshot.docs.map(doc => doc.data());
      
    } catch (error) {
      console.error('Failed to fetch historical usage data:', error);
      // Return mock data for development
      return this.generateMockHistoricalData(start, end);
    }
  }

  private async checkQuotaWarnings(): Promise<StorageAlert[]> {
    const alerts: StorageAlert[] = [];
    
    // Check user quotas approaching limits
    const summariesQuery = query(
      collection(db, 'storage_summary'),
      where('quotaPercentage', '>=', 80)
    );

    const snapshot = await getDocs(summariesQuery);
    snapshot.docs.forEach(doc => {
      const summary = doc.data() as StorageSummary;
      
      alerts.push({
        id: `quota_warning_${summary.userId}_${Date.now()}`,
        type: 'quota_warning',
        severity: summary.quotaPercentage >= 95 ? 'critical' : 'medium',
        title: 'Storage Quota Warning',
        description: `User ${summary.userId} is using ${summary.quotaPercentage.toFixed(1)}% of their storage quota`,
        affectedResources: [summary.userId || summary.organizationId || 'unknown'],
        recommendations: [
          'Delete unnecessary files',
          'Move old files to cold storage',
          'Consider upgrading storage plan'
        ],
        createdAt: new Date()
      });
    });

    return alerts;
  }

  private async checkPerformanceDegradation(): Promise<StorageAlert[]> {
    const alerts: StorageAlert[] = [];
    
    // Check recent performance metrics for degradation
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);

    const metricsQuery = query(
      collection(db, 'performance_metrics'),
      where('timestamp', '>=', oneDayAgo),
      where('errorCode', '!=', null)
    );

    const snapshot = await getDocs(metricsQuery);
    if (snapshot.size > 10) { // Threshold for concern
      alerts.push({
        id: `performance_alert_${Date.now()}`,
        type: 'performance_degradation',
        severity: 'medium',
        title: 'Performance Degradation Detected',
        description: `${snapshot.size} storage operations failed in the last 24 hours`,
        affectedResources: ['storage_system'],
        recommendations: [
          'Check Firebase Storage status',
          'Review error logs',
          'Consider reducing load'
        ],
        createdAt: new Date()
      });
    }

    return alerts;
  }

  private async checkComplianceViolations(): Promise<StorageAlert[]> {
    const alerts: StorageAlert[] = [];
    
    // Check for files missing required compliance fields
    const nonCompliantQuery = query(
      collection(db, 'file_metadata'),
      where('dataClassification', '==', null)
    );

    const snapshot = await getDocs(nonCompliantQuery);
    if (snapshot.size > 0) {
      alerts.push({
        id: `compliance_alert_${Date.now()}`,
        type: 'compliance_violation',
        severity: 'high',
        title: 'GDPR Compliance Issues',
        description: `${snapshot.size} files lack proper data classification`,
        affectedResources: snapshot.docs.map(doc => doc.data().storagePath),
        recommendations: [
          'Add data classification to all files',
          'Review and update file metadata',
          'Implement automated classification'
        ],
        createdAt: new Date()
      });
    }

    return alerts;
  }

  private async checkSecurityConcerns(): Promise<StorageAlert[]> {
    const alerts: StorageAlert[] = [];
    
    // Check for publicly accessible files that might be sensitive
    const publicFilesQuery = query(
      collection(db, 'file_metadata'),
      where('isPublic', '==', true),
      where('dataClassification', '==', FileClassification.PERSONAL)
    );

    const snapshot = await getDocs(publicFilesQuery);
    if (snapshot.size > 0) {
      alerts.push({
        id: `security_alert_${Date.now()}`,
        type: 'security_concern',
        severity: 'critical',
        title: 'Personal Data Publicly Accessible',
        description: `${snapshot.size} personal data files are publicly accessible`,
        affectedResources: snapshot.docs.map(doc => doc.data().storagePath),
        recommendations: [
          'Immediately restrict access to personal data files',
          'Review file access permissions',
          'Audit public file policies'
        ],
        createdAt: new Date()
      });
    }

    return alerts;
  }

  private async saveAnalytics(analytics: StorageAnalytics): Promise<void> {
    await addDoc(collection(db, 'storage_analytics'), {
      ...analytics,
      generatedAt: serverTimestamp()
    });
  }

  private async saveAlert(alert: StorageAlert): Promise<void> {
    await addDoc(collection(db, 'storage_alerts'), {
      ...alert,
      createdAt: serverTimestamp()
    });
  }

  /**
   * Generate mock historical data for development/testing
   */
  private generateMockHistoricalData(start: Date, end: Date): any[] {
    const data = [];
    const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 3600 * 24));
    const interval = Math.max(1, Math.floor(daysDiff / 12)); // Up to 12 data points
    
    for (let i = 0; i < daysDiff; i += interval) {
      const date = new Date(start.getTime() + (i * 24 * 60 * 60 * 1000));
      const baseSize = 1000000000; // 1GB base
      const growth = Math.pow(1.02, i); // 2% growth per interval
      const randomFactor = 0.8 + (Math.random() * 0.4); // ±20% randomness
      
      data.push({
        date,
        totalSize: Math.round(baseSize * growth * randomFactor),
        totalFiles: Math.round(100 * growth * randomFactor),
        uploadCount: Math.round(10 * randomFactor),
        downloadCount: Math.round(50 * randomFactor)
      });
    }
    
    return data;
  }
}

// Export singleton instance
export const storageAnalyticsService = new StorageAnalyticsService();