/**
 * Global error handling middleware
 */

import type { Request, Response, NextFunction } from 'express';

export interface AppError extends Error {
  statusCode?: number;
  code?: string;
  details?: unknown;
}

/**
 * Global error handler
 */
export function globalErrorHandler() {
  return (
    error: AppError,
    req: Request,
    res: Response,
    next: NextFunction
  ): void => {
    // Log error
    console.error('API Error:', {
      message: error.message,
      stack: error.stack,
      url: req.url,
      method: req.method,
      body: req.body,
      timestamp: new Date().toISOString()
    });

    // Determine status code
    const statusCode = error.statusCode || 500;
    
    // Determine error code
    const errorCode = error.code || (statusCode === 500 ? 'INTERNAL_SERVER_ERROR' : 'BAD_REQUEST');

    // Send error response
    res.status(statusCode).json({
      success: false,
      error: {
        code: errorCode,
        message: statusCode === 500 ? 'Internal server error' : error.message,
        details: process.env.NODE_ENV === 'development' ? error.details || error.stack : undefined
      }
    });
  };
}

/**
 * 404 Not Found handler
 */
export function notFoundHandler() {
  return (req: Request, res: Response, next: NextFunction): void => {
    res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: `Endpoint ${req.method} ${req.path} not found`,
        details: {
          availableEndpoints: [
            'POST /api/analyze',
            'POST /api/analyze/batch',
            'GET /api/stats',
            'GET /health',
            'GET /ready',
            'GET /live'
          ]
        }
      }
    });
  };
}

/**
 * Async error wrapper for route handlers
 */
export function asyncHandler<T extends Request, U extends Response>(
  fn: (req: T, res: U, next: NextFunction) => Promise<void>
) {
  return (req: T, res: U, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
} 