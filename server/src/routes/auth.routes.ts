/**
 * Authentication Routes
 * Defines all authentication endpoints
 */

import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { authRateLimiter, strictRateLimiter } from '../middleware/rateLimiter.middleware';
import { validateRequest } from '../middleware/validateRequest.middleware';
import { uploadProfilePicture } from '../services/upload.service';

const router = Router();

// Public routes
router.post(
  '/register',
  authRateLimiter,
  validateRequest('register'),
  AuthController.register
);

router.post(
  '/login',
  authRateLimiter,
  validateRequest('login'),
  AuthController.login
);

router.post(
  '/forgot-password',
  strictRateLimiter,
  validateRequest('forgotPassword'),
  AuthController.forgotPassword
);

router.post(
  '/reset-password',
  authRateLimiter,
  validateRequest('resetPassword'),
  AuthController.resetPassword
);

router.get('/verify-email/:token', AuthController.verifyEmail);

router.post(
  '/refresh-token',
  validateRequest('refreshToken'),
  AuthController.refreshToken
);

// Protected routes
router.post('/logout', authMiddleware, AuthController.logout);

router.get('/me', authMiddleware, AuthController.getCurrentUser);

router.post('/change-password', authMiddleware, AuthController.changePassword);

router.put('/profile', authMiddleware, AuthController.updateProfile);

// Profile picture upload routes
router.post(
  '/upload-profile-picture',
  authMiddleware,
  uploadProfilePicture.single('profilePicture'),
  AuthController.uploadProfilePicture
);

router.delete('/profile-picture', authMiddleware, AuthController.removeProfilePicture);

// 2FA routes
router.post('/2fa/setup', authMiddleware, AuthController.setup2FA);

router.post('/2fa/verify', authMiddleware, AuthController.verify2FA);

router.post('/2fa/disable', authMiddleware, AuthController.disable2FA);

// Session management routes
router.get('/sessions', authMiddleware, AuthController.getActiveSessions);

router.delete('/sessions/:sessionId', authMiddleware, AuthController.revokeSession);

export default router;
