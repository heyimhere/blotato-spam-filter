/**
 * Main Express application
 */

import express from 'express';
import { createApiRoutes } from './routes/index.js';
import { setupSecurityHeaders, setupCORS, createRateLimit, sanitizeInput } from './middleware/security.js';
import { validationErrorHandler } from './middleware/validation.js';
import { globalErrorHandler, notFoundHandler } from './middleware/error-handler.js';

export function createApp(): express.Application {
  const app = express();

  // Security middleware (first)
  app.use(setupSecurityHeaders());
  app.use(setupCORS());

  // Rate limiting
  app.use(createRateLimit());

  // Body parsing
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));

  // Input sanitization
  app.use(sanitizeInput());

  // Trust proxy for accurate IP addresses
  app.set('trust proxy', 1);

  // Request logging middleware
  app.use((req, res, next) => {
    const start = Date.now();
    
    res.on('finish', () => {
      const duration = Date.now() - start;
      console.log(`${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`);
    });
    
    next();
  });

  // API routes
  app.use('/', createApiRoutes());

  // Error handling middleware (order matters)
  app.use(validationErrorHandler());
  app.use(notFoundHandler());
  app.use(globalErrorHandler());

  return app;
}

// Export app instance
export const app = createApp(); 