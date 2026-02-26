/**
 * Instagram OAuth Service
 * Implements OAuth2 flow for Instagram Basic Display API
 */
import { BaseOAuthService, OAuthTokens, OAuthUserInfo } from './base.oauth.service';
export declare class InstagramOAuthService extends BaseOAuthService {
    protected platform: "INSTAGRAM";
    protected clientId: string;
    protected clientSecret: string;
    protected redirectUri: string;
    protected scopes: string[];
    /**
     * Build Instagram OAuth authorization URL
     * Using Instagram Basic Display API
     */
    protected buildAuthorizationUrl(state: string, codeChallenge: string): string;
    /**
     * Exchange authorization code for tokens
     * Instagram has a two-step process: short-lived token → long-lived token
     */
    exchangeCodeForTokens(code: string, codeVerifier: string): Promise<OAuthTokens>;
    /**
     * Refresh long-lived access token
     * Must be refreshed before 60-day expiry
     */
    refreshAccessToken(accessToken: string): Promise<OAuthTokens>;
    /**
     * Get Instagram user information
     */
    getUserInfo(accessToken: string): Promise<OAuthUserInfo>;
    /**
     * Schedule token refresh (every 50 days, before 60-day expiry)
     */
    scheduleTokenRefresh(userId: string): Promise<void>;
}
//# sourceMappingURL=instagram.service.d.ts.map