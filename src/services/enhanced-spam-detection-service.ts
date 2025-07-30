/**
 * Enhanced spam detection service with optimizations and edge case handling
 */

import { SpamDetectionEngine } from './detection-engine.js';
import { MemoryCache } from '../cache/memory-cache.js';
import { getEnabledDetectionRules } from './rules/index.js';
import { EdgeCaseHandler } from './optimizations/edge-case-handler.js';
import { PerformanceMonitor } from './optimizations/performance-monitor.js';
import { createContentHash } from '../utils/hash.js';

import type { DetectionResult } from '../types/detection.js';
import type { DetectionCache } from '../types/cache.js';

export class EnhancedSpamDetectionService {
  private engine: SpamDetectionEngine;
  private cache: DetectionCache;
  private performanceMonitor: PerformanceMonitor;

  constructor(cache?: DetectionCache) {
    // Initialize components
    const rules = getEnabledDetectionRules();
    this.engine = new SpamDetectionEngine(rules);
    this.cache = cache || new MemoryCache();
    this.performanceMonitor = new PerformanceMonitor();
  }

  /**
   * Enhanced content analysis with edge case handling and performance monitoring
   */
  async analyzeContent(content: string): Promise<DetectionResult> {
    const startTime = performance.now();
    
    try {
      // Step 1: Input validation
      if (!content || content.trim().length === 0) {
        throw new Error('Content cannot be empty');
      }

      // Step 2: Check edge cases first (fast path)
      const edgeCase = EdgeCaseHandler.handleEdgeCase(content);
      if (edgeCase.handled && edgeCase.result) {
        const processingTime = performance.now() - startTime;
        this.performanceMonitor.recordProcessingTime(processingTime);
        
        return {
          ...edgeCase.result,
          processingTime
        };
      }

      // Step 3: Check cache
      const contentHash = createContentHash(content);
      const cachedResult = this.cache.get(contentHash);
      
      if (cachedResult) {
        this.performanceMonitor.recordCacheHit();
        const processingTime = performance.now() - startTime;
        
        return {
          ...cachedResult,
          processingTime: processingTime // Update with current timing
        };
      }

      // Step 4: Perform full analysis
      this.performanceMonitor.recordCacheMiss();
      const result = await this.engine.analyzeContent(content);
      
      // Step 5: Cache the result
      this.cache.set(contentHash, result);
      
      // Step 6: Record performance metrics
      const processingTime = performance.now() - startTime;
      this.performanceMonitor.recordProcessingTime(processingTime);

      return {
        ...result,
        processingTime
      };

    } catch (error) {
      // Record error and return safe fallback
      this.performanceMonitor.recordError();
      const processingTime = performance.now() - startTime;
      
      console.error('Enhanced detection error:', error);
      
      return {
        decision: 'under_review',
        overallScore: 0.5,
        confidence: 0.1,
        indicators: [],
        processingTime,
        contentHash: createContentHash(content)
      };
    }
  }

  /**
   * Enhanced batch analysis with performance optimization
   */
  async analyzeBatch(contents: string[]): Promise<DetectionResult[]> {
    if (!contents || contents.length === 0) {
      return [];
    }

    const startTime = performance.now();

    try {
      // Process all in parallel for maximum performance
      const analysisPromises = contents.map(content => 
        this.analyzeContent(content)
      );

      const results = await Promise.all(analysisPromises);
      
      // Record batch processing time
      const totalTime = performance.now() - startTime;
      this.performanceMonitor.recordProcessingTime(totalTime / contents.length);

      return results;

    } catch (error) {
      this.performanceMonitor.recordError();
      console.error('Batch analysis error:', error);
      
      // Return error results for all contents
      return contents.map(content => ({
        decision: 'under_review' as const,
        overallScore: 0.5,
        confidence: 0.1,
        indicators: [],
        processingTime: 1.0,
        contentHash: createContentHash(content)
      }));
    }
  }

  /**
   * Get comprehensive service statistics
   */
  getStats() {
    const engineStats = this.engine.getStats();
    const cacheStats = this.cache.getStats();
    const performanceMetrics = this.performanceMonitor.getMetrics();
    const recommendations = this.performanceMonitor.getOptimizationRecommendations();
    const healthStatus = this.performanceMonitor.getHealthStatus();

    return {
      engine: engineStats,
      cache: cacheStats,
      performance: performanceMetrics,
      health: {
        status: healthStatus,
        recommendations: recommendations.slice(0, 5), // Top 5 recommendations
        uptime: this.performanceMonitor.getUptime()
      },
      summary: this.performanceMonitor.getPerformanceSummary()
    };
  }

  /**
   * Get health status for monitoring
   */
  getHealthStatus(): 'healthy' | 'degraded' | 'unhealthy' {
    return this.performanceMonitor.getHealthStatus();
  }

  /**
   * Get optimization recommendations
   */
  getOptimizationRecommendations() {
    return this.performanceMonitor.getOptimizationRecommendations();
  }

  /**
   * Perform maintenance operations
   */
  performMaintenance(): {
    cacheCleanup: number;
    recommendations: any[];
    healthStatus: string;
  } {
    // Cleanup expired cache entries
    const removedEntries = this.cache.cleanup();
    
    // Get current recommendations
    const recommendations = this.getOptimizationRecommendations();
    
    // Get health status
    const healthStatus = this.getHealthStatus();

    // Log maintenance summary
    console.log(`Maintenance completed: removed ${removedEntries} cache entries, ${recommendations.length} recommendations, status: ${healthStatus}`);

    return {
      cacheCleanup: removedEntries,
      recommendations,
      healthStatus
    };
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Cleanup expired cache entries
   */
  cleanupCache(): number {
    return this.cache.cleanup();
  }

  /**
   * Get cache size
   */
  getCacheSize(): number {
    return this.cache.getSize();
  }

  /**
   * Reset performance metrics (useful for testing)
   */
  resetMetrics(): void {
    this.performanceMonitor.reset();
  }
} 