/**
 * Caps abuse detection rule - detects excessive capitalization
 */

import type { DetectionRule, SpamIndicator } from '../../types/detection.js';
import { RULE_WEIGHTS, ANALYSIS_CONFIG } from '../../config/detection.js';

export class CapsAbuseRule implements DetectionRule {
  readonly name = 'caps_abuse';
  readonly type = 'caps_abuse' as const;
  readonly weight = RULE_WEIGHTS.caps_abuse;
  readonly enabled = true;

  async execute(content: string): Promise<SpamIndicator | null> {
    const text = content.trim();
    
    if (text.length < 3) {
      return null; // Too short to determine caps abuse
    }

    // Count alphabetic characters
    const letters = text.match(/[a-zA-Z]/g) || [];
    const upperCaseLetters = text.match(/[A-Z]/g) || [];
    
    if (letters.length === 0) {
      return null; // No letters to analyze
    }

    const capsRatio = upperCaseLetters.length / letters.length;
    
    // Only flag if exceeds threshold
    if (capsRatio <= ANALYSIS_CONFIG.maxCapsRatio) {
      return null;
    }

    // Calculate severity and confidence
    let severity: 'low' | 'medium' | 'high' = 'low';
    let confidence = 0.6;

    if (capsRatio > 0.9) {
      severity = 'high';
      confidence = 0.9;
    } else if (capsRatio > 0.8) {
      severity = 'medium';
      confidence = 0.75;
    }

    // Look for patterns that indicate legitimate caps usage
    const hasHashtags = /\#[A-Z]+/g.test(text);
    const hasAcronyms = /\b[A-Z]{2,5}\b/g.test(text);
    
    // Reduce confidence if legitimate caps usage detected
    if (hasHashtags || hasAcronyms) {
      confidence *= 0.7;
      if (severity === 'high') severity = 'medium';
    }

    const evidence = [
      `${(capsRatio * 100).toFixed(1)}% of letters are capitalized`,
      `Threshold: ${(ANALYSIS_CONFIG.maxCapsRatio * 100).toFixed(1)}%`
    ];

    return {
      type: this.type,
      severity,
      confidence,
      evidence,
      weight: this.weight
    };
  }
} 