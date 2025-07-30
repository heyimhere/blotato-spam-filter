/**
 * Promotional content detection rule
 */

import type { DetectionRule, SpamIndicator } from '../../types/detection.js';
import { RULE_WEIGHTS } from '../../config/detection.js';

export class PromotionalRule implements DetectionRule {
  readonly name = 'promotional';
  readonly type = 'promotional' as const;
  readonly weight = RULE_WEIGHTS.promotional;
  readonly enabled = true;

  // Common promotional keywords and phrases
  private readonly promotionalKeywords = [
    // Money/financial terms
    'buy now', 'limited time', 'discount', 'sale', 'offer', 'deal', 'free', 'win', 'prize',
    'money', 'cash', 'earn', 'income', 'profit', 'rich', 'wealth', 'investment',
    
    // Urgency terms  
    'urgent', 'hurry', 'act now', 'don\'t miss', 'last chance', 'expires', 'limited',
    
    // Call to action
    'click here', 'visit', 'call now', 'order now', 'subscribe', 'sign up', 'register',
    
    // Superlatives
    'amazing', 'incredible', 'unbelievable', 'guaranteed', 'exclusive', 'special',
    'best', 'top', 'premium', 'ultimate', 'perfect', 'revolutionary'
  ];

  private readonly spamPhrases = [
    'get rich quick', 'work from home', 'make money fast', 'no experience needed',
    'guaranteed income', 'financial freedom', 'be your own boss', 'easy money',
    'risk free', '100% guaranteed', 'no questions asked', 'limited time offer',
    'act now', 'don\'t wait', 'this won\'t last', 'once in a lifetime'
  ];

  async execute(content: string): Promise<SpamIndicator | null> {
    const lowerContent = content.toLowerCase();
    const evidence: string[] = [];
    let score = 0;

    // Check for spam phrases (high weight)
    for (const phrase of this.spamPhrases) {
      if (lowerContent.includes(phrase)) {
        score += 0.4;
        evidence.push(`Spam phrase detected: "${phrase}"`);
      }
    }

    // Check for promotional keywords
    const foundKeywords: string[] = [];
    for (const keyword of this.promotionalKeywords) {
      if (lowerContent.includes(keyword)) {
        foundKeywords.push(keyword);
      }
    }

    if (foundKeywords.length > 0) {
      // Score based on keyword density
      const keywordScore = Math.min(foundKeywords.length * 0.1, 0.6);
      score += keywordScore;
      evidence.push(`${foundKeywords.length} promotional keywords: ${foundKeywords.slice(0, 5).join(', ')}`);
    }

    // Check for excessive punctuation (promotional pattern)
    const exclamationCount = (content.match(/!/g) || []).length;
    if (exclamationCount > 3) {
      score += Math.min(exclamationCount * 0.05, 0.3);
      evidence.push(`Excessive exclamation marks: ${exclamationCount}`);
    }

    // Check for ALL CAPS promotional words
    const capsWords = content.match(/\b[A-Z]{3,}\b/g) || [];
    const promotionalCapsWords = capsWords.filter(word => 
      this.promotionalKeywords.some(keyword => 
        keyword.toUpperCase().includes(word)
      )
    );

    if (promotionalCapsWords.length > 0) {
      score += promotionalCapsWords.length * 0.15;
      evidence.push(`Promotional words in caps: ${promotionalCapsWords.join(', ')}`);
    }

    // Check for money symbols and numbers
    const moneyPattern = /[$€£¥₹][\d,]+|\d+\s*(dollars?|euros?|pounds?|USD|EUR|GBP)/gi;
    const moneyMatches = content.match(moneyPattern);
    if (moneyMatches && moneyMatches.length > 0) {
      score += 0.2;
      evidence.push(`Money amounts mentioned: ${moneyMatches.join(', ')}`);
    }

    if (score === 0) {
      return null;
    }

    const confidence = Math.min(score, 1.0);
    const severity = confidence > 0.7 ? 'high' : confidence > 0.4 ? 'medium' : 'low';

    return {
      type: this.type,
      severity,
      confidence,
      evidence,
      weight: this.weight
    };
  }
} 