/**
 * Fake engagement detection rule
 */

import type { DetectionRule, SpamIndicator } from '../../types/detection.js';
import { RULE_WEIGHTS } from '../../config/detection.js';

export class FakeEngagementRule implements DetectionRule {
  readonly name = 'fake_engagement';
  readonly type = 'fake_engagement' as const;
  readonly weight = RULE_WEIGHTS.fake_engagement;
  readonly enabled = true;

  // Common fake engagement patterns
  private readonly engagementPatterns = [
    // Follow-for-follow patterns
    'follow for follow', 'f4f', 'follow4follow', 'followforfollow',
    'follow back', 'follow me', 'followback', 'follow train',
    
    // Like-for-like patterns  
    'like for like', 'l4l', 'like4like', 'likeforlike',
    'like back', 'like this', 'likeback',
    
    // Retweet patterns
    'rt for rt', 'r4r', 'rt4rt', 'retweet for retweet',
    'retweet back', 'rt back', 'rtback',
    
    // General engagement baiting
    'engagement', 'boost this', 'help me grow', 'grow my account',
    'need followers', 'gain followers', 'get followers',
    'mutual follow', 'mutual following', 'follow everyone back'
  ];

  private readonly hashtagPatterns = [
    '#followback', '#f4f', '#follow4follow', '#followforfollow',
    '#like4like', '#l4l', '#likeforlike', '#likeback',
    '#rt4rt', '#retweet4retweet', '#rtback', '#followtrain',
    '#gainfollow', '#needfollowers', '#followme', '#followeveryone'
  ];

  private readonly suspiciousNumbers = [
    // Common follower count mentions
    /follow.*(\d{1,3}[k]|\d{4,})/gi,      // "follow me to 10k"
    /(\d{1,3}[k]|\d{4,}).*follow/gi,      // "10k followers"
    /\d+\s*%.*follow/gi,                  // "100% follow back"  
    /follow.*\d+\s*%/gi                   // "follow back 100%"
  ];

  async execute(content: string): Promise<SpamIndicator | null> {
    const lowerContent = content.toLowerCase();
    const evidence: string[] = [];
    let score = 0;

    // Check for fake engagement phrases
    const foundPatterns: string[] = [];
    for (const pattern of this.engagementPatterns) {
      if (lowerContent.includes(pattern)) {
        foundPatterns.push(pattern);
        score += 0.4; // High penalty for fake engagement
      }
    }

    if (foundPatterns.length > 0) {
      evidence.push(`Fake engagement phrases: ${foundPatterns.slice(0, 3).join(', ')}`);
    }

    // Check for fake engagement hashtags
    const foundHashtags: string[] = [];
    for (const hashtag of this.hashtagPatterns) {
      if (lowerContent.includes(hashtag)) {
        foundHashtags.push(hashtag);
        score += 0.3;
      }
    }

    if (foundHashtags.length > 0) {
      evidence.push(`Fake engagement hashtags: ${foundHashtags.slice(0, 3).join(', ')}`);
    }

    // Check for suspicious number patterns
    for (const pattern of this.suspiciousNumbers) {
      const matches = content.match(pattern);
      if (matches) {
        score += 0.25;
        evidence.push(`Suspicious follower mention: "${matches[0]}"`);
      }
    }

    // Check for excessive follow-related hashtags
    const followHashtags = (content.match(/#follow\w*/gi) || []).length;
    const likeHashtags = (content.match(/#like\w*/gi) || []).length;
    const rtHashtags = (content.match(/#rt\w*/gi) || []).length;
    
    const totalEngagementHashtags = followHashtags + likeHashtags + rtHashtags;
    if (totalEngagementHashtags > 3) {
      score += totalEngagementHashtags * 0.1;
      evidence.push(`Excessive engagement hashtags: ${totalEngagementHashtags}`);
    }

    // Check for promise patterns ("I follow everyone back", "100% follow back")
    const promisePatterns = [
      /i follow.*back/gi,
      /follow.*everyone.*back/gi,
      /100%.*follow/gi,
      /always follow back/gi,
      /instant follow back/gi
    ];

    for (const pattern of promisePatterns) {
      if (pattern.test(content)) {
        score += 0.35;
        evidence.push('Contains follow-back promise');
        break;
      }
    }

    // Check for multiple call-to-action verbs
    const actionWords = ['follow', 'like', 'rt', 'retweet', 'share', 'comment'];
    const foundActions = actionWords.filter(action => 
      lowerContent.includes(action)
    );

    if (foundActions.length > 2) {
      score += foundActions.length * 0.1;
      evidence.push(`Multiple engagement actions: ${foundActions.join(', ')}`);
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