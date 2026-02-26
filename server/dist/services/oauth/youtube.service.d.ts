/**
 * YouTube OAuth Service
 * Implements OAuth2 flow for YouTube Data API v3
 */
import { BaseOAuthService, OAuthTokens, OAuthUserInfo } from './base.oauth.service';
export declare class YouTubeOAuthService extends BaseOAuthService {
    protected platform: "YOUTUBE";
    protected clientId: string;
    protected clientSecret: string;
    protected redirectUri: string;
    protected scopes: string[];
    /**
     * Build YouTube OAuth authorization URL
     */
    protected buildAuthorizationUrl(state: string, codeChallenge: string): string;
    /**
     * Exchange authorization code for tokens
     */
    exchangeCodeForTokens(code: string, codeVerifier: string): Promise<OAuthTokens>;
    /**
     * Refresh access token
     */
    refreshAccessToken(refreshToken: string): Promise<OAuthTokens>;
    /**
     * Get YouTube channel information
     */
    getUserInfo(accessToken: string): Promise<OAuthUserInfo>;
    /**
     * Get channel analytics data
     */
    getChannelAnalytics(userId: string): Promise<{
        subscriberCount: number;
        viewCount: number;
        videoCount: number;
    }>;
    /**
     * Get historical analytics data from YouTube Analytics API
     * Returns REAL view data for the specified date range
     */
    getHistoricalAnalytics(userId: string, startDate: string, endDate: string): Promise<any>;
}
//# sourceMappingURL=youtube.service.d.ts.map