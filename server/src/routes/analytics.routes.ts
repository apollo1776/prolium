/**
 * Analytics Routes
 * AI-powered analytics endpoints
 */

import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import {
  getYouTubeAnalysis,
  getYouTubeStats,
  getCrossPlatformInsights,
  analyzeYouTubeComments,
  getYouTubeHistoricalData,
} from '../controllers/analytics.controller';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// Get YouTube statistics
router.get('/youtube/stats', getYouTubeStats);

// Get YouTube historical analytics (REAL data from YouTube Analytics API)
router.get('/youtube/historical', getYouTubeHistoricalData);

// Get AI-powered YouTube analysis
router.get('/youtube', getYouTubeAnalysis);

// Analyze YouTube comments
router.get('/youtube/comments', analyzeYouTubeComments);

// Get cross-platform insights
router.get('/insights', getCrossPlatformInsights);

export default router;
