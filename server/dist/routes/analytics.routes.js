"use strict";
/**
 * Analytics Routes
 * AI-powered analytics endpoints
 */
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const analytics_controller_1 = require("../controllers/analytics.controller");
const router = (0, express_1.Router)();
// All routes require authentication
router.use(auth_middleware_1.authMiddleware);
// Get YouTube statistics
router.get('/youtube/stats', analytics_controller_1.getYouTubeStats);
// Get YouTube historical analytics (REAL data from YouTube Analytics API)
router.get('/youtube/historical', analytics_controller_1.getYouTubeHistoricalData);
// Get AI-powered YouTube analysis
router.get('/youtube', analytics_controller_1.getYouTubeAnalysis);
// Analyze YouTube comments
router.get('/youtube/comments', analytics_controller_1.analyzeYouTubeComments);
// Get cross-platform insights
router.get('/insights', analytics_controller_1.getCrossPlatformInsights);
exports.default = router;
//# sourceMappingURL=analytics.routes.js.map