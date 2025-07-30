/**
 * Caching system types for high-performance lookups
 */

import { DetectionResult } from './detection.js';

export interface CacheEntry<T> {
  readonly value: T;
  readonly timestamp: number;
  hits: number; // Mutable for tracking usage
  readonly ttl?: number; // Time to live in milliseconds
}

export interface CacheStats {
  readonly hits: number;
  readonly misses: number;
  readonly hitRate: number;
  readonly totalEntries: number;
  readonly memoryUsage: number; // bytes
}

export interface DetectionCache {
  // Core cache operations
  get(contentHash: string): DetectionResult | null;
  set(contentHash: string, result: DetectionResult, ttl?: number): void;
  has(contentHash: string): boolean;
  delete(contentHash: string): boolean;
  clear(): void;
  
  // Performance monitoring
  getStats(): CacheStats;
  
  // Memory management
  cleanup(): number; // Returns number of expired entries removed
  getSize(): number;
}

export interface PersistentCache {
  // SQLite persistence operations
  saveResult(contentHash: string, result: DetectionResult): Promise<void>;
  loadResult(contentHash: string): Promise<DetectionResult | null>;
  cleanupExpired(): Promise<number>;
  getStorageStats(): Promise<{ totalRecords: number; dbSize: number }>;
}

export interface CacheConfig {
  readonly maxMemoryEntries: number;
  readonly defaultTtlMs: number;
  readonly cleanupIntervalMs: number;
  readonly persistResults: boolean;
  readonly sqliteDbPath: string;
} 