/**
 * Main routes registry
 */

import { Router } from 'express';
import { createAnalysisRoutes } from './analysis-routes.js';
import { createHealthRoutes } from './health-routes.js';

export function createApiRoutes(): Router {
  const router = Router();

  // Health routes (no /api prefix for standard probes)
  router.use('/', createHealthRoutes());

  // API routes with /api prefix
  router.use('/api', createAnalysisRoutes());

  // API info endpoint
  router.get('/api', (req, res) => {
    res.json({
      success: true,
      name: 'Blotato Spam Filter API',
      version: '1.0.0',
      description: 'Minimal service for detecting spammy or abusive posts in Twitter-like social media APIs',
      endpoints: {
        analysis: {
          'POST /api/analyze': 'Analyze single post for spam/abuse',
          'POST /api/analyze/batch': 'Analyze multiple posts in batch',
          'GET /api/stats': 'Get analysis statistics'
        },
        cache: {
          'POST /api/cache/clear': 'Clear detection cache',
          'POST /api/cache/cleanup': 'Cleanup expired cache entries'
        },
        health: {
          'GET /health': 'Basic health check',
          'GET /health/detailed': 'Detailed health with components',
          'GET /ready': 'Readiness probe',
          'GET /live': 'Liveness probe'
        }
      }
    });
  });

  return router;
} 