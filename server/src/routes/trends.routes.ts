/**
 * Trends Routes
 * Trending content and topics endpoints
 */

import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import { getYouTubeTrends, getTikTokTrends, getInstagramTrends } from '../controllers/trends.controller';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// Get trending data by platform
router.get('/youtube', getYouTubeTrends);
router.get('/tiktok', getTikTokTrends);
router.get('/instagram', getInstagramTrends);

export default router;
