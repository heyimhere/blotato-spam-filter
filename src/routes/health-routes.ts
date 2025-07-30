/**
 * Health check routes
 */

import { Router } from 'express';
import { HealthController } from '../controllers/health-controller.js';

export function createHealthRoutes(controller?: HealthController): Router {
  const router = Router();
  const healthController = controller || new HealthController();

  /**
   * GET /health - Basic health check
   */
  router.get('/health', healthController.healthCheck);

  /**
   * GET /health/detailed - Detailed health check with components
   */
  router.get('/health/detailed', healthController.detailedHealth);

  /**
   * GET /ready - Readiness probe
   */
  router.get('/ready', healthController.readinessCheck);

  /**
   * GET /live - Liveness probe
   */
  router.get('/live', healthController.livenessCheck);

  return router;
} 