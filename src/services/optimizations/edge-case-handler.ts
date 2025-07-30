/**
 * Edge case handler for challenging content scenarios
 */

import { ContentPreprocessor, type PreprocessedContent } from './content-preprocessor.js';
import type { DetectionResult, SpamIndicator } from '../../types/detection.js';

export interface EdgeCaseResult {
  readonly handled: boolean;
  readonly reason: string;
  readonly result?: DetectionResult;
  readonly recommendedAction: 'allow' | 'flag' | 'reject' | 'manual_review';
}

export class EdgeCaseHandler {

  /**
   * Handle edge cases before main detection
   */
  static handleEdgeCase(content: string): EdgeCaseResult {
    try {
      // Preprocess content first
      const preprocessed = ContentPreprocessor.preprocess(content);

      // Check for various edge cases
      const emptyContentResult = this.handleEmptyContent(preprocessed);
      if (emptyContentResult.handled) return emptyContentResult;

      const extremeLengthResult = this.handleExtremeLength(preprocessed);
      if (extremeLengthResult.handled) return extremeLengthResult;

      const encodingResult = this.handleEncodingIssues(preprocessed);
      if (encodingResult.handled) return encodingResult;

      const obfuscationResult = this.handleObfuscation(preprocessed);
      if (obfuscationResult.handled) return obfuscationResult;

      const languageResult = this.handleNonEnglishContent(preprocessed);
      if (languageResult.handled) return languageResult;

      const specialCharacterResult = this.handleSpecialCharacters(preprocessed);
      if (specialCharacterResult.handled) return specialCharacterResult;

      const contextualResult = this.handleContextualEdgeCases(preprocessed);
      if (contextualResult.handled) return contextualResult;

      return {
        handled: false,
        reason: 'No edge cases detected',
        recommendedAction: 'allow'
      };

    } catch (error) {
      return {
        handled: true,
        reason: `Preprocessing error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        recommendedAction: 'manual_review',
        result: this.createErrorResult(content, 'preprocessing_error')
      };
    }
  }

  /**
   * Handle empty or whitespace-only content
   */
  private static handleEmptyContent(preprocessed: PreprocessedContent): EdgeCaseResult {
    if (preprocessed.normalized.trim().length === 0) {
      return {
        handled: true,
        reason: 'Empty content after preprocessing',
        recommendedAction: 'reject',
        result: this.createEmptyContentResult(preprocessed.original)
      };
    }

    if (preprocessed.metadata.wordCount === 0) {
      return {
        handled: true,
        reason: 'No meaningful words found',
        recommendedAction: 'reject',
        result: this.createEmptyContentResult(preprocessed.original)
      };
    }

    return { handled: false, reason: '', recommendedAction: 'allow' };
  }

  /**
   * Handle extremely short or long content
   */
  private static handleExtremeLength(preprocessed: PreprocessedContent): EdgeCaseResult {
    const { characterCount, wordCount } = preprocessed.metadata;

    // Extremely short content (likely test or spam)
    if (characterCount < 3 && wordCount === 1) {
      return {
        handled: true,
        reason: 'Extremely short content',
        recommendedAction: 'flag',
        result: this.createShortContentResult(preprocessed.original)
      };
    }

    // Extremely long content (potential spam or attack)
    if (characterCount > 2000) {
      return {
        handled: true,
        reason: 'Content exceeds reasonable length',
        recommendedAction: 'flag',
        result: this.createLongContentResult(preprocessed.original)
      };
    }

    return { handled: false, reason: '', recommendedAction: 'allow' };
  }

  /**
   * Handle encoding and character issues
   */
  private static handleEncodingIssues(preprocessed: PreprocessedContent): EdgeCaseResult {
    const { original, normalized } = preprocessed;

    // Check for significant character loss during preprocessing
    const originalLength = original.length;
    const normalizedLength = normalized.length;
    const reductionRatio = (originalLength - normalizedLength) / originalLength;

    if (reductionRatio > 0.5 && originalLength > 20) {
      return {
        handled: true,
        reason: 'Significant character loss during preprocessing - possible encoding issues',
        recommendedAction: 'manual_review',
        result: this.createEncodingResult(original)
      };
    }

    // Check for repeated Unicode issues
    const unicodeIssues = /[\uFFFD\u0000-\u001F\u007F-\u009F]/g;
    const issueCount = (original.match(unicodeIssues) || []).length;
    
    if (issueCount > 5) {
      return {
        handled: true,
        reason: 'Multiple Unicode encoding issues detected',
        recommendedAction: 'manual_review',
        result: this.createEncodingResult(original)
      };
    }

    return { handled: false, reason: '', recommendedAction: 'allow' };
  }

  /**
   * Handle advanced obfuscation attempts
   */
  private static handleObfuscation(preprocessed: PreprocessedContent): EdgeCaseResult {
    const { original, normalized } = preprocessed;

    // Check for zero-width character abuse
    const zeroWidthChars = /[\u200B\u200C\u200D\u2060\uFEFF]/g;
    const zeroWidthCount = (original.match(zeroWidthChars) || []).length;
    
    if (zeroWidthCount > 10) {
      return {
        handled: true,
        reason: 'Excessive zero-width characters detected (obfuscation attempt)',
        recommendedAction: 'reject',
        result: this.createObfuscationResult(original, 'zero_width_abuse')
      };
    }

    // Check for homograph attacks (lookalike characters)
    const homographPattern = /[а-я].*[a-z]|[a-z].*[а-я]/i; // Cyrillic mixed with Latin
    if (homographPattern.test(original)) {
      return {
        handled: true,
        reason: 'Potential homograph attack detected',
        recommendedAction: 'flag',
        result: this.createObfuscationResult(original, 'homograph_attack')
      };
    }

    // Check for excessive symbol substitution
    const symbolCount = (original.match(/[0-9@$!]/g) || []).length;
    const letterCount = (original.match(/[a-zA-Z]/g) || []).length;
    
    if (letterCount > 0 && symbolCount / letterCount > 0.3) {
      return {
        handled: true,
        reason: 'Excessive symbol substitution detected',
        recommendedAction: 'flag',
        result: this.createObfuscationResult(original, 'symbol_substitution')
      };
    }

    return { handled: false, reason: '', recommendedAction: 'allow' };
  }

  /**
   * Handle non-English content
   */
  private static handleNonEnglishContent(preprocessed: PreprocessedContent): EdgeCaseResult {
    const { language, wordCount } = preprocessed.metadata;

    // If language detection is uncertain and content is short, flag for review
    if (language === 'unknown' && wordCount > 5 && wordCount < 20) {
      return {
        handled: true,
        reason: 'Unknown language with suspicious length',
        recommendedAction: 'flag',
        result: this.createLanguageResult(preprocessed.original)
      };
    }

    return { handled: false, reason: '', recommendedAction: 'allow' };
  }

  /**
   * Handle special character patterns
   */
  private static handleSpecialCharacters(preprocessed: PreprocessedContent): EdgeCaseResult {
    const { original } = preprocessed;

    // Check for ASCII art or excessive special characters
    const specialCharPattern = /[^\w\s.,!?@#-]/g;
    const specialCharCount = (original.match(specialCharPattern) || []).length;
    const totalCharCount = original.length;

    if (totalCharCount > 50 && specialCharCount / totalCharCount > 0.4) {
      return {
        handled: true,
        reason: 'Excessive special characters detected',
        recommendedAction: 'flag',
        result: this.createSpecialCharResult(original)
      };
    }

    return { handled: false, reason: '', recommendedAction: 'allow' };
  }

  /**
   * Handle contextual edge cases
   */
  private static handleContextualEdgeCases(preprocessed: PreprocessedContent): EdgeCaseResult {
    const { hasUrls, hasHashtags, hasMentions, wordCount } = preprocessed.metadata;

    // Pure link/hashtag spam with minimal text
    if ((hasUrls || hasHashtags) && wordCount < 3) {
      return {
        handled: true,
        reason: 'Minimal text with URLs/hashtags',
        recommendedAction: 'flag',
        result: this.createContextualResult(preprocessed.original, 'link_spam')
      };
    }

    // Excessive mentions (potential spam)
    const mentionCount = (preprocessed.original.match(/@\w+/g) || []).length;
    if (mentionCount > 5) {
      return {
        handled: true,
        reason: `Excessive mentions: ${mentionCount}`,
        recommendedAction: 'flag',
        result: this.createContextualResult(preprocessed.original, 'mention_spam')
      };
    }

    return { handled: false, reason: '', recommendedAction: 'allow' };
  }

  // Helper methods to create specific result types
  private static createEmptyContentResult(content: string): DetectionResult {
    return this.createSpecialResult(content, 'reject', 'Empty or meaningless content', []);
  }

  private static createShortContentResult(content: string): DetectionResult {
    return this.createSpecialResult(content, 'flag', 'Extremely short content', []);
  }

  private static createLongContentResult(content: string): DetectionResult {
    return this.createSpecialResult(content, 'flag', 'Content exceeds length limits', []);
  }

  private static createEncodingResult(content: string): DetectionResult {
    return this.createSpecialResult(content, 'under_review', 'Encoding issues detected', []);
  }

  private static createObfuscationResult(content: string, type: string): DetectionResult {
    const indicator: SpamIndicator = {
      type: 'character_patterns',
      severity: 'high',
      confidence: 0.9,
      evidence: [`Obfuscation detected: ${type}`],
      weight: 0.8
    };
    return this.createSpecialResult(content, 'reject', 'Obfuscation attempt', [indicator]);
  }

  private static createLanguageResult(content: string): DetectionResult {
    return this.createSpecialResult(content, 'flag', 'Language detection issues', []);
  }

  private static createSpecialCharResult(content: string): DetectionResult {
    return this.createSpecialResult(content, 'flag', 'Excessive special characters', []);
  }

  private static createContextualResult(content: string, type: string): DetectionResult {
    return this.createSpecialResult(content, 'flag', `Contextual issue: ${type}`, []);
  }

  private static createErrorResult(content: string, errorType: string): DetectionResult {
    return this.createSpecialResult(content, 'under_review', `Processing error: ${errorType}`, []);
  }

  private static createSpecialResult(
    content: string, 
    decision: DetectionResult['decision'],
    reason: string,
    indicators: SpamIndicator[]
  ): DetectionResult {
    return {
      decision,
      overallScore: decision === 'reject' ? 0.9 : decision === 'flag' ? 0.5 : 0.3,
      confidence: 0.8,
      indicators,
      processingTime: 1.0, // Edge case handling is fast
      contentHash: `edge_case_${Date.now()}`
    };
  }
} 