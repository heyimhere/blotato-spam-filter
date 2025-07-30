/**
 * Analysis controller - handles spam detection requests
 */

import type { Request, Response, NextFunction } from 'express';
import { SpamDetectionService } from '../services/spam-detection-service.js';
import type { 
  PostAnalysisRequestInput, 
  BatchAnalysisRequestInput,
  PostAnalysisResponseOutput,
  BatchAnalysisResponseOutput 
} from '../schemas/validation.js';

export class AnalysisController {
  private detectionService: SpamDetectionService;
  private requestCount = 0;
  private totalProcessingTime = 0;

  constructor(detectionService?: SpamDetectionService) {
    this.detectionService = detectionService || new SpamDetectionService();
  }

  /**
   * Analyze a single post for spam/abuse
   */
  analyzePost = async (
    req: Request<{}, PostAnalysisResponseOutput, PostAnalysisRequestInput>,
    res: Response<PostAnalysisResponseOutput>,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { content, metadata } = req.body;
      
      // Track request
      this.requestCount++;
      
      // Analyze content
      const result = await this.detectionService.analyzeContent(content);
      
      // Track processing time
      this.totalProcessingTime += result.processingTime;
      
      // Return successful response
      res.status(200).json({
        success: true,
        result: result as any, // Type compatibility workaround
        message: `Content analyzed in ${result.processingTime.toFixed(2)}ms`
      });
      
    } catch (error) {
      next(error); // Pass to error handler
    }
  };

  /**
   * Analyze multiple posts in batch
   */
  analyzeBatch = async (
    req: Request<{}, BatchAnalysisResponseOutput, BatchAnalysisRequestInput>,
    res: Response<BatchAnalysisResponseOutput>,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { posts } = req.body;
      
      if (posts.length === 0) {
        res.status(400).json({
          success: false,
          results: [],
          totalProcessingTime: 0,
          averageProcessingTime: 0
        } as any); // Type assertion for error case
        return;
      }
      
      // Track request
      this.requestCount++;
      
      const startTime = performance.now();
      
      // Extract content from posts
      const contents = posts.map(post => post.content);
      
      // Analyze all posts
      const results = await this.detectionService.analyzeBatch(contents);
      
      const totalProcessingTime = performance.now() - startTime;
      const averageProcessingTime = totalProcessingTime / results.length;
      
      // Track processing time
      this.totalProcessingTime += totalProcessingTime;
      
      // Return successful response
      res.status(200).json({
        success: true,
        results: results as any, // Type compatibility workaround
        totalProcessingTime,
        averageProcessingTime
      });
      
    } catch (error) {
      next(error); // Pass to error handler
    }
  };

  /**
   * Get analysis statistics
   */
  getStats = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const serviceStats = this.detectionService.getStats();
      
      const controllerStats = {
        totalRequests: this.requestCount,
        averageProcessingTime: this.requestCount > 0 
          ? this.totalProcessingTime / this.requestCount 
          : 0,
        uptime: process.uptime() * 1000, // Convert to milliseconds
        memoryUsage: process.memoryUsage().heapUsed
      };
      
      res.status(200).json({
        success: true,
        stats: {
          ...controllerStats,
          service: serviceStats
        }
      });
      
    } catch (error) {
      next(error);
    }
  };

  /**
   * Clear detection cache
   */
  clearCache = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      this.detectionService.clearCache();
      
      res.status(200).json({
        success: true,
        message: 'Cache cleared successfully'
      });
      
    } catch (error) {
      next(error);
    }
  };

  /**
   * Cleanup expired cache entries
   */
  cleanupCache = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const removedCount = this.detectionService.cleanupCache();
      
      res.status(200).json({
        success: true,
        message: `Cleaned up ${removedCount} expired cache entries`,
        removedCount
      });
      
    } catch (error) {
      next(error);
    }
  };
} 