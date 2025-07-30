/**
 * Suspicious links detection rule
 */

import type { DetectionRule, SpamIndicator } from '../../types/detection.js';
import { RULE_WEIGHTS, ANALYSIS_CONFIG } from '../../config/detection.js';

export class SuspiciousLinksRule implements DetectionRule {
  readonly name = 'suspicious_links';
  readonly type = 'suspicious_links' as const;
  readonly weight = RULE_WEIGHTS.suspicious_links;
  readonly enabled = true;

  // Suspicious domains and patterns
  private readonly suspiciousDomains = [
    'bit.ly', 'tinyurl.com', 'short.link', 'rb.gy', 't.co',
    'goo.gl', 'ow.ly', 'buff.ly', 'tiny.cc', 'is.gd'
  ];

  private readonly suspiciousPatterns = [
    /\b\w+\.tk\b/gi,        // .tk domains (often used for spam)
    /\b\w+\.ml\b/gi,        // .ml domains  
    /\b\w+\.ga\b/gi,        // .ga domains
    /\b\w+\.cf\b/gi,        // .cf domains
    /\d+\.\d+\.\d+\.\d+/g,  // IP addresses instead of domains
    /[a-z0-9-]+\.(?:biz|info|click|download|top)/gi // Suspicious TLDs
  ];

  private readonly maliciousKeywords = [
    'phishing', 'malware', 'virus', 'hack', 'crack', 'keygen',
    'download-now', 'click-here', 'get-free', 'no-survey'
  ];

  async execute(content: string): Promise<SpamIndicator | null> {
    const evidence: string[] = [];
    let score = 0;

    // Extract URLs
    const urlRegex = /https?:\/\/[^\s]+/gi;
    const urls = content.match(urlRegex) || [];

    if (urls.length === 0) {
      return null; // No URLs to analyze
    }

    // Check URL count
    if (urls.length > ANALYSIS_CONFIG.maxUrlsPerPost) {
      score += (urls.length - ANALYSIS_CONFIG.maxUrlsPerPost) * 0.3;
      evidence.push(`Too many URLs: ${urls.length} (max recommended: ${ANALYSIS_CONFIG.maxUrlsPerPost})`);
    }

    // Check for shortened URLs
    const shortenedUrls = urls.filter(url => 
      this.suspiciousDomains.some(domain => url.includes(domain))
    );

    if (shortenedUrls.length > 0) {
      score += shortenedUrls.length * 0.4;
      evidence.push(`Shortened URLs detected: ${shortenedUrls.length}`);
    }

    // Check for suspicious patterns
    for (const pattern of this.suspiciousPatterns) {
      const matches = content.match(pattern);
      if (matches) {
        score += matches.length * 0.5;
        evidence.push(`Suspicious domain pattern: ${matches[0]}`);
      }
    }

    // Check for malicious keywords in URLs
    const maliciousUrls = urls.filter(url =>
      this.maliciousKeywords.some(keyword => 
        url.toLowerCase().includes(keyword)
      )
    );

    if (maliciousUrls.length > 0) {
      score += maliciousUrls.length * 0.6;
      evidence.push(`URLs with suspicious keywords: ${maliciousUrls.length}`);
    }

    // Check for URL disguising (different text vs actual URL)
    const urlsWithText = content.match(/\[([^\]]+)\]\(([^)]+)\)/g);
    if (urlsWithText) {
      for (const match of urlsWithText) {
        const linkMatch = match.match(/\[([^\]]+)\]\(([^)]+)\)/);
        if (linkMatch && linkMatch[1] && linkMatch[2]) {
          const text = linkMatch[1];
          const url = linkMatch[2];
          if (text.toLowerCase().includes('click here') || 
              text.toLowerCase().includes('download') ||
              text.toLowerCase() !== url.toLowerCase()) {
            score += 0.3;
            evidence.push(`Misleading link text: "${text}"`);
          }
        }
      }
    }

    // Check for multiple URLs to same domain (potential spam)
    const domains = urls.map(url => {
      try {
        return new URL(url).hostname.toLowerCase();
      } catch {
        return null;
      }
    }).filter(Boolean);

    const domainCounts = new Map<string, number>();
    for (const domain of domains) {
      if (domain) {
        domainCounts.set(domain, (domainCounts.get(domain) || 0) + 1);
      }
    }

    for (const [domain, count] of domainCounts) {
      if (count > 2) {
        score += (count - 2) * 0.2;
        evidence.push(`Multiple links to same domain: ${domain} (${count} times)`);
      }
    }

    if (score === 0) {
      return null;
    }

    const confidence = Math.min(score, 1.0);
    const severity = confidence > 0.8 ? 'high' : confidence > 0.5 ? 'medium' : 'low';

    return {
      type: this.type,
      severity,
      confidence,
      evidence,
      weight: this.weight
    };
  }
} 