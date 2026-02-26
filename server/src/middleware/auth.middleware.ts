/**
 * Authentication Middleware
 * Validates JWT tokens and protects routes
 */

import { Request, Response, NextFunction } from 'express';
import { TokenService } from '../services/token.service';

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        email: string;
      };
    }
  }
}

export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Get token from Authorization header or cookies
    let token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      token = req.cookies.accessToken;
    }

    if (!token) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'No authentication token provided',
      });
    }

    // Verify token
    const payload = TokenService.verifyAccessToken(token);

    // Attach user to request
    req.user = {
      userId: payload.userId,
      email: payload.email,
    };

    next();
  } catch (error: any) {
    if (error.message === 'Token expired') {
      return res.status(401).json({
        error: 'TokenExpired',
        message: 'Authentication token expired',
      });
    }

    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid authentication token',
    });
  }
};

/**
 * Optional auth middleware - doesn't fail if no token
 */
export const optionalAuthMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    let token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      token = req.cookies.accessToken;
    }

    if (token) {
      const payload = TokenService.verifyAccessToken(token);
      req.user = {
        userId: payload.userId,
        email: payload.email,
      };
    }

    next();
  } catch (error) {
    // Continue without auth
    next();
  }
};
