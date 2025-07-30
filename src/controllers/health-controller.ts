/**
 * Health check controller
 */

import type { Request, Response, NextFunction } from 'express';
import type { HealthResponseOutput } from '../schemas/validation.js';
import { SpamDetectionService } from '../services/spam-detection-service.js';

export class HealthController {
  private detectionService: SpamDetectionService;
  private startTime: number;

  constructor(detectionService?: SpamDetectionService) {
    this.detectionService = detectionService || new SpamDetectionService();
    this.startTime = Date.now();
  }

  /**
   * Basic health check
   */
  healthCheck = async (
    req: Request,
    res: Response<HealthResponseOutput>,
    next: NextFunction
  ): Promise<void> => {
    try {
      const stats = this.detectionService.getStats();
      const uptime = Date.now() - this.startTime;
      
      // Determine health status
      const cacheHitRate = stats.cache.hitRate;
      const memoryUsage = stats.cache.memoryUsage;
      
      let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
      
      // Simple health checks
      if (memoryUsage > 100 * 1024 * 1024) { // > 100MB
        status = 'degraded';
      }
      
      if (cacheHitRate < 0.1 && stats.cache.totalEntries > 100) {
        status = 'degraded';
      }
      
      res.status(200).json({
        success: true,
        status,
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        uptime,
        stats: {
          totalRequests: 0, // Will be updated by analysis controller
          cacheHitRate,
          averageProcessingTime: stats.engine.performanceTarget,
          memoryUsage
        }
      });
      
    } catch (error) {
      // Health check failed
      res.status(503).json({
        success: false,
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        uptime: Date.now() - this.startTime
      });
    }
  };

  /**
   * Detailed health check with component status
   */
  detailedHealth = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const stats = this.detectionService.getStats();
      const uptime = Date.now() - this.startTime;
      const memoryInfo = process.memoryUsage();
      
      // Test detection engine
      const testResult = await this.detectionService.analyzeContent('test');
      const engineHealthy = testResult.processingTime < 100; // < 100ms
      
      res.status(200).json({
        success: true,
        status: engineHealthy ? 'healthy' : 'degraded',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        uptime,
        components: {
          detectionEngine: {
            status: engineHealthy ? 'healthy' : 'degraded',
            rulesLoaded: stats.engine.enabledRules,
            performanceTarget: stats.engine.performanceTarget,
            lastTestTime: testResult.processingTime
          },
          cache: {
            status: 'healthy',
            entries: stats.cache.totalEntries,
            hitRate: stats.cache.hitRate,
            memoryUsage: stats.cache.memoryUsage
          },
          system: {
            status: 'healthy',
            nodeVersion: process.version,
            platform: process.platform,
            uptime: process.uptime(),
            memory: {
              used: memoryInfo.heapUsed,
              total: memoryInfo.heapTotal,
              external: memoryInfo.external,
              rss: memoryInfo.rss
            }
          }
        }
      });
      
    } catch (error) {
      next(error);
    }
  };

  /**
   * Readiness probe for orchestration
   */
  readinessCheck = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      // Quick test to ensure service is ready
      await this.detectionService.analyzeContent('ready');
      
      res.status(200).json({
        ready: true,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      res.status(503).json({
        ready: false,
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  /**
   * Liveness probe for orchestration
   */
  livenessCheck = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    // Simple liveness check - if we can respond, we're alive
    res.status(200).json({
      alive: true,
      timestamp: new Date().toISOString(),
      uptime: Date.now() - this.startTime
    });
  };
} 