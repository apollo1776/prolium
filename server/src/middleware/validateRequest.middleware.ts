/**
 * Request Validation Middleware
 * Validates request body against schemas using Zod
 */

import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

// Validation schemas
const schemas = {
  register: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    name: z.string().optional(),
  }),

  login: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
    rememberMe: z.boolean().optional(),
  }),

  forgotPassword: z.object({
    email: z.string().email('Invalid email address'),
  }),

  resetPassword: z.object({
    token: z.string().min(1, 'Token is required'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
  }),

  refreshToken: z.object({
    refreshToken: z.string().optional(),
  }),
};

export const validateRequest = (schemaName: keyof typeof schemas) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const schema = schemas[schemaName];
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'ValidationError',
          message: 'Invalid request data',
          details: error.errors.map((err) => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        });
      }
      next(error);
    }
  };
};
