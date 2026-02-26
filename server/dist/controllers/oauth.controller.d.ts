/**
 * OAuth Controller
 * Handles OAuth2 authorization flows for all platforms
 */
import { Request, Response } from 'express';
export declare class OAuthController {
    /**
     * GET /api/oauth/youtube/authorize
     * Initiate YouTube OAuth flow
     */
    static youtubeAuthorize(req: Request, res: Response): Promise<void>;
    /**
     * GET /api/oauth/youtube/callback
     * Handle YouTube OAuth callback
     */
    static youtubeCallback(req: Request, res: Response): Promise<void>;
    /**
     * GET /api/oauth/tiktok/authorize
     * Initiate TikTok OAuth flow
     */
    static tiktokAuthorize(req: Request, res: Response): Promise<void>;
    /**
     * GET /api/oauth/tiktok/callback
     * Handle TikTok OAuth callback
     */
    static tiktokCallback(req: Request, res: Response): Promise<void>;
    /**
     * GET /api/oauth/instagram/authorize
     * Initiate Instagram OAuth flow
     */
    static instagramAuthorize(req: Request, res: Response): Promise<void>;
    /**
     * GET /api/oauth/instagram/callback
     * Handle Instagram OAuth callback
     */
    static instagramCallback(req: Request, res: Response): Promise<void>;
}
//# sourceMappingURL=oauth.controller.d.ts.map