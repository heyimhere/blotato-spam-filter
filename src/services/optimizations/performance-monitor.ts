/**
 * Performance monitoring and optimization service
 */

export interface PerformanceMetrics {
  readonly requestCount: number;
  readonly averageProcessingTime: number;
  readonly p95ProcessingTime: number;
  readonly p99ProcessingTime: number;
  readonly cacheHitRate: number;
  readonly memoryUsage: number;
  readonly slowRequestCount: number;
  readonly errorRate: number;
}

export interface OptimizationRecommendation {
  readonly type: 'cache' | 'memory' | 'rules' | 'preprocessing';
  readonly severity: 'low' | 'medium' | 'high';
  readonly message: string;
  readonly action: string;
}

export class PerformanceMonitor {
  private processingTimes: number[] = [];
  private requestCount = 0;
  private errorCount = 0;
  private cacheHits = 0;
  private cacheMisses = 0;
  private startTime = Date.now();
  
  // Performance thresholds
  private readonly SLOW_REQUEST_THRESHOLD = 100; // ms
  private readonly MAX_MEMORY_USAGE = 100 * 1024 * 1024; // 100MB
  private readonly TARGET_CACHE_HIT_RATE = 0.6; // 60%
  private readonly MAX_PROCESSING_TIMES = 1000; // Keep last 1000 measurements

  /**
   * Record a processing time measurement
   */
  recordProcessingTime(timeMs: number): void {
    this.processingTimes.push(timeMs);
    this.requestCount++;

    // Keep only recent measurements for memory efficiency
    if (this.processingTimes.length > this.MAX_PROCESSING_TIMES) {
      this.processingTimes = this.processingTimes.slice(-this.MAX_PROCESSING_TIMES);
    }
  }

  /**
   * Record a cache hit
   */
  recordCacheHit(): void {
    this.cacheHits++;
  }

  /**
   * Record a cache miss
   */
  recordCacheMiss(): void {
    this.cacheMisses++;
  }

  /**
   * Record an error
   */
  recordError(): void {
    this.errorCount++;
  }

  /**
   * Get current performance metrics
   */
  getMetrics(): PerformanceMetrics {
    const sortedTimes = [...this.processingTimes].sort((a, b) => a - b);
    const totalRequests = this.cacheHits + this.cacheMisses;

    return {
      requestCount: this.requestCount,
      averageProcessingTime: sortedTimes.length > 0 
        ? sortedTimes.reduce((sum, time) => sum + time, 0) / sortedTimes.length 
        : 0,
      p95ProcessingTime: this.calculatePercentile(sortedTimes, 0.95),
      p99ProcessingTime: this.calculatePercentile(sortedTimes, 0.99),
      cacheHitRate: totalRequests > 0 ? this.cacheHits / totalRequests : 0,
      memoryUsage: process.memoryUsage().heapUsed,
      slowRequestCount: sortedTimes.filter(time => time > this.SLOW_REQUEST_THRESHOLD).length,
      errorRate: this.requestCount > 0 ? this.errorCount / this.requestCount : 0
    };
  }

  /**
   * Get optimization recommendations based on current metrics
   */
  getOptimizationRecommendations(): OptimizationRecommendation[] {
    const metrics = this.getMetrics();
    const recommendations: OptimizationRecommendation[] = [];

    // Cache performance recommendations
    if (metrics.cacheHitRate < this.TARGET_CACHE_HIT_RATE && metrics.requestCount > 50) {
      recommendations.push({
        type: 'cache',
        severity: 'medium',
        message: `Low cache hit rate: ${(metrics.cacheHitRate * 100).toFixed(1)}%`,
        action: 'Consider increasing cache size or TTL, or review content patterns'
      });
    }

    // Memory usage recommendations
    if (metrics.memoryUsage > this.MAX_MEMORY_USAGE) {
      recommendations.push({
        type: 'memory',
        severity: 'high',
        message: `High memory usage: ${(metrics.memoryUsage / 1024 / 1024).toFixed(1)}MB`,
        action: 'Consider cache cleanup or memory optimization'
      });
    }

    // Processing time recommendations
    if (metrics.averageProcessingTime > this.SLOW_REQUEST_THRESHOLD * 0.5) {
      recommendations.push({
        type: 'rules',
        severity: 'medium',
        message: `Slow average processing: ${metrics.averageProcessingTime.toFixed(2)}ms`,
        action: 'Consider optimizing detection rules or preprocessing'
      });
    }

    // Slow request recommendations
    if (metrics.slowRequestCount > metrics.requestCount * 0.1) {
      recommendations.push({
        type: 'preprocessing',
        severity: 'medium',
        message: `${metrics.slowRequestCount} slow requests (>${this.SLOW_REQUEST_THRESHOLD}ms)`,
        action: 'Review content preprocessing or rule complexity'
      });
    }

    // Error rate recommendations
    if (metrics.errorRate > 0.01) { // > 1% error rate
      recommendations.push({
        type: 'rules',
        severity: 'high',
        message: `High error rate: ${(metrics.errorRate * 100).toFixed(2)}%`,
        action: 'Review error handling and rule stability'
      });
    }

    return recommendations;
  }

  /**
   * Get system health status
   */
  getHealthStatus(): 'healthy' | 'degraded' | 'unhealthy' {
    const metrics = this.getMetrics();
    const recommendations = this.getOptimizationRecommendations();

    const highSeverityIssues = recommendations.filter(r => r.severity === 'high').length;
    const mediumSeverityIssues = recommendations.filter(r => r.severity === 'medium').length;

    if (highSeverityIssues > 0) {
      return 'unhealthy';
    } else if (mediumSeverityIssues > 2) {
      return 'degraded';
    } else {
      return 'healthy';
    }
  }

  /**
   * Reset metrics (useful for testing)
   */
  reset(): void {
    this.processingTimes = [];
    this.requestCount = 0;
    this.errorCount = 0;
    this.cacheHits = 0;
    this.cacheMisses = 0;
    this.startTime = Date.now();
  }

  /**
   * Get uptime in milliseconds
   */
  getUptime(): number {
    return Date.now() - this.startTime;
  }

  /**
   * Calculate percentile from sorted array
   */
  private calculatePercentile(sortedArray: number[], percentile: number): number {
    if (sortedArray.length === 0) return 0;
    
    const index = Math.ceil(sortedArray.length * percentile) - 1;
    const safeIndex = Math.max(0, Math.min(index, sortedArray.length - 1));
    return sortedArray[safeIndex] || 0;
  }

  /**
   * Get performance summary for logging
   */
  getPerformanceSummary(): string {
    const metrics = this.getMetrics();
    return [
      `Requests: ${metrics.requestCount}`,
      `Avg: ${metrics.averageProcessingTime.toFixed(2)}ms`,
      `P95: ${metrics.p95ProcessingTime.toFixed(2)}ms`,
      `Cache: ${(metrics.cacheHitRate * 100).toFixed(1)}%`,
      `Memory: ${(metrics.memoryUsage / 1024 / 1024).toFixed(1)}MB`,
      `Errors: ${(metrics.errorRate * 100).toFixed(2)}%`
    ].join(' | ');
  }
} 