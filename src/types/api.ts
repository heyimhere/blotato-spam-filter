/**
 * API types for request/response handling
 */

import { DetectionResult } from './detection.js';

export interface PostMetadata {
  readonly timestamp?: string;
  readonly userId?: string;
  readonly platform: 'twitter';
  readonly contentLength?: number;
}

export interface PostAnalysisRequest {
  readonly content: string;
  readonly metadata?: PostMetadata;
}

export interface PostAnalysisResponse {
  readonly success: boolean;
  readonly result: DetectionResult;
  readonly message?: string;
}

export interface BatchAnalysisRequest {
  readonly posts: readonly PostAnalysisRequest[];
}

export interface BatchAnalysisResponse {
  readonly success: boolean;
  readonly results: readonly DetectionResult[];
  readonly totalProcessingTime: number;
  readonly averageProcessingTime: number;
}

// Error handling types
export interface ApiError {
  readonly success: false;
  readonly error: {
    readonly code: string;
    readonly message: string;
    readonly details?: unknown;
  };
}

export type ApiResponse<T> = T | ApiError; 