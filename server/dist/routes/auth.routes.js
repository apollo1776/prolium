"use strict";
/**
 * Authentication Routes
 * Defines all authentication endpoints
 */
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = require("../controllers/auth.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const rateLimiter_middleware_1 = require("../middleware/rateLimiter.middleware");
const validateRequest_middleware_1 = require("../middleware/validateRequest.middleware");
const router = (0, express_1.Router)();
// Public routes
router.post('/register', rateLimiter_middleware_1.authRateLimiter, (0, validateRequest_middleware_1.validateRequest)('register'), auth_controller_1.AuthController.register);
router.post('/login', rateLimiter_middleware_1.authRateLimiter, (0, validateRequest_middleware_1.validateRequest)('login'), auth_controller_1.AuthController.login);
router.post('/forgot-password', rateLimiter_middleware_1.strictRateLimiter, (0, validateRequest_middleware_1.validateRequest)('forgotPassword'), auth_controller_1.AuthController.forgotPassword);
router.post('/reset-password', rateLimiter_middleware_1.authRateLimiter, (0, validateRequest_middleware_1.validateRequest)('resetPassword'), auth_controller_1.AuthController.resetPassword);
router.get('/verify-email/:token', auth_controller_1.AuthController.verifyEmail);
router.post('/refresh-token', (0, validateRequest_middleware_1.validateRequest)('refreshToken'), auth_controller_1.AuthController.refreshToken);
// Protected routes
router.post('/logout', auth_middleware_1.authMiddleware, auth_controller_1.AuthController.logout);
router.get('/me', auth_middleware_1.authMiddleware, auth_controller_1.AuthController.getCurrentUser);
exports.default = router;
//# sourceMappingURL=auth.routes.js.map