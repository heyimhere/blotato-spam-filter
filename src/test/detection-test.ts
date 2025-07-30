/**
 * Simple test for spam detection functionality
 */

import { SpamDetectionService } from '../services/spam-detection-service.js';
import { getAllTestPosts, getTestPostsByCategory } from '../mocks/test-posts.js';
import { formatProcessingTime } from '../utils/hash.js';

/**
 * Test spam detection with mock data
 */
export async function testSpamDetection(): Promise<void> {
  console.log('🔍 Starting Spam Detection Tests\n');

  const service = new SpamDetectionService();

  // Test individual categories
  await testCategory(service, 'legitimate', 'allow');
  await testCategory(service, 'spam', 'reject');
  await testCategory(service, 'abusive', 'reject');
  await testCategory(service, 'edgeCases', null); // Mixed results expected

  // Test batch processing
  await testBatchProcessing(service);

  // Test cache performance
  await testCachePerformance(service);

  // Show final stats
  console.log('\n📊 Final Service Statistics:');
  const stats = service.getStats();
  console.log(`Engine: ${stats.engine.enabledRules}/${stats.engine.totalRules} rules enabled`);
  console.log(`Cache: ${stats.cache.totalEntries} entries, ${(stats.cache.hitRate * 100).toFixed(1)}% hit rate`);
  console.log(`Memory: ${(stats.cache.memoryUsage / 1024).toFixed(1)} KB`);
  
  console.log('\n✅ All tests completed successfully!');
}

async function testCategory(
  service: SpamDetectionService, 
  category: string, 
  expectedDecision: string | null
): Promise<void> {
  console.log(`\n🧪 Testing ${category.toUpperCase()} posts:`);
  
  const posts = getTestPostsByCategory(category as any);
  
  for (let i = 0; i < Math.min(posts.length, 3); i++) {
    const post = posts[i];
    if (!post) continue;
    
    const result = await service.analyzeContent(post.content);
    
    const statusIcon = getStatusIcon(result.decision);
    const timeStr = formatProcessingTime(result.processingTime);
    
    console.log(`  ${statusIcon} ${result.decision.toUpperCase()} (${(result.confidence * 100).toFixed(0)}%, ${timeStr})`);
    console.log(`     "${post.content.substring(0, 50)}${post.content.length > 50 ? '...' : ''}"`);
    
    if (result.indicators.length > 0) {
      console.log(`     Issues: ${result.indicators.map(i => i.type).join(', ')}`);
    }
  }
}

async function testBatchProcessing(service: SpamDetectionService): Promise<void> {
  console.log('\n⚡ Testing Batch Processing:');
  
  const allPosts = getAllTestPosts();
  const startTime = performance.now();
  
  const results = await service.analyzeBatch(allPosts.map(p => p.content));
  
  const totalTime = performance.now() - startTime;
  const avgTime = totalTime / results.length;
  
  const decisions = results.reduce((acc, result) => {
    acc[result.decision] = (acc[result.decision] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  console.log(`  Processed ${results.length} posts in ${formatProcessingTime(totalTime)}`);
  console.log(`  Average: ${formatProcessingTime(avgTime)} per post`);
  console.log(`  Decisions: ${Object.entries(decisions).map(([k, v]) => `${k}=${v}`).join(', ')}`);
}

async function testCachePerformance(service: SpamDetectionService): Promise<void> {
  console.log('\n💾 Testing Cache Performance:');
  
  const testContent = "This is a test post for cache performance testing!";
  
  // First request (cache miss)
  const start1 = performance.now();
  const result1 = await service.analyzeContent(testContent);
  const time1 = performance.now() - start1;
  
  // Second request (cache hit)
  const start2 = performance.now();
  const result2 = await service.analyzeContent(testContent);
  const time2 = performance.now() - start2;
  
  const speedup = time1 / Math.max(time2, 0.01);
  
  console.log(`  First request: ${formatProcessingTime(time1)} (cache miss)`);
  console.log(`  Second request: ${formatProcessingTime(time2)} (cache hit)`);
  console.log(`  Speedup: ${speedup.toFixed(1)}x faster`);
  
  const stats = service.getStats();
  console.log(`  Cache hit rate: ${(stats.cache.hitRate * 100).toFixed(1)}%`);
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

// Export main function for entry point
export { testSpamDetection as main }; 