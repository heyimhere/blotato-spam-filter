/**
 * Detection rules registry
 */

import { ProfanityRule } from './profanity-rule.js';
import { CapsAbuseRule } from './caps-abuse-rule.js';
import { RepetitiveContentRule } from './repetitive-content-rule.js';
import { PromotionalRule } from './promotional-rule.js';
import { SuspiciousLinksRule } from './suspicious-links-rule.js';
import { FakeEngagementRule } from './fake-engagement-rule.js';

import type { DetectionRule } from '../../types/detection.js';

/**
 * Get all available detection rules
 */
export function getAllDetectionRules(): DetectionRule[] {
  return [
    new ProfanityRule(),
    new CapsAbuseRule(),
    new RepetitiveContentRule(),
    new PromotionalRule(),
    new SuspiciousLinksRule(),
    new FakeEngagementRule()
  ];
}

/**
 * Get enabled detection rules only
 */
export function getEnabledDetectionRules(): DetectionRule[] {
  return getAllDetectionRules().filter(rule => rule.enabled);
}

/**
 * Get a specific rule by name
 */
export function getDetectionRule(name: string): DetectionRule | null {
  return getAllDetectionRules().find(rule => rule.name === name) || null;
}

/**
 * Export individual rules for testing
 */
export {
  ProfanityRule,
  CapsAbuseRule,
  RepetitiveContentRule,
  PromotionalRule,
  SuspiciousLinksRule,
  FakeEngagementRule
}; 