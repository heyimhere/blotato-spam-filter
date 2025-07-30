/**
 * Edge case testing for the enhanced spam detection system
 */

import { EnhancedSpamDetectionService } from '../services/enhanced-spam-detection-service.js';
import { EdgeCaseHandler } from '../services/optimizations/edge-case-handler.js';
import { formatProcessingTime } from '../utils/hash.js';

// Edge case test scenarios
const EDGE_CASE_SCENARIOS = {
  empty: [
    '',
    '   ',
    '\n\n\n',
    '\t\t\t'
  ],
  
  obfuscation: [
    'Fr33 m0n3y n0w!!!', // L33t speak
    'F‌R‌E‌E M‌O‌N‌E‌Y', // Zero-width joiners
    'Frее mоnеy', // Cyrillic lookalikes
    'F.R.E.E   M.O.N.E.Y', // Excessive spacing
  ],
  
  encoding: [
    'Caf\u00E9 is great!', // Accented characters
    'This is a test\uFFFD message', // Replacement character
    'Hello\u2019s world\u2014great!', // Smart quotes and em dash
    'Test\u00A0message\u00A0here', // Non-breaking spaces
  ],
  
  extremeLength: [
    'Hi', // Very short
    'a'.repeat(500), // Very long
    'word '.repeat(100), // Many repeated words
    '!'.repeat(50) + ' content here', // Excessive punctuation
  ],
  
  specialCharacters: [
    '████████████████████████', // Block characters
    '░▒▓█▓▒░░▒▓█▓▒░░▒▓█▓▒░', // Pattern characters
    '💰💎🔥⚡✨🌟💫⭐', // Excessive emojis
    '←↑→↓↔↕↖↗↘↙↚↛', // Arrow characters
  ],
  
  contextual: [
    '@user1 @user2 @user3 @user4 @user5 @user6 spam', // Many mentions
    '#hashtag #spam #lots #of #tags #here #excessive', // Many hashtags
    'http://spam.com http://more-spam.com http://even-more.spam', // Many URLs
    'RT @spam RT @more RT @excessive RT @retweets RT @here', // Retweet spam
  ],
  
  unicode: [
    '𝒯𝒽𝒾𝓈 𝒾𝓈 𝒻𝒶𝓃𝒸𝓎 𝓉𝑒𝓍𝓉', // Mathematical script
    '🅃🄷🄸🅂 🄸🅂 🅂🅀🅄🄰🅁🄴 🅃🄴🅇🅃', // Squared text
    'Ｔｈｉｓ　ｉｓ　ｆｕｌｌｗｉｄｔｈ　ｔｅｘｔ', // Fullwidth characters
    'T͎h͎i͎s͎ ͎i͎s͎ ͎u͎n͎d͎e͎r͎l͎i͎n͎e͎d͎', // Combining underlines
  ]
};

export async function testEdgeCases(): Promise<void> {
  console.log('🔬 Starting Edge Case Tests\n');

  const service = new EnhancedSpamDetectionService();

  // Test each category
  await testCategory(service, 'Empty Content', EDGE_CASE_SCENARIOS.empty);
  await testCategory(service, 'Obfuscation Attempts', EDGE_CASE_SCENARIOS.obfuscation);
  await testCategory(service, 'Encoding Issues', EDGE_CASE_SCENARIOS.encoding);
  await testCategory(service, 'Extreme Length', EDGE_CASE_SCENARIOS.extremeLength);
  await testCategory(service, 'Special Characters', EDGE_CASE_SCENARIOS.specialCharacters);
  await testCategory(service, 'Contextual Edge Cases', EDGE_CASE_SCENARIOS.contextual);
  await testCategory(service, 'Unicode Variants', EDGE_CASE_SCENARIOS.unicode);

  // Test edge case handler directly
  await testEdgeCaseHandler();

  // Test performance under edge cases
  await testEdgeCasePerformance(service);

  // Show final stats
  console.log('\n📊 Final Edge Case Statistics:');
  const stats = service.getStats();
  console.log(`Performance: ${stats.summary}`);
  console.log(`Health: ${stats.health.status}`);
  
  if (stats.health.recommendations.length > 0) {
    console.log('Recommendations:');
    stats.health.recommendations.forEach(rec => 
      console.log(`  - ${rec.severity.toUpperCase()}: ${rec.message}`)
    );
  }

  console.log('\n✅ Edge case tests completed successfully!');
}

