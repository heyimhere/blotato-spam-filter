/**
 * Mock test data for spam detection scenarios
 */

import type { PostAnalysisRequest } from '../types/api.js';

export const LEGITIMATE_POSTS: PostAnalysisRequest[] = [
  {
    content: "Just had an amazing coffee at the local cafe! ☕ The barista really knows their craft.",
    metadata: { platform: 'twitter', userId: 'user123' }
  },
  {
    content: "Excited about the new project launch tomorrow. Team has been working so hard! 🚀",
    metadata: { platform: 'twitter', userId: 'user456' }
  },
  {
    content: "Beautiful sunset today. Nature never fails to amaze me. #photography #nature",
    metadata: { platform: 'twitter', userId: 'user789' }
  },
  {
    content: "Reading a great book about TypeScript. Learning so much about type safety!",
    metadata: { platform: 'twitter', userId: 'user101' }
  }
];

export const SPAM_POSTS: PostAnalysisRequest[] = [
  {
    content: "🔥🔥 GET RICH QUICK!!! CLICK HERE NOW!!! 💰💰💰 MAKE $5000 A DAY FROM HOME!!! 🏠💸",
    metadata: { platform: 'twitter', userId: 'spammer1' }
  },
  {
    content: "Follow me and I'll follow back!!! Like for like!!! RT for RT!!! #followback #like4like #rt4rt",
    metadata: { platform: 'twitter', userId: 'spammer2' }
  },
  {
    content: "URGENT!!! LAST CHANCE!!! BUY NOW OR MISS OUT FOREVER!!! LIMITED TIME OFFER!!!",
    metadata: { platform: 'twitter', userId: 'spammer3' }
  },
  {
    content: "Check out this AMAZING deal: http://suspicious-link.com http://another-shady-site.net http://totally-legit.biz",
    metadata: { platform: 'twitter', userId: 'spammer4' }
  },
  {
    content: "win win win win win win win win win win win win win win win prize money cash now!!!",
    metadata: { platform: 'twitter', userId: 'spammer5' }
  }
];

export const ABUSIVE_POSTS: PostAnalysisRequest[] = [
  {
    content: "This person is such an idiot and should disappear forever. Hate them so much.",
    metadata: { platform: 'twitter', userId: 'abuser1' }
  },
  {
    content: "You're all stupid morons who don't know anything. Go away and never come back.",
    metadata: { platform: 'twitter', userId: 'abuser2' }
  }
];

export const EDGE_CASE_POSTS: PostAnalysisRequest[] = [
  {
    content: "SUPER excited about this!! My team WON the championship!! AMAZING GAME!!!",
    metadata: { platform: 'twitter', userId: 'sports_fan' }
  },
  {
    content: "Check out my new blog post about web development: https://myblog.com/awesome-post",
    metadata: { platform: 'twitter', userId: 'developer' }
  },
  {
    content: "Sale Sale Sale! But this is a legitimate business offering real discounts on quality products.",
    metadata: { platform: 'twitter', userId: 'business' }
  },
  {
    content: "I really really really love this movie! It's great great and so so good!",
    metadata: { platform: 'twitter', userId: 'movie_fan' }
  },
  {
    content: "...",
    metadata: { platform: 'twitter', userId: 'minimal' }
  },
  {
    content: "a".repeat(280), // Max length test
    metadata: { platform: 'twitter', userId: 'long_content' }
  }
];

export const ALL_TEST_SCENARIOS = {
  legitimate: LEGITIMATE_POSTS,
  spam: SPAM_POSTS,
  abusive: ABUSIVE_POSTS,
  edgeCases: EDGE_CASE_POSTS
} as const;

// Quick access for testing
export const getAllTestPosts = (): PostAnalysisRequest[] => [
  ...LEGITIMATE_POSTS,
  ...SPAM_POSTS, 
  ...ABUSIVE_POSTS,
  ...EDGE_CASE_POSTS
];

export const getTestPostsByCategory = (category: keyof typeof ALL_TEST_SCENARIOS) => {
  return ALL_TEST_SCENARIOS[category];
}; 