/**
 * High-performance in-memory cache implementation
 */

import type { DetectionResult } from '../types/detection.js';
import type { DetectionCache, CacheEntry, CacheStats } from '../types/cache.js';
import { approximateMemoryUsage } from '../utils/hash.js';

export class MemoryCache implements DetectionCache {
  private cache = new Map<string, CacheEntry<DetectionResult>>();
  private hits = 0;
  private misses = 0;
  private readonly maxEntries: number;
  private readonly defaultTtl: number;

  constructor(maxEntries = 10000, defaultTtlMs = 60 * 60 * 1000) { // 1 hour default
    this.maxEntries = maxEntries;
    this.defaultTtl = defaultTtlMs;
  }

  get(contentHash: string): DetectionResult | null {
    const entry = this.cache.get(contentHash);
    
    if (!entry) {
      this.misses++;
      return null;
    }

    // Check if entry has expired
    if (entry.ttl && Date.now() > entry.timestamp + entry.ttl) {
      this.cache.delete(contentHash);
      this.misses++;
      return null;
    }

    // Update hit count and stats
    this.hits++;
    entry.hits++;
    
    return entry.value;
  }

  set(contentHash: string, result: DetectionResult, ttl?: number): void {
    // Enforce cache size limit using LRU eviction
    if (this.cache.size >= this.maxEntries) {
      this.evictLeastRecentlyUsed();
    }

    const entry: CacheEntry<DetectionResult> = {
      value: result,
      timestamp: Date.now(),
      hits: 0,
      ttl: ttl || this.defaultTtl
    };

    this.cache.set(contentHash, entry);
  }

  has(contentHash: string): boolean {
    const entry = this.cache.get(contentHash);
    if (!entry) return false;

    // Check if expired
    if (entry.ttl && Date.now() > entry.timestamp + entry.ttl) {
      this.cache.delete(contentHash);
      return false;
    }

    return true;
  }

  delete(contentHash: string): boolean {
    return this.cache.delete(contentHash);
  }

  clear(): void {
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
  }

  getStats(): CacheStats {
    const totalRequests = this.hits + this.misses;
    const hitRate = totalRequests > 0 ? this.hits / totalRequests : 0;
    
    // Calculate approximate memory usage
    const memoryUsage = Array.from(this.cache.values())
      .reduce((total, entry) => total + approximateMemoryUsage(entry), 0);

    return {
      hits: this.hits,
      misses: this.misses,
      hitRate,
      totalEntries: this.cache.size,
      memoryUsage
    };
  }

  cleanup(): number {
    const now = Date.now();
    let removedCount = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.ttl && now > entry.timestamp + entry.ttl) {
        this.cache.delete(key);
        removedCount++;
      }
    }

    return removedCount;
  }

  getSize(): number {
    return this.cache.size;
  }

  /**
   * Evict least recently used entries when cache is full
   * Based on hit count and timestamp
   */
  private evictLeastRecentlyUsed(): void {
    if (this.cache.size === 0) return;

    // Find entry with lowest score (hits per hour)
    let lruKey: string | null = null;
    let lowestScore = Infinity;
    const now = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      const ageHours = (now - entry.timestamp) / (1000 * 60 * 60);
      const score = entry.hits / Math.max(ageHours, 0.1); // Avoid division by zero
      
      if (score < lowestScore) {
        lowestScore = score;
        lruKey = key;
      }
    }

    if (lruKey) {
      this.cache.delete(lruKey);
    }
  }

  /**
   * Get cache entries for debugging
   */
  getEntries(): Array<{ key: string; entry: CacheEntry<DetectionResult> }> {
    return Array.from(this.cache.entries()).map(([key, entry]) => ({ key, entry }));
  }
} 