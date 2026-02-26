/**
 * Base OAuth Service
 * Provides common OAuth functionality for all platforms
 */
import { Platform } from '@prisma/client';
export interface OAuthTokens {
    accessToken: string;
    refreshToken?: string;
    expiresIn?: number;
    tokenType?: string;
}
export interface OAuthUserInfo {
    platformUserId: string;
    platformUsername?: string;
    email?: string;
}
export declare abstract class BaseOAuthService {
    protected abstract platform: Platform;
    protected abstract clientId: string;
    protected abstract clientSecret: string;
    protected abstract redirectUri: string;
    protected abstract scopes: string[];
    /**
     * Generate authorization URL with PKCE
     */
    generateAuthorizationUrl(userId: string): Promise<{
        authUrl: string;
        state: string;
    }>;
    /**
     * Abstract method to build platform-specific authorization URL
     */
    protected abstract buildAuthorizationUrl(state: string, codeChallenge: string): string;
    /**
     * Exchange authorization code for tokens
     */
    abstract exchangeCodeForTokens(code: string, codeVerifier: string): Promise<OAuthTokens>;
    /**
     * Refresh access token
     */
    abstract refreshAccessToken(refreshToken: string): Promise<OAuthTokens>;
    /**
     * Get user info from platform
     */
    abstract getUserInfo(accessToken: string): Promise<OAuthUserInfo>;
    /**
     * Store OAuth connection in database
     */
    savePlatformConnection(userId: string, tokens: OAuthTokens, userInfo: OAuthUserInfo, scopesGranted: string[]): Promise<{
        id: string;
        userId: string;
        refreshToken: string | null;
        accessToken: string;
        platform: import(".prisma/client").$Enums.Platform;
        tokenExpiresAt: Date | null;
        platformUserId: string;
        platformUsername: string | null;
        scopesGranted: string[];
        connectedAt: Date;
        lastSynced: Date | null;
        isActive: boolean;
    }>;
    /**
     * Get platform connection for user
     */
    getConnection(userId: string): Promise<{
        accessToken: string;
        refreshToken: string | null;
        id: string;
        userId: string;
        platform: import(".prisma/client").$Enums.Platform;
        tokenExpiresAt: Date | null;
        platformUserId: string;
        platformUsername: string | null;
        scopesGranted: string[];
        connectedAt: Date;
        lastSynced: Date | null;
        isActive: boolean;
    } | null>;
    /**
     * Disconnect platform
     */
    disconnect(userId: string): Promise<{
        success: boolean;
    }>;
    /**
     * Check if token is expired
     */
    isTokenExpired(expiresAt?: Date): boolean;
    /**
     * Auto-refresh token if expired
     */
    getValidAccessToken(userId: string): Promise<string | null>;
    /**
     * Store OAuth state temporarily (in-memory for simplicity)
     * In production, use Redis or database
     */
    private static oauthStates;
    private storeOAuthState;
    protected getOAuthState(state: string): Promise<{
        userId: string;
        codeVerifier: string;
    } | null>;
    private cleanupOldStates;
    /**
     * Log OAuth attempt
     */
    protected logOAuthAttempt(userId: string | null, success: boolean, error: string | null, ipAddress: string): Promise<void>;
}
//# sourceMappingURL=base.oauth.service.d.ts.map