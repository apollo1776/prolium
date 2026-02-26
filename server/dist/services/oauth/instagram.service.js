"use strict";
/**
 * Instagram OAuth Service
 * Implements OAuth2 flow for Instagram Basic Display API
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InstagramOAuthService = void 0;
const axios_1 = __importDefault(require("axios"));
const client_1 = require("@prisma/client");
const base_oauth_service_1 = require("./base.oauth.service");
class InstagramOAuthService extends base_oauth_service_1.BaseOAuthService {
    constructor() {
        super(...arguments);
        this.platform = client_1.Platform.INSTAGRAM;
        this.clientId = process.env.INSTAGRAM_CLIENT_ID;
        this.clientSecret = process.env.INSTAGRAM_CLIENT_SECRET;
        this.redirectUri = process.env.INSTAGRAM_REDIRECT_URI;
        this.scopes = [
            'user_profile',
            'user_media',
        ];
    }
    /**
     * Build Instagram OAuth authorization URL
     * Using Instagram Basic Display API
     */
    buildAuthorizationUrl(state, codeChallenge) {
        const params = new URLSearchParams({
            client_id: this.clientId,
            redirect_uri: this.redirectUri,
            scope: this.scopes.join(','),
            response_type: 'code',
            state,
        });
        // Instagram Basic Display API OAuth endpoint
        return `https://api.instagram.com/oauth/authorize?${params.toString()}`;
    }
    /**
     * Exchange authorization code for tokens
     * Instagram has a two-step process: short-lived token → long-lived token
     */
    async exchangeCodeForTokens(code, codeVerifier) {
        try {
            // Step 1: Get short-lived token (1 hour)
            const shortLivedResponse = await axios_1.default.post('https://api.instagram.com/oauth/access_token', new URLSearchParams({
                client_id: this.clientId,
                client_secret: this.clientSecret,
                grant_type: 'authorization_code',
                redirect_uri: this.redirectUri,
                code,
            }), {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
            });
            const shortLivedToken = shortLivedResponse.data.access_token;
            // Step 2: Exchange for long-lived token (60 days)
            const longLivedResponse = await axios_1.default.get('https://graph.instagram.com/access_token', {
                params: {
                    grant_type: 'ig_exchange_token',
                    client_secret: this.clientSecret,
                    access_token: shortLivedToken,
                },
            });
            return {
                accessToken: longLivedResponse.data.access_token,
                expiresIn: longLivedResponse.data.expires_in, // 5184000 seconds (60 days)
                tokenType: 'Bearer',
            };
        }
        catch (error) {
            console.error('Instagram token exchange failed:', error.response?.data || error.message);
            throw new Error('Failed to exchange code for Instagram tokens');
        }
    }
    /**
     * Refresh long-lived access token
     * Must be refreshed before 60-day expiry
     */
    async refreshAccessToken(accessToken) {
        try {
            const response = await axios_1.default.get('https://graph.instagram.com/refresh_access_token', {
                params: {
                    grant_type: 'ig_refresh_token',
                    access_token: accessToken,
                },
            });
            return {
                accessToken: response.data.access_token,
                expiresIn: response.data.expires_in, // Another 60 days
                tokenType: 'Bearer',
            };
        }
        catch (error) {
            console.error('Instagram token refresh failed:', error.response?.data || error.message);
            throw new Error('Failed to refresh Instagram token');
        }
    }
    /**
     * Get Instagram user information
     */
    async getUserInfo(accessToken) {
        try {
            const response = await axios_1.default.get('https://graph.instagram.com/me', {
                params: {
                    fields: 'id,username,account_type,media_count',
                    access_token: accessToken,
                },
            });
            return {
                platformUserId: response.data.id,
                platformUsername: response.data.username,
            };
        }
        catch (error) {
            console.error('Failed to get Instagram user info:', error.response?.data || error.message);
            throw new Error('Failed to get Instagram user information');
        }
    }
    /**
     * Schedule token refresh (every 50 days, before 60-day expiry)
     */
    async scheduleTokenRefresh(userId) {
        const refreshInterval = 50 * 24 * 60 * 60 * 1000; // 50 days
        const refresh = async () => {
            try {
                const connection = await this.getConnection(userId);
                if (!connection || !connection.accessToken) {
                    console.log(`No Instagram connection for user ${userId}`);
                    return;
                }
                // Instagram refresh uses access token, not refresh token
                await this.refreshAccessToken(connection.accessToken);
                console.log(`✓ Instagram token refreshed for user ${userId}`);
                // Schedule next refresh
                setTimeout(refresh, refreshInterval);
            }
            catch (error) {
                console.error(`Failed to refresh Instagram token for user ${userId}:`, error);
            }
        };
        // Start refresh cycle
        setTimeout(refresh, refreshInterval);
    }
}
exports.InstagramOAuthService = InstagramOAuthService;
//# sourceMappingURL=instagram.service.js.map