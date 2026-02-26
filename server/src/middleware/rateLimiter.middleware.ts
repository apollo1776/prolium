/**
 * Rate Limiting Middleware
 * Prevents brute force attacks and API abuse
 */

import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';

/**
 * Rate limiter for authentication endpoints
 * 5 requests per 15 minutes per IP
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  message: {
    error: 'TooManyRequests',
    message: 'Too many authentication attempts. Please try again in 15 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => {
    // Use IP address as key
    return req.ip || req.socket.remoteAddress || 'unknown';
  },
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      error: 'TooManyRequests',
      message: 'Too many attempts. Please try again later.',
      retryAfter: Math.ceil(15 * 60), // seconds
    });
  },
});

/**
 * Rate limiter for OAuth callback endpoints
 * 10 requests per minute per IP
 */
export const oauthCallbackRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10,
  message: {
    error: 'TooManyRequests',
    message: 'Too many OAuth attempts. Please slow down.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => req.ip || 'unknown',
});

/**
 * General API rate limiter
 * 100 requests per minute per IP
 */
export const apiRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100,
  message: {
    error: 'TooManyRequests',
    message: 'Too many requests. Please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => req.ip || 'unknown',
});

/**
 * Strict rate limiter for sensitive operations
 * 3 requests per hour per IP
 */
export const strictRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  message: {
    error: 'TooManyRequests',
    message: 'Too many attempts. Please try again in an hour.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => req.ip || 'unknown',
});
