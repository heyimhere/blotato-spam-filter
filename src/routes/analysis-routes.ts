/**
 * Analysis routes - spam detection endpoints
 */

import { Router } from 'express';
import { AnalysisController } from '../controllers/analysis-controller.js';
import { validateBody } from '../middleware/validation.js';
import { 
  PostAnalysisRequestSchema, 
  BatchAnalysisRequestSchema 
} from '../schemas/validation.js';

export function createAnalysisRoutes(controller?: AnalysisController): Router {
  const router = Router();
  const analysisController = controller || new AnalysisController();

  /**
   * POST /analyze - Analyze single post
   */
  router.post(
    '/analyze',
    validateBody(PostAnalysisRequestSchema),
    analysisController.analyzePost
  );

  /**
   * POST /analyze/batch - Analyze multiple posts
   */
  router.post(
    '/analyze/batch',
    validateBody(BatchAnalysisRequestSchema),
    analysisController.analyzeBatch
  );

  /**
   * GET /stats - Get analysis statistics
   */
  router.get('/stats', analysisController.getStats);

  /**
   * POST /cache/clear - Clear detection cache
   */
  router.post('/cache/clear', analysisController.clearCache);

  /**
   * POST /cache/cleanup - Cleanup expired cache entries
   */
  router.post('/cache/cleanup', analysisController.cleanupCache);

  return router;
} 