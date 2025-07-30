/**
 * Security middleware configuration
 */

import helmet from 'helmet';
import cors from 'cors';
import type { Request, Response, NextFunction } from 'express';

/**
 * Configure security headers with helmet
 */
export function setupSecurityHeaders() {
  return helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: false, // Allow for API usage
  });
}

/**
 * Configure CORS for secure cross-origin access
 */
export function setupCORS() {
  const allowedOrigins = [
    'http://localhost:3000',    // Local development
    'http://localhost:3001',    // Alt local dev port
    'https://your-frontend.vercel.app', // Vercel frontend
    // Add more allowed origins as needed
  ];

  return cors({
    origin: (origin, callback) => {
      // Allow no origin (mobile apps, Postman, etc.)
      if (!origin) return callback(null, true);
      
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    maxAge: 86400 // 24 hours
  });
}

/**
 * Rate limiting middleware (simple implementation)
 */
export function createRateLimit() {
  const requests = new Map<string, { count: number; resetTime: number }>();
  const maxRequests = 100; // requests per window
  const windowMs = 15 * 60 * 1000; // 15 minutes

  return (req: Request, res: Response, next: NextFunction): void => {
    const clientId = req.ip || 'unknown';
    const now = Date.now();
    
    const clientRequests = requests.get(clientId);
    
    if (!clientRequests || now > clientRequests.resetTime) {
      // Reset or initialize
      requests.set(clientId, {
        count: 1,
        resetTime: now + windowMs
      });
      next();
    } else if (clientRequests.count < maxRequests) {
      // Increment count
      clientRequests.count++;
      next();
    } else {
      // Rate limit exceeded
      res.status(429).json({
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many requests, please try again later',
          details: {
            maxRequests,
            windowMs,
            resetTime: new Date(clientRequests.resetTime).toISOString()
          }
        }
      });
    }
  };
}

/**
 * Request sanitization middleware
 */
export function sanitizeInput() {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Basic input sanitization
    if (req.body && typeof req.body === 'object') {
      sanitizeObject(req.body);
    }
    
    if (req.query && typeof req.query === 'object') {
      sanitizeObject(req.query);
    }
    
    next();
  };
}

function sanitizeObject(obj: any): void {
  for (const key in obj) {
    if (typeof obj[key] === 'string') {
      // Remove potential XSS characters
      obj[key] = obj[key]
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
        .trim();
    } else if (typeof obj[key] === 'object' && obj[key] !== null) {
      sanitizeObject(obj[key]);
    }
  }
} 