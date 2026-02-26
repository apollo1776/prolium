"use strict";
/**
 * Auto-Reply Routes
 */
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const autoReply_controller_1 = require("../controllers/autoReply.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
// All routes require authentication
router.use(auth_middleware_1.authMiddleware);
// Rules management
router.get('/rules', autoReply_controller_1.getRules);
router.post('/rules', autoReply_controller_1.createRule);
router.get('/rules/:id', autoReply_controller_1.getRule);
router.put('/rules/:id', autoReply_controller_1.updateRule);
router.delete('/rules/:id', autoReply_controller_1.deleteRule);
router.post('/rules/:id/toggle', autoReply_controller_1.toggleRule);
// Activity logs
router.get('/logs', autoReply_controller_1.getLogs);
// Statistics
router.get('/stats', autoReply_controller_1.getStats);
// Test endpoint
router.post('/test/poll', autoReply_controller_1.testPoll);
exports.default = router;
//# sourceMappingURL=autoReply.routes.js.map