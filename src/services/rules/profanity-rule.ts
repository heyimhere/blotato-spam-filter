/**
 * Profanity detection rule
 */

import Filter from 'bad-words';
import type { DetectionRule, SpamIndicator } from '../../types/detection.js';
import { RULE_WEIGHTS } from '../../config/detection.js';

export class ProfanityRule implements DetectionRule {
  readonly name = 'profanity';
  readonly type = 'profanity' as const;
  readonly weight = RULE_WEIGHTS.profanity;
  readonly enabled = true;

  private filter: Filter;

  constructor() {
    this.filter = new Filter();
    
    // Add additional profanity patterns specific to social media
    this.filter.addWords('hate', 'loser', 'stupid', 'idiot', 'moron', 'dumb');
  }

  async execute(content: string): Promise<SpamIndicator | null> {
    const cleanContent = content.toLowerCase().trim();
    
    // Check for profanity
    const hasProfanity = this.filter.isProfane(cleanContent);
    
    if (!hasProfanity) {
      return null;
    }

    // Find specific profane words for evidence
    const words = cleanContent.split(/\s+/);
    const profaneWords = words.filter(word => 
      this.filter.isProfane(word)
    );

    // Calculate confidence based on number and severity of profane words
    const profanityRatio = profaneWords.length / words.length;
    const confidence = Math.min(0.8 + (profanityRatio * 0.2), 1.0);

    // Determine severity
    let severity: 'low' | 'medium' | 'high' = 'medium';
    if (profanityRatio > 0.3) {
      severity = 'high';
    } else if (profanityRatio > 0.1) {
      severity = 'medium';
    } else {
      severity = 'low';
    }

    return {
      type: this.type,
      severity,
      confidence,
      evidence: profaneWords.map(word => `Profane word: "${word}"`),
      weight: this.weight
    };
  }
} 