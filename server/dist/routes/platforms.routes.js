"use strict";
/**
 * Platforms Routes
 * Manages platform connections
 */
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const platforms_controller_1 = require("../controllers/platforms.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
// All routes require authentication
router.use(auth_middleware_1.authMiddleware);
// Get all connected platforms
router.get('/connected', platforms_controller_1.PlatformsController.getConnectedPlatforms);
// Disconnect a platform
router.delete('/:platform/disconnect', platforms_controller_1.PlatformsController.disconnectPlatform);
// Manually refresh platform token
router.post('/:platform/refresh', platforms_controller_1.PlatformsController.refreshPlatformToken);
// Get sync status for a platform
router.get('/:platform/sync-status', platforms_controller_1.PlatformsController.getSyncStatus);
exports.default = router;
//# sourceMappingURL=platforms.routes.js.map