async function testCategory(
  service: EnhancedSpamDetectionService,
  categoryName: string,
  testCases: string[]
): Promise<void> {
  console.log(`\n🧪 Testing ${categoryName}:`);

  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i];
    if (!testCase && testCase !== '') continue; // Skip undefined, but allow empty strings
    
    try {
      const result = await service.analyzeContent(testCase);
      const displayContent = testCase.length > 30 
        ? testCase.substring(0, 30) + '...' 
        : testCase || '[empty]';
      
      const statusIcon = getStatusIcon(result.decision);
      const timeStr = formatProcessingTime(result.processingTime);
      
      console.log(`  ${statusIcon} ${result.decision.toUpperCase()} (${(result.confidence * 100).toFixed(0)}%, ${timeStr})`);
      console.log(`     "${displayContent}"`);
      
      if (result.indicators.length > 0) {
        console.log(`     Issues: ${result.indicators.map(i => i.type).join(', ')}`);
      }
      
    } catch (error) {
      console.log(`  ❌ ERROR: ${error instanceof Error ? error.message : 'Unknown error'}`);
      console.log(`     "${testCase.substring(0, 30)}..."`);
    }
  }
}

async function testEdgeCaseHandler(): Promise<void> {
  console.log('\n🎛️ Testing Edge Case Handler Directly:');

  const testCases = [
    { content: '', expected: 'handled' },
    { content: 'Fr33 m0n3y!!!', expected: 'handled' },
    { content: 'Normal content here', expected: 'not handled' },
    { content: '@spam @spam @spam @spam @spam @spam', expected: 'handled' }
  ];

  for (const testCase of testCases) {
    const result = EdgeCaseHandler.handleEdgeCase(testCase.content);
    const status = result.handled ? '✅ HANDLED' : '⚪ NOT HANDLED';
    
    console.log(`  ${status}: "${testCase.content || '[empty]'}"`);
    if (result.handled) {
      console.log(`    Reason: ${result.reason}`);
      console.log(`    Action: ${result.recommendedAction}`);
    }
  }
}

async function testEdgeCasePerformance(service: EnhancedSpamDetectionService): Promise<void> {
  console.log('\n⚡ Testing Edge Case Performance:');

  // Create a mix of edge cases and normal content
  const mixedContent = [
    ...EDGE_CASE_SCENARIOS.empty.slice(0, 2),
    ...EDGE_CASE_SCENARIOS.obfuscation.slice(0, 2),
    'This is normal content',
    'Another normal post here',
    ...EDGE_CASE_SCENARIOS.specialCharacters.slice(0, 2)
  ];

  const startTime = performance.now();
  const results = await service.analyzeBatch(mixedContent);
  const totalTime = performance.now() - startTime;
  const avgTime = totalTime / results.length;

  console.log(`  Processed ${results.length} mixed cases in ${formatProcessingTime(totalTime)}`);
  console.log(`  Average: ${formatProcessingTime(avgTime)} per case`);

  const decisions = results.reduce((acc, result) => {
    acc[result.decision] = (acc[result.decision] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  console.log(`  Decisions: ${Object.entries(decisions).map(([k, v]) => `${k}=${v}`).join(', ')}`);
}

function getStatusIcon(decision: string): string {
  switch (decision) {
    case 'allow': return '✅';
    case 'flag': return '⚠️';
    case 'under_review': return '🔍';
    case 'reject': return '❌';
    default: return '❓';
  }
}

// Export for use in main test runner
export default testEdgeCases; 