/**
 * Token Service
 * Handles JWT token generation, validation, and refresh
 */
interface AccessTokenPayload {
    userId: string;
    email: string;
    type: 'access';
}
interface RefreshTokenPayload {
    userId: string;
    type: 'refresh';
    jti: string;
    rememberMe?: boolean;
}
export declare class TokenService {
    private static accessSecret;
    private static refreshSecret;
    /**
     * Initialize token secrets from environment
     */
    static initialize(): void;
    /**
     * Generate access token (short-lived, 15 minutes)
     */
    static generateAccessToken(userId: string, email: string): string;
    /**
     * Generate refresh token (long-lived, 7 days or 1 day based on rememberMe)
     */
    static generateRefreshToken(userId: string, rememberMe?: boolean): {
        token: string;
        jti: string;
    };
    /**
     * Verify and decode access token
     */
    static verifyAccessToken(token: string): AccessTokenPayload;
    /**
     * Verify and decode refresh token
     */
    static verifyRefreshToken(token: string): RefreshTokenPayload;
    /**
     * Get token expiration date
     */
    static getTokenExpiration(days: number): Date;
    /**
     * Calculate expiration timestamp for access token (15 minutes)
     */
    static getAccessTokenExpiry(): number;
    /**
     * Calculate expiration timestamp for refresh token (7 days)
     */
    static getRefreshTokenExpiry(): number;
}
export {};
//# sourceMappingURL=token.service.d.ts.map