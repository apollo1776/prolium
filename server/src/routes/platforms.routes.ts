/**
 * Platforms Routes
 * Manages platform connections
 */

import { Router } from 'express';
import { PlatformsController } from '../controllers/platforms.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// Get all connected platforms
router.get('/connected', PlatformsController.getConnectedPlatforms);

// Disconnect a platform
router.delete('/:platform/disconnect', PlatformsController.disconnectPlatform);

// Manually refresh platform token
router.post('/:platform/refresh', PlatformsController.refreshPlatformToken);

// Get sync status for a platform
router.get('/:platform/sync-status', PlatformsController.getSyncStatus);

export default router;
