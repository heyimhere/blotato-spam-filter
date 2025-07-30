/**
 * Detection configuration and thresholds
 */

import type { DetectionConfig } from '../types/detection.js';

export const DETECTION_THRESHOLDS = {
  allow: 0.2,        // < 20% spam probability = allow
  flag: 0.5,         // 20-50% = flag for review
  underReview: 0.7,  // 50-70% = under review
  reject: 0.7        // > 70% = reject
} as const;

export const DEFAULT_DETECTION_CONFIG: Omit<DetectionConfig, 'rules'> = {
  thresholds: DETECTION_THRESHOLDS,
  cacheEnabled: true,
  maxCacheSize: 10000,
  performanceTargetMs: 50, // Target <50ms for optimal performance
} as const;

// Rule weights for scoring system
export const RULE_WEIGHTS = {
  profanity: 0.3,           // High impact
  repetitive_content: 0.2,   // Medium impact
  promotional: 0.25,         // High impact
  suspicious_links: 0.35,    // Very high impact
  caps_abuse: 0.15,          // Low-medium impact
  fake_engagement: 0.25,     // High impact
  character_patterns: 0.1,   // Low impact
  word_patterns: 0.2,        // Medium impact
  sentence_structure: 0.15   // Low-medium impact
} as const;

// Performance and analysis settings
export const ANALYSIS_CONFIG = {
  maxContentLength: 280,     // Twitter-like limit
  minContentLength: 1,
  
  // Character pattern thresholds
  maxCapsRatio: 0.7,         // >70% caps = suspicious
  maxRepetitiveChars: 3,     // "!!!" is okay, "!!!!" is suspicious
  
  // Word pattern thresholds
  maxRepetitiveWords: 2,     // "great great" is okay, "great great great" is not
  
  // URL detection
  maxUrlsPerPost: 2,         // More than 2 URLs = suspicious
  
  // Profanity settings
  profanityStrictness: 'medium' as 'low' | 'medium' | 'high',
} as const; 