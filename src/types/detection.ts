/**
 * Core types for spam detection system
 */

export type SpamIndicatorType = 
  | 'profanity'
  | 'repetitive_content'
  | 'promotional'
  | 'suspicious_links'
  | 'caps_abuse'
  | 'fake_engagement'
  | 'character_patterns'
  | 'word_patterns'
  | 'sentence_structure';

export type SeverityLevel = 'low' | 'medium' | 'high';

export type DetectionDecision = 'allow' | 'flag' | 'reject' | 'under_review';

export interface SpamIndicator {
  readonly type: SpamIndicatorType;
  readonly severity: SeverityLevel;
  readonly confidence: number; // 0-1
  readonly evidence: readonly string[];
  readonly weight: number; // Rule weight for scoring
}

export interface DetectionResult {
  readonly decision: DetectionDecision;
  readonly overallScore: number; // 0-1 spam probability
  readonly confidence: number; // 0-1 confidence in decision
  readonly indicators: readonly SpamIndicator[];
  readonly processingTime: number; // milliseconds
  readonly contentHash: string; // For caching
}

export interface DetectionRule {
  readonly name: string;
  readonly type: SpamIndicatorType;
  readonly weight: number;
  readonly enabled: boolean;
  execute(content: string): Promise<SpamIndicator | null>;
}

export interface DetectionConfig {
  readonly thresholds: {
    readonly allow: number;      // < threshold = allow
    readonly flag: number;       // allow < x < flag = flag  
    readonly underReview: number; // flag < x < underReview = under_review
    readonly reject: number;     // > reject = reject
  };
  readonly rules: readonly DetectionRule[];
  readonly cacheEnabled: boolean;
  readonly maxCacheSize: number;
  readonly performanceTargetMs: number;
} 