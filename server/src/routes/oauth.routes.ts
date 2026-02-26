/**
 * OAuth Routes
 * Handles OAuth2 authorization flows
 */

import { Router } from 'express';
import { OAuthController } from '../controllers/oauth.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { oauthCallbackRateLimiter } from '../middleware/rateLimiter.middleware';

const router = Router();

// YouTube OAuth
router.get('/youtube/authorize', authMiddleware, OAuthController.youtubeAuthorize);
router.get('/youtube/callback', oauthCallbackRateLimiter, OAuthController.youtubeCallback);

// TikTok OAuth
router.get('/tiktok/authorize', authMiddleware, OAuthController.tiktokAuthorize);
router.get('/tiktok/callback', oauthCallbackRateLimiter, OAuthController.tiktokCallback);

// Instagram OAuth
router.get('/instagram/authorize', authMiddleware, OAuthController.instagramAuthorize);
router.get('/instagram/callback', oauthCallbackRateLimiter, OAuthController.instagramCallback);

// X OAuth
router.get('/x/authorize', authMiddleware, OAuthController.xAuthorize);
router.get('/x/callback', oauthCallbackRateLimiter, OAuthController.xCallback);

export default router;
