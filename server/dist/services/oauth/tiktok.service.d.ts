/**
 * TikTok OAuth Service
 * Implements OAuth2 flow for TikTok API
 */
import { BaseOAuthService, OAuthTokens, OAuthUserInfo } from './base.oauth.service';
export declare class TikTokOAuthService extends BaseOAuthService {
    protected platform: "TIKTOK";
    protected clientId: string;
    protected clientSecret: string;
    protected redirectUri: string;
    protected scopes: string[];
    /**
     * Build TikTok OAuth authorization URL
     */
    protected buildAuthorizationUrl(state: string, codeChallenge: string): string;
    /**
     * Exchange authorization code for tokens
     */
    exchangeCodeForTokens(code: string, codeVerifier: string): Promise<OAuthTokens>;
    /**
     * Refresh access token
     * TikTok tokens expire in 24 hours - must refresh regularly
     */
    refreshAccessToken(refreshToken: string): Promise<OAuthTokens>;
    /**
     * Get TikTok user information
     */
    getUserInfo(accessToken: string): Promise<OAuthUserInfo>;
    /**
     * Schedule automatic token refresh (run every 22 hours)
     * TikTok tokens expire in 24 hours, so refresh 2 hours before
     */
    scheduleTokenRefresh(userId: string): Promise<void>;
}
//# sourceMappingURL=tiktok.service.d.ts.map