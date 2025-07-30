/**
 * Zod validation schemas for API requests and responses
 */

import { z } from 'zod';

// Post analysis request validation
export const PostAnalysisRequestSchema = z.object({
  content: z.string()
    .min(1, 'Content cannot be empty')
    .max(280, 'Content exceeds Twitter character limit'),
  metadata: z.object({
    timestamp: z.string().optional(),
    userId: z.string().optional(),
    platform: z.literal('twitter'),
    contentLength: z.number().optional()
  }).optional()
});

// Batch analysis request validation
export const BatchAnalysisRequestSchema = z.object({
  posts: z.array(PostAnalysisRequestSchema)
    .min(1, 'At least one post required')
    .max(50, 'Maximum 50 posts per batch')
});

// Detection result validation
export const DetectionResultSchema = z.object({
  decision: z.enum(['allow', 'flag', 'reject', 'under_review']),
  overallScore: z.number().min(0).max(1),
  confidence: z.number().min(0).max(1),
  indicators: z.array(z.object({
    type: z.enum([
      'profanity',
      'repetitive_content', 
      'promotional',
      'suspicious_links',
      'caps_abuse',
      'fake_engagement',
      'character_patterns',
      'word_patterns',
      'sentence_structure'
    ]),
    severity: z.enum(['low', 'medium', 'high']),
    confidence: z.number().min(0).max(1),
    evidence: z.array(z.string()).readonly(),
    weight: z.number()
  })).readonly(),
  processingTime: z.number(),
  contentHash: z.string()
});

// API response validation
export const PostAnalysisResponseSchema = z.object({
  success: z.boolean(),
  result: DetectionResultSchema,
  message: z.string().optional()
});

export const BatchAnalysisResponseSchema = z.object({
  success: z.boolean(),
  results: z.array(DetectionResultSchema),
  totalProcessingTime: z.number(),
  averageProcessingTime: z.number()
});

// Error response validation
export const ApiErrorSchema = z.object({
  success: z.literal(false),
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.unknown().optional()
  })
});

// Health check response
export const HealthResponseSchema = z.object({
  success: z.boolean(),
  status: z.enum(['healthy', 'degraded', 'unhealthy']),
  timestamp: z.string(),
  version: z.string(),
  uptime: z.number(),
  stats: z.object({
    totalRequests: z.number(),
    cacheHitRate: z.number(),
    averageProcessingTime: z.number(),
    memoryUsage: z.number()
  }).optional()
});

// Type inference from schemas
export type PostAnalysisRequestInput = z.infer<typeof PostAnalysisRequestSchema>;
export type BatchAnalysisRequestInput = z.infer<typeof BatchAnalysisRequestSchema>;
export type PostAnalysisResponseOutput = z.infer<typeof PostAnalysisResponseSchema>;
export type BatchAnalysisResponseOutput = z.infer<typeof BatchAnalysisResponseSchema>;
export type ApiErrorOutput = z.infer<typeof ApiErrorSchema>;
export type HealthResponseOutput = z.infer<typeof HealthResponseSchema>; 