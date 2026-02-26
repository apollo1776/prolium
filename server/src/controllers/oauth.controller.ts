/**
 * OAuth Controller
 * Handles OAuth2 authorization flows for all platforms
 */

import { Request, Response } from 'express';
import { YouTubeOAuthService } from '../services/oauth/youtube.service';
import { TikTokOAuthService } from '../services/oauth/tiktok.service';
import { InstagramOAuthService } from '../services/oauth/instagram.service';
import { XOAuthService } from '../services/oauth/x.service';

const youtubeService = new YouTubeOAuthService();
const tiktokService = new TikTokOAuthService();
const instagramService = new InstagramOAuthService();
const xService = new XOAuthService();

export class OAuthController {
  /**
   * GET /api/oauth/youtube/authorize
   * Initiate YouTube OAuth flow
   */
  static async youtubeAuthorize(req: Request, res: Response) {
    try {
      const userId = req.user!.userId;

      const { authUrl, state } = await youtubeService.generateAuthorizationUrl(userId);

      // Redirect user to Google OAuth consent screen
      res.redirect(authUrl);
    } catch (error: any) {
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
  static async youtubeCallback(req: Request, res: Response) {
    try {
      const { code, state, error } = req.query;

      // Handle user denial
      if (error) {
        return res.redirect(
          `${process.env.FRONTEND_URL}/account?oauth=youtube&status=denied`
        );
      }

      if (!code || !state) {
        return res.redirect(
          `${process.env.FRONTEND_URL}/account?oauth=youtube&status=error&message=Missing code or state`
        );
      }

      // Verify state and get stored data
      const stored = await (youtubeService as any).getOAuthState(state as string);
      if (!stored) {
        return res.redirect(
          `${process.env.FRONTEND_URL}/account?oauth=youtube&status=error&message=Invalid state`
        );
      }

      // Exchange code for tokens
      const tokens = await youtubeService.exchangeCodeForTokens(
        code as string,
        stored.codeVerifier
      );

      // Get user info
      const userInfo = await youtubeService.getUserInfo(tokens.accessToken);

      // Save connection
      await youtubeService.savePlatformConnection(
        stored.userId,
        tokens,
        userInfo,
        ['youtube.readonly', 'youtube.force-ssl']
      );

      // Redirect to success page
      res.redirect(
        `${process.env.FRONTEND_URL}/account?oauth=youtube&status=success&username=${encodeURIComponent(userInfo.platformUsername || 'Connected')}`
      );
    } catch (error: any) {
      console.error('YouTube OAuth callback error:', error);
      res.redirect(
        `${process.env.FRONTEND_URL}/account?oauth=youtube&status=error&message=${encodeURIComponent(error.message)}`
      );
    }
  }

  /**
   * GET /api/oauth/tiktok/authorize
   * Initiate TikTok OAuth flow
   */
  static async tiktokAuthorize(req: Request, res: Response) {
    try {
      const userId = req.user!.userId;

      // Check if TikTok credentials are configured
      const clientKey = process.env.TIKTOK_CLIENT_KEY;
      const clientSecret = process.env.TIKTOK_CLIENT_SECRET;

      if (!clientKey || !clientSecret ||
          clientKey === 'your_tiktok_client_key' ||
          clientSecret === 'your_tiktok_client_secret') {
        return res.redirect(
          `${process.env.FRONTEND_URL}/account?oauth=tiktok&status=error&message=${encodeURIComponent('TikTok integration is not configured yet. Please contact the administrator to set up TikTok OAuth credentials.')}`
        );
      }

      const { authUrl, state } = await tiktokService.generateAuthorizationUrl(userId);

      res.redirect(authUrl);
    } catch (error: any) {
      console.error('TikTok authorization error:', error);
      res.redirect(
        `${process.env.FRONTEND_URL}/account?oauth=tiktok&status=error&message=${encodeURIComponent(error.message || 'Failed to initiate TikTok authorization')}`
      );
    }
  }

  /**
   * GET /api/oauth/tiktok/callback
   * Handle TikTok OAuth callback
   */
  static async tiktokCallback(req: Request, res: Response) {
    try {
      const { code, state, error } = req.query;

      if (error) {
        return res.redirect(
          `${process.env.FRONTEND_URL}/account?oauth=tiktok&status=denied`
        );
      }

      if (!code || !state) {
        return res.redirect(
          `${process.env.FRONTEND_URL}/account?oauth=tiktok&status=error&message=Missing code or state`
        );
      }

      const stored = await (tiktokService as any).getOAuthState(state as string);
      if (!stored) {
        return res.redirect(
          `${process.env.FRONTEND_URL}/account?oauth=tiktok&status=error&message=Invalid state`
        );
      }

      const tokens = await tiktokService.exchangeCodeForTokens(
        code as string,
        stored.codeVerifier
      );

      const userInfo = await tiktokService.getUserInfo(tokens.accessToken);

      await tiktokService.savePlatformConnection(
        stored.userId,
        tokens,
        userInfo,
        ['user.info.basic', 'video.list', 'video.insights']
      );

      // Schedule automatic token refresh (every 22 hours)
      tiktokService.scheduleTokenRefresh(stored.userId);

      res.redirect(
        `${process.env.FRONTEND_URL}/account?oauth=tiktok&status=success&username=${encodeURIComponent(userInfo.platformUsername || 'Connected')}`
      );
    } catch (error: any) {
      console.error('TikTok OAuth callback error:', error);
      res.redirect(
        `${process.env.FRONTEND_URL}/account?oauth=tiktok&status=error&message=${encodeURIComponent(error.message)}`
      );
    }
  }

  /**
   * GET /api/oauth/instagram/authorize
   * Initiate Instagram OAuth flow
   */
  static async instagramAuthorize(req: Request, res: Response) {
    try {
      const userId = req.user!.userId;

      // Check if Instagram credentials are configured
      const clientId = process.env.INSTAGRAM_CLIENT_ID;
      const clientSecret = process.env.INSTAGRAM_CLIENT_SECRET;

      if (!clientId || !clientSecret ||
          clientId === 'your_client_id' ||
          clientSecret === 'your_client_secret') {
        return res.redirect(
          `${process.env.FRONTEND_URL}/account?oauth=instagram&status=error&message=${encodeURIComponent('Instagram integration is not configured yet. Please contact the administrator to set up Instagram OAuth credentials.')}`
        );
      }

      const { authUrl, state } = await instagramService.generateAuthorizationUrl(userId);

      console.log('Instagram OAuth URL:', authUrl);
      res.redirect(authUrl);
    } catch (error: any) {
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
  static async instagramCallback(req: Request, res: Response) {
    try {
      const { code, state, error } = req.query;

      if (error) {
        return res.redirect(
          `${process.env.FRONTEND_URL}/account?oauth=instagram&status=denied`
        );
      }

      if (!code || !state) {
        return res.redirect(
          `${process.env.FRONTEND_URL}/account?oauth=instagram&status=error&message=Missing code or state`
        );
      }

      const stored = await (instagramService as any).getOAuthState(state as string);
      if (!stored) {
        return res.redirect(
          `${process.env.FRONTEND_URL}/account?oauth=instagram&status=error&message=Invalid state`
        );
      }

      // Instagram doesn't use code verifier but we pass it for consistency
      const tokens = await instagramService.exchangeCodeForTokens(
        code as string,
        stored.codeVerifier
      );

      const userInfo = await instagramService.getUserInfo(tokens.accessToken);

      await instagramService.savePlatformConnection(
        stored.userId,
        tokens,
        userInfo,
        ['user_profile', 'user_media']
      );

      // Schedule automatic token refresh (every 50 days)
      instagramService.scheduleTokenRefresh(stored.userId);

      res.redirect(
        `${process.env.FRONTEND_URL}/account?oauth=instagram&status=success&username=${encodeURIComponent(userInfo.platformUsername || 'Connected')}`
      );
    } catch (error: any) {
      console.error('Instagram OAuth callback error:', error);
      res.redirect(
        `${process.env.FRONTEND_URL}/account?oauth=instagram&status=error&message=${encodeURIComponent(error.message)}`
      );
    }
  }

  /**
   * GET /api/oauth/x/authorize
   * Initiate X OAuth flow
   */
  static async xAuthorize(req: Request, res: Response) {
    try {
      const userId = req.user!.userId;

      const { authUrl, state } = await xService.generateAuthorizationUrl(userId);

      // Redirect user to X OAuth consent screen
      res.redirect(authUrl);
    } catch (error: any) {
      res.status(500).json({
        error: 'AuthorizationFailed',
        message: 'Failed to initiate X authorization',
      });
    }
  }

  /**
   * GET /api/oauth/x/callback
   * Handle X OAuth callback
   */
  static async xCallback(req: Request, res: Response) {
    try {
      const { code, state, error } = req.query;

      if (error) {
        return res.redirect(
          `${process.env.FRONTEND_URL}/account?oauth=x&status=denied`
        );
      }

      if (!code || !state) {
        return res.redirect(
          `${process.env.FRONTEND_URL}/account?oauth=x&status=error&message=Missing code or state`
        );
      }

      const stored = await (xService as any).getOAuthState(state as string);
      if (!stored) {
        return res.redirect(
          `${process.env.FRONTEND_URL}/account?oauth=x&status=error&message=Invalid state`
        );
      }

      const tokens = await xService.exchangeCodeForTokens(
        code as string,
        stored.codeVerifier
      );

      const userInfo = await xService.getUserInfo(tokens.accessToken);

      await xService.savePlatformConnection(
        stored.userId,
        tokens,
        userInfo,
        ['tweet.read', 'tweet.write', 'users.read', 'offline.access']
      );

      res.redirect(
        `${process.env.FRONTEND_URL}/account?oauth=x&status=success&username=${encodeURIComponent(userInfo.platformUsername || 'Connected')}`
      );
    } catch (error: any) {
      console.error('X OAuth callback error:', error);
      res.redirect(
        `${process.env.FRONTEND_URL}/account?oauth=x&status=error&message=${encodeURIComponent(error.message)}`
      );
    }
  }
}
