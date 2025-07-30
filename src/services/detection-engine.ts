/**
 * Core spam detection engine
 */

import type { 
  DetectionResult, 
  SpamIndicator, 
  DetectionRule,
  DetectionDecision
} from '../types/detection.js';
import { createContentHash, PerformanceTimer } from '../utils/hash.js';
import { DEFAULT_DETECTION_CONFIG } from '../config/detection.js';

export class SpamDetectionEngine {
  private rules: DetectionRule[] = [];
  private readonly config = DEFAULT_DETECTION_CONFIG;

  constructor(rules: DetectionRule[] = []) {
    this.rules = [...rules];
  }

  /**
   * Add a detection rule to the engine
   */
  addRule(rule: DetectionRule): void {
    this.rules.push(rule);
  }

  /**
   * Remove a rule by name
   */
  removeRule(ruleName: string): boolean {
    const initialLength = this.rules.length;
    this.rules = this.rules.filter(rule => rule.name !== ruleName);
    return this.rules.length < initialLength;
  }

  /**
   * Get all enabled rules
   */
  getEnabledRules(): DetectionRule[] {
    return this.rules.filter(rule => rule.enabled);
  }

  /**
   * Main detection method - analyzes content and returns result
   */
  async analyzeContent(content: string): Promise<DetectionResult> {
    const timer = new PerformanceTimer();
    const contentHash = createContentHash(content);

    // Validate input
    if (!content || content.trim().length === 0) {
      return this.createEmptyResult(contentHash, timer.elapsed());
    }

    try {
      // Run all enabled rules in parallel for maximum performance
      const enabledRules = this.getEnabledRules();
      const rulePromises = enabledRules.map(rule => 
        this.executeRuleSafely(rule, content)
      );

      const ruleResults = await Promise.all(rulePromises);
      
      // Filter out null results and collect indicators
      const indicators = ruleResults.filter((result): result is SpamIndicator => 
        result !== null
      );

      // Calculate final decision based on indicators
      const result = this.calculateFinalDecision(
        indicators, 
        contentHash, 
        timer.elapsed()
      );

      return result;

    } catch (error) {
      // Fallback to safe decision on error
      console.error('Detection engine error:', error);
      return this.createErrorResult(contentHash, timer.elapsed());
    }
  }

  /**
   * Execute a rule safely with error handling
   */
  private async executeRuleSafely(
    rule: DetectionRule, 
    content: string
  ): Promise<SpamIndicator | null> {
    try {
      return await rule.execute(content);
    } catch (error) {
      console.error(`Rule "${rule.name}" failed:`, error);
      return null; // Don't let one rule failure break the entire analysis
    }
  }

  /**
   * Calculate final decision based on collected indicators
   */
  private calculateFinalDecision(
    indicators: SpamIndicator[],
    contentHash: string,
    processingTime: number
  ): DetectionResult {
    
    // Calculate weighted score
    let totalScore = 0;
    let totalWeight = 0;

    for (const indicator of indicators) {
      totalScore += indicator.confidence * indicator.weight;
      totalWeight += indicator.weight;
    }

    // Overall spam probability (0-1)
    const overallScore = totalWeight > 0 ? totalScore / totalWeight : 0;
    
    // Calculate confidence based on number of indicators and their consistency
    const confidence = this.calculateConfidence(indicators, overallScore);

    // Determine decision based on thresholds
    const decision = this.getDecisionFromScore(overallScore);

    return {
      decision,
      overallScore,
      confidence,
      indicators,
      processingTime,
      contentHash
    };
  }

  /**
   * Calculate confidence in the decision
   */
  private calculateConfidence(indicators: SpamIndicator[], overallScore: number): number {
    if (indicators.length === 0) return 1.0; // High confidence in clean content

    // More indicators generally mean higher confidence
    const indicatorFactor = Math.min(indicators.length / 3, 1); // Cap at 3 indicators
    
    // Extreme scores (very low or very high) get higher confidence
    const scoreFactor = overallScore < 0.2 || overallScore > 0.8 ? 1.0 : 0.7;
    
    // Average confidence of individual indicators
    const avgIndicatorConfidence = indicators.reduce((sum, ind) => sum + ind.confidence, 0) / indicators.length;

    return Math.min((indicatorFactor * scoreFactor * avgIndicatorConfidence), 1.0);
  }

  /**
   * Determine decision based on overall score
   */
  private getDecisionFromScore(score: number): DetectionDecision {
    const { thresholds } = this.config;
    
    if (score <= thresholds.allow) return 'allow';
    if (score <= thresholds.flag) return 'flag';
    if (score <= thresholds.underReview) return 'under_review';
    return 'reject';
  }

  /**
   * Create result for empty/invalid content
   */
  private createEmptyResult(contentHash: string, processingTime: number): DetectionResult {
    return {
      decision: 'allow',
      overallScore: 0,
      confidence: 1.0,
      indicators: [],
      processingTime,
      contentHash
    };
  }

  /**
   * Create result for error cases
   */
  private createErrorResult(contentHash: string, processingTime: number): DetectionResult {
    return {
      decision: 'under_review', // Safe fallback
      overallScore: 0.5,
      confidence: 0.1, // Low confidence due to error
      indicators: [],
      processingTime,
      contentHash
    };
  }

  /**
   * Get engine statistics
   */
  getStats() {
    return {
      totalRules: this.rules.length,
      enabledRules: this.getEnabledRules().length,
      performanceTarget: this.config.performanceTargetMs
    };
  }
} 