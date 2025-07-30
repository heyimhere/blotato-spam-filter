/**
 * Main spam detection service with caching
 */

import { SpamDetectionEngine } from './detection-engine.js';
import { MemoryCache } from '../cache/memory-cache.js';
import { getEnabledDetectionRules } from './rules/index.js';
import { createContentHash } from '../utils/hash.js';

import type { DetectionResult } from '../types/detection.js';
import type { DetectionCache } from '../types/cache.js';

export class SpamDetectionService {
  private engine: SpamDetectionEngine;
  private cache: DetectionCache;

  constructor(cache?: DetectionCache) {
    // Initialize with all enabled rules
    const rules = getEnabledDetectionRules();
    this.engine = new SpamDetectionEngine(rules);
    
    // Use provided cache or create default memory cache
    this.cache = cache || new MemoryCache();
  }

  /**
   * Analyze content for spam with caching
   */
  async analyzeContent(content: string): Promise<DetectionResult> {
    if (!content || content.trim().length === 0) {
      throw new Error('Content cannot be empty');
    }

    const contentHash = createContentHash(content);

    // Check cache first for performance
    const cachedResult = this.cache.get(contentHash);
    if (cachedResult) {
      return {
        ...cachedResult,
        processingTime: 0.1 // Cache hit is essentially instant
      };
    }

    // Analyze with detection engine
    const result = await this.engine.analyzeContent(content);

    // Cache the result for future requests
    this.cache.set(contentHash, result);

    return result;
  }

  /**
   * Analyze multiple posts in batch
   */
  async analyzeBatch(contents: string[]): Promise<DetectionResult[]> {
    if (!contents || contents.length === 0) {
      return [];
    }

    // Process all in parallel for maximum performance
    const analysisPromises = contents.map(content => 
      this.analyzeContent(content)
    );

    return Promise.all(analysisPromises);
  }

  /**
   * Get service statistics
   */
  getStats() {
    const engineStats = this.engine.getStats();
    const cacheStats = this.cache.getStats();

    return {
      engine: engineStats,
      cache: cacheStats,
      performance: {
        targetMs: engineStats.performanceTarget,
        cacheHitRate: cacheStats.hitRate
      }
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
} 