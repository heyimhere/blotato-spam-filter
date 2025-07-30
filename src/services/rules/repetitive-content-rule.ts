/**
 * Repetitive content detection rule
 */

import type { DetectionRule, SpamIndicator } from '../../types/detection.js';
import { RULE_WEIGHTS, ANALYSIS_CONFIG } from '../../config/detection.js';

export class RepetitiveContentRule implements DetectionRule {
  readonly name = 'repetitive_content';
  readonly type = 'repetitive_content' as const;
  readonly weight = RULE_WEIGHTS.repetitive_content;
  readonly enabled = true;

  async execute(content: string): Promise<SpamIndicator | null> {
    const indicators: string[] = [];
    let totalScore = 0;
    let maxScore = 0;

    // Check for repetitive characters
    const charScore = this.checkRepetitiveCharacters(content);
    if (charScore.score > 0) {
      indicators.push(...charScore.evidence);
      totalScore += charScore.score * 0.3;
      maxScore += 0.3;
    }

    // Check for repetitive words
    const wordScore = this.checkRepetitiveWords(content);
    if (wordScore.score > 0) {
      indicators.push(...wordScore.evidence);
      totalScore += wordScore.score * 0.4;
      maxScore += 0.4;
    }

    // Check for repetitive phrases
    const phraseScore = this.checkRepetitivePhrases(content);
    if (phraseScore.score > 0) {
      indicators.push(...phraseScore.evidence);
      totalScore += phraseScore.score * 0.3;
      maxScore += 0.3;
    }

    if (indicators.length === 0) {
      return null;
    }

    const confidence = maxScore > 0 ? totalScore / maxScore : 0;
    const severity = confidence > 0.7 ? 'high' : confidence > 0.4 ? 'medium' : 'low';

    return {
      type: this.type,
      severity,
      confidence,
      evidence: indicators,
      weight: this.weight
    };
  }

  private checkRepetitiveCharacters(content: string): { score: number; evidence: string[] } {
    const evidence: string[] = [];
    let score = 0;

    // Find sequences of repeated characters
    const repeatedChars = content.match(/(.)\1{3,}/g) || [];
    
    for (const match of repeatedChars) {
      const char = match[0];
      const count = match.length;
      
      // Score based on length of repetition
      if (count > ANALYSIS_CONFIG.maxRepetitiveChars) {
        score += Math.min((count - ANALYSIS_CONFIG.maxRepetitiveChars) * 0.2, 1);
        evidence.push(`Repeated character "${char}" ${count} times in a row`);
      }
    }

    return { score: Math.min(score, 1), evidence };
  }

  private checkRepetitiveWords(content: string): { score: number; evidence: string[] } {
    const evidence: string[] = [];
    let score = 0;

    const words = content.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2);

    const wordCounts = new Map<string, number>();
    
    for (const word of words) {
      wordCounts.set(word, (wordCounts.get(word) || 0) + 1);
    }

    for (const [word, count] of wordCounts) {
      if (count > ANALYSIS_CONFIG.maxRepetitiveWords) {
        const repetitionScore = Math.min((count - ANALYSIS_CONFIG.maxRepetitiveWords) * 0.3, 1);
        score += repetitionScore;
        evidence.push(`Word "${word}" repeated ${count} times`);
      }
    }

    return { score: Math.min(score, 1), evidence };
  }

  private checkRepetitivePhrases(content: string): { score: number; evidence: string[] } {
    const evidence: string[] = [];
    let score = 0;

    // Split into sentences and check for repetition
    const sentences = content.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 10);
    
    if (sentences.length < 2) {
      return { score: 0, evidence: [] };
    }

    const sentenceCounts = new Map<string, number>();
    
    for (const sentence of sentences) {
      const normalized = sentence.toLowerCase().replace(/[^\w\s]/g, '');
      if (normalized) {
        sentenceCounts.set(normalized, (sentenceCounts.get(normalized) || 0) + 1);
      }
    }

    for (const [sentence, count] of sentenceCounts) {
      if (count > 1) {
        score += count * 0.5;
        evidence.push(`Similar phrase repeated ${count} times`);
      }
    }

    return { score: Math.min(score, 1), evidence };
  }
} 