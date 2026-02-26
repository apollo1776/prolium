"use strict";
/**
 * OAuth Controller
 * Handles OAuth2 authorization flows for all platforms
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.OAuthController = void 0;
const youtube_service_1 = require("../services/oauth/youtube.service");
const tiktok_service_1 = require("../services/oauth/tiktok.service");
const instagram_service_1 = require("../services/oauth/instagram.service");
const youtubeService = new youtube_service_1.YouTubeOAuthService();
const tiktokService = new tiktok_service_1.TikTokOAuthService();
const instagramService = new instagram_service_1.InstagramOAuthService();
class OAuthController {
    /**
     * GET /api/oauth/youtube/authorize
     * Initiate YouTube OAuth flow
     */
    static async youtubeAuthorize(req, res) {
        try {
            const userId = req.user.userId;
            const { authUrl, state } = await youtubeService.generateAuthorizationUrl(userId);
            // Redirect user to Google OAuth consent screen
            res.redirect(authUrl);
        }
        catch (error) {
            res.status(500).json({
                error: 'AuthorizationFailed',
                message: 'Failed to initiate YouTube authorization',
            });
        }
    }
    /**
     * GET /api/oauth/youtube/callback
     * Handle YouTube OAuth callback
     */
    static async youtubeCallback(req, res) {
        try {
            const { code, state, error } = req.query;
            // Handle user denial
            if (error) {
                return res.redirect(`${process.env.FRONTEND_URL}/account?oauth=youtube&status=denied`);
            }
            if (!code || !state) {
                return res.redirect(`${process.env.FRONTEND_URL}/account?oauth=youtube&status=error&message=Missing code or state`);
            }
            // Verify state and get stored data
            const stored = await youtubeService.getOAuthState(state);
            if (!stored) {
                return res.redirect(`${process.env.FRONTEND_URL}/account?oauth=youtube&status=error&message=Invalid state`);
            }
            // Exchange code for tokens
            const tokens = await youtubeService.exchangeCodeForTokens(code, stored.codeVerifier);
            // Get user info
            const userInfo = await youtubeService.getUserInfo(tokens.accessToken);
            // Save connection
            await youtubeService.savePlatformConnection(stored.userId, tokens, userInfo, ['youtube.readonly', 'youtube.force-ssl']);
            // Redirect to success page
            res.redirect(`${process.env.FRONTEND_URL}/account?oauth=youtube&status=success&username=${encodeURIComponent(userInfo.platformUsername || 'Connected')}`);
        }
        catch (error) {
            console.error('YouTube OAuth callback error:', error);
            res.redirect(`${process.env.FRONTEND_URL}/account?oauth=youtube&status=error&message=${encodeURIComponent(error.message)}`);
        }
    }
    /**
     * GET /api/oauth/tiktok/authorize
     * Initiate TikTok OAuth flow
     */
    static async tiktokAuthorize(req, res) {
        try {
            const userId = req.user.userId;
            // Check if TikTok credentials are configured
            const clientKey = process.env.TIKTOK_CLIENT_KEY;
            const clientSecret = process.env.TIKTOK_CLIENT_SECRET;
            if (!clientKey || !clientSecret ||
                clientKey === 'your_tiktok_client_key' ||
                clientSecret === 'your_tiktok_client_secret') {
                return res.redirect(`${process.env.FRONTEND_URL}/account?oauth=tiktok&status=error&message=${encodeURIComponent('TikTok integration is not configured yet. Please contact the administrator to set up TikTok OAuth credentials.')}`);
            }
            const { authUrl, state } = await tiktokService.generateAuthorizationUrl(userId);
            res.redirect(authUrl);
        }
        catch (error) {
            console.error('TikTok authorization error:', error);
            res.redirect(`${process.env.FRONTEND_URL}/account?oauth=tiktok&status=error&message=${encodeURIComponent(error.message || 'Failed to initiate TikTok authorization')}`);
        }
    }
    /**
     * GET /api/oauth/tiktok/callback
     * Handle TikTok OAuth callback
     */
    static async tiktokCallback(req, res) {
        try {
            const { code, state, error } = req.query;
            if (error) {
                return res.redirect(`${process.env.FRONTEND_URL}/account?oauth=tiktok&status=denied`);
            }
            if (!code || !state) {
                return res.redirect(`${process.env.FRONTEND_URL}/account?oauth=tiktok&status=error&message=Missing code or state`);
            }
            const stored = await tiktokService.getOAuthState(state);
            if (!stored) {
                return res.redirect(`${process.env.FRONTEND_URL}/account?oauth=tiktok&status=error&message=Invalid state`);
            }
            const tokens = await tiktokService.exchangeCodeForTokens(code, stored.codeVerifier);
            const userInfo = await tiktokService.getUserInfo(tokens.accessToken);
            await tiktokService.savePlatformConnection(stored.userId, tokens, userInfo, ['user.info.basic', 'video.list', 'video.insights']);
            // Schedule automatic token refresh (every 22 hours)
            tiktokService.scheduleTokenRefresh(stored.userId);
            res.redirect(`${process.env.FRONTEND_URL}/account?oauth=tiktok&status=success&username=${encodeURIComponent(userInfo.platformUsername || 'Connected')}`);
        }
        catch (error) {
            console.error('TikTok OAuth callback error:', error);
            res.redirect(`${process.env.FRONTEND_URL}/account?oauth=tiktok&status=error&message=${encodeURIComponent(error.message)}`);
        }
    }
    /**
     * GET /api/oauth/instagram/authorize
     * Initiate Instagram OAuth flow
     */
    static async instagramAuthorize(req, res) {
        try {
            const userId = req.user.userId;
            // Check if Instagram credentials are configured
            const clientId = process.env.INSTAGRAM_CLIENT_ID;
            const clientSecret = process.env.INSTAGRAM_CLIENT_SECRET;
            if (!clientId || !clientSecret ||
                clientId === 'your_client_id' ||
                clientSecret === 'your_client_secret') {
                return res.redirect(`${process.env.FRONTEND_URL}/account?oauth=instagram&status=error&message=${encodeURIComponent('Instagram integration is not configured yet. Please contact the administrator to set up Instagram OAuth credentials.')}`);
            }
            const { authUrl, state } = await instagramService.generateAuthorizationUrl(userId);
            console.log('Instagram OAuth URL:', authUrl);
            res.redirect(authUrl);
        }
        catch (error) {
            res.status(500).json({
                error: 'AuthorizationFailed',
                message: 'Failed to initiate Instagram authorization',
            });
        }
    }
    /**
     * GET /api/oauth/instagram/callback
     * Handle Instagram OAuth callback
     */
    static async instagramCallback(req, res) {
        try {
            const { code, state, error } = req.query;
            if (error) {
                return res.redirect(`${process.env.FRONTEND_URL}/account?oauth=instagram&status=denied`);
            }
            if (!code || !state) {
                return res.redirect(`${process.env.FRONTEND_URL}/account?oauth=instagram&status=error&message=Missing code or state`);
            }
            const stored = await instagramService.getOAuthState(state);
            if (!stored) {
                return res.redirect(`${process.env.FRONTEND_URL}/account?oauth=instagram&status=error&message=Invalid state`);
            }
            // Instagram doesn't use code verifier but we pass it for consistency
            const tokens = await instagramService.exchangeCodeForTokens(code, stored.codeVerifier);
            const userInfo = await instagramService.getUserInfo(tokens.accessToken);
            await instagramService.savePlatformConnection(stored.userId, tokens, userInfo, ['user_profile', 'user_media']);
            // Schedule automatic token refresh (every 50 days)
            instagramService.scheduleTokenRefresh(stored.userId);
            res.redirect(`${process.env.FRONTEND_URL}/account?oauth=instagram&status=success&username=${encodeURIComponent(userInfo.platformUsername || 'Connected')}`);
        }
        catch (error) {
            console.error('Instagram OAuth callback error:', error);
            res.redirect(`${process.env.FRONTEND_URL}/account?oauth=instagram&status=error&message=${encodeURIComponent(error.message)}`);
        }
    }
}
exports.OAuthController = OAuthController;
//# sourceMappingURL=oauth.controller.js.map