"use strict";
/**
 * TikTok OAuth Service
 * Implements OAuth2 flow for TikTok API
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TikTokOAuthService = void 0;
const axios_1 = __importDefault(require("axios"));
const client_1 = require("@prisma/client");
const base_oauth_service_1 = require("./base.oauth.service");
class TikTokOAuthService extends base_oauth_service_1.BaseOAuthService {
    constructor() {
        super(...arguments);
        this.platform = client_1.Platform.TIKTOK;
        this.clientId = process.env.TIKTOK_CLIENT_KEY;
        this.clientSecret = process.env.TIKTOK_CLIENT_SECRET;
        this.redirectUri = process.env.TIKTOK_REDIRECT_URI;
        this.scopes = [
            'user.info.basic',
            'video.list',
            'video.insights',
        ];
    }
    /**
     * Build TikTok OAuth authorization URL
     */
    buildAuthorizationUrl(state, codeChallenge) {
        const csrfState = state;
        const params = new URLSearchParams({
            client_key: this.clientId,
            scope: this.scopes.join(','), // TikTok uses comma-separated scopes
            response_type: 'code',
            redirect_uri: this.redirectUri,
            state: csrfState,
            code_challenge: codeChallenge,
            code_challenge_method: 'S256',
        });
        return `https://www.tiktok.com/v2/auth/authorize/?${params.toString()}`;
    }
    /**
     * Exchange authorization code for tokens
     */
    async exchangeCodeForTokens(code, codeVerifier) {
        try {
            const response = await axios_1.default.post('https://open.tiktokapis.com/v2/oauth/token/', new URLSearchParams({
                client_key: this.clientId,
                client_secret: this.clientSecret,
                code,
                code_verifier: codeVerifier,
                grant_type: 'authorization_code',
                redirect_uri: this.redirectUri,
            }), {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
            });
            return {
                accessToken: response.data.access_token,
                refreshToken: response.data.refresh_token,
                expiresIn: response.data.expires_in, // 86400 seconds (24 hours)
                tokenType: response.data.token_type,
            };
        }
        catch (error) {
            console.error('TikTok token exchange failed:', error.response?.data || error.message);
            throw new Error('Failed to exchange code for TikTok tokens');
        }
    }
    /**
     * Refresh access token
     * TikTok tokens expire in 24 hours - must refresh regularly
     */
    async refreshAccessToken(refreshToken) {
        try {
            const response = await axios_1.default.post('https://open.tiktokapis.com/v2/oauth/token/', new URLSearchParams({
                client_key: this.clientId,
                client_secret: this.clientSecret,
                grant_type: 'refresh_token',
                refresh_token: refreshToken,
            }), {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
            });
            return {
                accessToken: response.data.access_token,
                refreshToken: response.data.refresh_token, // TikTok returns new refresh token
                expiresIn: response.data.expires_in,
                tokenType: response.data.token_type,
            };
        }
        catch (error) {
            console.error('TikTok token refresh failed:', error.response?.data || error.message);
            throw new Error('Failed to refresh TikTok token');
        }
    }
    /**
     * Get TikTok user information
     */
    async getUserInfo(accessToken) {
        try {
            const response = await axios_1.default.get('https://open.tiktokapis.com/v2/user/info/', {
                params: {
                    fields: 'open_id,union_id,avatar_url,display_name',
                },
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });
            return {
                platformUserId: response.data.data.user.open_id,
                platformUsername: response.data.data.user.display_name,
            };
        }
        catch (error) {
            console.error('Failed to get TikTok user info:', error.response?.data || error.message);
            throw new Error('Failed to get TikTok user information');
        }
    }
    /**
     * Schedule automatic token refresh (run every 22 hours)
     * TikTok tokens expire in 24 hours, so refresh 2 hours before
     */
    async scheduleTokenRefresh(userId) {
        const refreshInterval = 22 * 60 * 60 * 1000; // 22 hours
        const refresh = async () => {
            try {
                const connection = await this.getConnection(userId);
                if (!connection || !connection.refreshToken) {
                    console.log(`No TikTok connection for user ${userId}`);
                    return;
                }
                await this.refreshAccessToken(connection.refreshToken);
                console.log(`✓ TikTok token refreshed for user ${userId}`);
                // Schedule next refresh
                setTimeout(refresh, refreshInterval);
            }
            catch (error) {
                console.error(`Failed to refresh TikTok token for user ${userId}:`, error);
            }
        };
        // Start refresh cycle
        setTimeout(refresh, refreshInterval);
    }
}
exports.TikTokOAuthService = TikTokOAuthService;
//# sourceMappingURL=tiktok.service.js.map