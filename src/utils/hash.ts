/**
 * Utility functions for hashing and performance measurement
 */

import { createHash } from 'crypto';
import { performance } from 'perf_hooks';

/**
 * Create a fast hash of content for caching purposes
 * Uses SHA-256 for good distribution and reasonable speed
 */
export function createContentHash(content: string): string {
  return createHash('sha256')
    .update(content.trim().toLowerCase()) // Normalize for consistent hashing
    .digest('hex')
    .substring(0, 16); // Use first 16 chars for shorter keys
}

/**
 * Simple performance timer utility
 */
export class PerformanceTimer {
  private startTime: number;

  constructor() {
    this.startTime = performance.now();
  }

  /**
   * Get elapsed time in milliseconds
   */
  elapsed(): number {
    return performance.now() - this.startTime;
  }

  /**
   * Reset the timer
   */
  reset(): void {
    this.startTime = performance.now();
  }

  /**
   * Get elapsed time and reset
   */
  elapsedAndReset(): number {
    const elapsed = this.elapsed();
    this.reset();
    return elapsed;
  }
}

/**
 * Format processing time for consistent display
 */
export function formatProcessingTime(ms: number): string {
  if (ms < 1) {
    return `${(ms * 1000).toFixed(0)}μs`;
  } else if (ms < 1000) {
    return `${ms.toFixed(2)}ms`;
  } else {
    return `${(ms / 1000).toFixed(2)}s`;
  }
}

/**
 * Calculate memory usage of an object (approximate)
 */
export function approximateMemoryUsage(obj: unknown): number {
  const str = JSON.stringify(obj);
  return Buffer.byteLength(str, 'utf8');
} 