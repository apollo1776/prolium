"use strict";
/**
 * Trends Routes
 * Trending content and topics endpoints
 */
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const trends_controller_1 = require("../controllers/trends.controller");
const router = (0, express_1.Router)();
// All routes require authentication
router.use(auth_middleware_1.authMiddleware);
// Get trending data by platform
router.get('/youtube', trends_controller_1.getYouTubeTrends);
router.get('/tiktok', trends_controller_1.getTikTokTrends);
router.get('/instagram', trends_controller_1.getInstagramTrends);
exports.default = router;
//# sourceMappingURL=trends.routes.js.map