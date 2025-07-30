/**
 * Content preprocessing for edge case handling
 */

export interface PreprocessedContent {
  readonly original: string;
  readonly normalized: string;
  readonly metadata: {
    readonly hasEmojis: boolean;
    readonly hasUrls: boolean;
    readonly hasHashtags: boolean;
    readonly hasMentions: boolean;
    readonly wordCount: number;
    readonly characterCount: number;
    readonly language?: string;
    readonly encoding: string;
  };
}

export class ContentPreprocessor {
  
  /**
   * Preprocess content for better analysis
   */
  static preprocess(content: string): PreprocessedContent {
    if (!content || typeof content !== 'string') {
      throw new Error('Content must be a non-empty string');
    }

    const original = content;
    let normalized = content;

    // Step 1: Handle encoding issues
    normalized = this.fixEncoding(normalized);

    // Step 2: Normalize Unicode characters
    normalized = this.normalizeUnicode(normalized);

    // Step 3: Handle obfuscation attempts
    normalized = this.handleObfuscation(normalized);

    // Step 4: Preserve important patterns while normalizing
    normalized = this.smartNormalization(normalized);

    // Generate metadata
    const metadata = this.generateMetadata(original, normalized);

    return {
      original,
      normalized,
      metadata
    };
  }

  /**
   * Fix common encoding issues
   */
  private static fixEncoding(content: string): string {
    return content
      // Fix common HTML entities
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      // Fix common Unicode issues
      .replace(/\u00A0/g, ' ') // Non-breaking space
      .replace(/\u2019/g, "'") // Right single quotation mark
      .replace(/\u201C/g, '"') // Left double quotation mark
      .replace(/\u201D/g, '"') // Right double quotation mark
      .replace(/\u2013/g, '-') // En dash
      .replace(/\u2014/g, '--') // Em dash
      .replace(/\u2026/g, '...'); // Horizontal ellipsis
  }

  /**
   * Normalize Unicode characters
   */
  private static normalizeUnicode(content: string): string {
    // Normalize to NFC form for consistent character representation
    const normalized = content.normalize('NFC');
    
    // Handle zero-width characters used for obfuscation
    return normalized
      .replace(/[\u200B\u200C\u200D\u2060\uFEFF]/g, '') // Zero-width chars
      .replace(/[\u00AD]/g, ''); // Soft hyphens
  }

  /**
   * Handle common obfuscation techniques
   */
  private static handleObfuscation(content: string): string {
    let result = content;

    // Handle letter substitution (l33t speak and similar)
    const substitutions: Record<string, string> = {
      '0': 'o', '1': 'i', '3': 'e', '4': 'a', '5': 's', 
      '7': 't', '8': 'b', '@': 'a', '$': 's', '!': 'i'
    };

    // Apply substitutions selectively (only in suspicious contexts)
    if (this.hasSuspiciousPatterns(content)) {
      for (const [obfuscated, normal] of Object.entries(substitutions)) {
        const regex = new RegExp(obfuscated, 'gi');
        result = result.replace(regex, normal);
      }
    }

    // Handle excessive spacing
    result = result.replace(/\s{3,}/g, ' '); // Multiple spaces to single

    // Handle mixed case obfuscation in suspicious contexts
    if (this.hasSuspiciousPatterns(result)) {
      // Normalize words that are likely intentionally obfuscated
      result = result.replace(/\b[A-Za-z]*[A-Z][a-z]+[A-Z][A-Za-z]*\b/g, (match) => {
        return match.toLowerCase();
      });
    }

    return result;
  }

  /**
   * Check if content has suspicious patterns that might indicate obfuscation
   */
  private static hasSuspiciousPatterns(content: string): boolean {
    const suspiciousPatterns = [
      /\b(f|F)r[3e]{2,}/, // "free" variations
      /\b(m|M)[0o]n[3e]y/, // "money" variations  
      /\b(w|W)[1i]n/, // "win" variations
      /\$\d+/, // Money amounts
      /\b\d{3,}-?\d{3,}-?\d{4,}\b/, // Phone numbers
      /[A-Z]{3,}.*[!]{2,}/, // CAPS with exclamation
    ];

    return suspiciousPatterns.some(pattern => pattern.test(content));
  }

  /**
   * Smart normalization that preserves important patterns
   */
  private static smartNormalization(content: string): string {
    let result = content;

    // Preserve URLs while normalizing around them
    const urlRegex = /https?:\/\/[^\s]+/gi;
    const urls = content.match(urlRegex) || [];
    const urlPlaceholders: string[] = [];

    // Replace URLs with placeholders
    urls.forEach((url, index) => {
      const placeholder = `__URL_${index}__`;
      urlPlaceholders[index] = url;
      result = result.replace(url, placeholder);
    });

    // Normalize the rest of the content
    result = result
      .trim()
      .replace(/\s+/g, ' ') // Multiple whitespace to single space
      .replace(/([.!?])\1{2,}/g, '$1$1$1'); // Limit repeated punctuation to max 3

    // Restore URLs
    urls.forEach((url, index) => {
      const placeholder = `__URL_${index}__`;
      result = result.replace(placeholder, url);
    });

    return result;
  }

  /**
   * Generate metadata about the content
   */
  private static generateMetadata(original: string, normalized: string): PreprocessedContent['metadata'] {
    const hasEmojis = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u.test(original);
    const hasUrls = /https?:\/\/[^\s]+/i.test(original);
    const hasHashtags = /#\w+/.test(original);
    const hasMentions = /@\w+/.test(original);
    
    // Simple word counting (handles Unicode better)
    const words = normalized.trim().split(/\s+/).filter(word => word.length > 0);
    const wordCount = words.length;
    const characterCount = normalized.length;

    // Basic language detection (very simple)
    const language = this.detectBasicLanguage(normalized);
    
    return {
      hasEmojis,
      hasUrls,
      hasHashtags,
      hasMentions,
      wordCount,
      characterCount,
      language,
      encoding: 'utf-8'
    };
  }

  /**
   * Basic language detection
   */
  private static detectBasicLanguage(content: string): string {
    // Very basic language detection based on common patterns
    const englishWords = /\b(the|and|is|in|to|of|a|that|it|with|for|as|was|on|are|you)\b/gi;
    const englishMatches = (content.match(englishWords) || []).length;
    
    if (englishMatches > 2) {
      return 'en';
    }
    
    return 'unknown';
  }
} 