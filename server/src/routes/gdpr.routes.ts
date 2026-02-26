/**
 * GDPR Routes
 * Data export and account deletion endpoints
 */

import { Router } from 'express';
import { GDPRController } from '../controllers/gdpr.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { strictRateLimiter } from '../middleware/rateLimiter.middleware';

const router = Router();

// All routes require authentication
router.post('/export', authMiddleware, strictRateLimiter, GDPRController.exportData);

router.post('/delete-account', authMiddleware, strictRateLimiter, GDPRController.deleteAccount);

export default router;
