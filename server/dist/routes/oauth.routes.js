"use strict";
/**
 * OAuth Routes
 * Handles OAuth2 authorization flows
 */
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const oauth_controller_1 = require("../controllers/oauth.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const rateLimiter_middleware_1 = require("../middleware/rateLimiter.middleware");
const router = (0, express_1.Router)();
// YouTube OAuth
router.get('/youtube/authorize', auth_middleware_1.authMiddleware, oauth_controller_1.OAuthController.youtubeAuthorize);
router.get('/youtube/callback', rateLimiter_middleware_1.oauthCallbackRateLimiter, oauth_controller_1.OAuthController.youtubeCallback);
// TikTok OAuth
router.get('/tiktok/authorize', auth_middleware_1.authMiddleware, oauth_controller_1.OAuthController.tiktokAuthorize);
router.get('/tiktok/callback', rateLimiter_middleware_1.oauthCallbackRateLimiter, oauth_controller_1.OAuthController.tiktokCallback);
// Instagram OAuth
router.get('/instagram/authorize', auth_middleware_1.authMiddleware, oauth_controller_1.OAuthController.instagramAuthorize);
router.get('/instagram/callback', rateLimiter_middleware_1.oauthCallbackRateLimiter, oauth_controller_1.OAuthController.instagramCallback);
exports.default = router;
//# sourceMappingURL=oauth.routes.js.map