"use strict";
/**
 * YouTube OAuth Service
 * Implements OAuth2 flow for YouTube Data API v3
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.YouTubeOAuthService = void 0;
const axios_1 = __importDefault(require("axios"));
const client_1 = require("@prisma/client");
const base_oauth_service_1 = require("./base.oauth.service");
class YouTubeOAuthService extends base_oauth_service_1.BaseOAuthService {
    constructor() {
        super(...arguments);
        this.platform = client_1.Platform.YOUTUBE;
        this.clientId = process.env.YOUTUBE_CLIENT_ID;
        this.clientSecret = process.env.YOUTUBE_CLIENT_SECRET;
        this.redirectUri = process.env.YOUTUBE_REDIRECT_URI;
        this.scopes = [
            'https://www.googleapis.com/auth/youtube.readonly',
            'https://www.googleapis.com/auth/youtube.force-ssl',
            'https://www.googleapis.com/auth/yt-analytics.readonly', // For historical analytics
            'https://www.googleapis.com/auth/userinfo.email',
            'https://www.googleapis.com/auth/userinfo.profile',
        ];
    }
    /**
     * Build YouTube OAuth authorization URL
     */
    buildAuthorizationUrl(state, codeChallenge) {
        const params = new URLSearchParams({
            client_id: this.clientId,
            redirect_uri: this.redirectUri,
            response_type: 'code',
            scope: this.scopes.join(' '),
            state,
            access_type: 'offline', // Request refresh token
            prompt: 'consent', // Force consent screen to get refresh token
            code_challenge: codeChallenge,
            code_challenge_method: 'S256',
        });
        return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
    }
    /**
     * Exchange authorization code for tokens
     */
    async exchangeCodeForTokens(code, codeVerifier) {
        try {
            const response = await axios_1.default.post('https://oauth2.googleapis.com/token', {
                client_id: this.clientId,
                client_secret: this.clientSecret,
                code,
                code_verifier: codeVerifier,
                grant_type: 'authorization_code',
                redirect_uri: this.redirectUri,
            });
            return {
                accessToken: response.data.access_token,
                refreshToken: response.data.refresh_token,
                expiresIn: response.data.expires_in, // 3600 seconds (1 hour)
                tokenType: response.data.token_type,
            };
        }
        catch (error) {
            console.error('YouTube token exchange failed:', error.response?.data || error.message);
            throw new Error('Failed to exchange code for YouTube tokens');
        }
    }
    /**
     * Refresh access token
     */
    async refreshAccessToken(refreshToken) {
        try {
            const response = await axios_1.default.post('https://oauth2.googleapis.com/token', {
                client_id: this.clientId,
                client_secret: this.clientSecret,
                refresh_token: refreshToken,
                grant_type: 'refresh_token',
            });
            return {
                accessToken: response.data.access_token,
                refreshToken: refreshToken, // YouTube doesn't return new refresh token
                expiresIn: response.data.expires_in,
                tokenType: response.data.token_type,
            };
        }
        catch (error) {
            console.error('YouTube token refresh failed:', error.response?.data || error.message);
            throw new Error('Failed to refresh YouTube token');
        }
    }
    /**
     * Get YouTube channel information
     */
    async getUserInfo(accessToken) {
        try {
            // First, try to get YouTube channel info
            const channelResponse = await axios_1.default.get('https://www.googleapis.com/youtube/v3/channels', {
                params: {
                    part: 'snippet,contentDetails,statistics',
                    mine: true,
                },
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });
            if (channelResponse.data.items && channelResponse.data.items.length > 0) {
                const channel = channelResponse.data.items[0];
                return {
                    platformUserId: channel.id,
                    platformUsername: channel.snippet.title,
                };
            }
            // If no YouTube channel exists, use Google account info
            console.log('No YouTube channel found, using Google account info');
            const userInfoResponse = await axios_1.default.get('https://www.googleapis.com/oauth2/v2/userinfo', {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });
            const userInfo = userInfoResponse.data;
            return {
                platformUserId: userInfo.id,
                platformUsername: userInfo.email || userInfo.name || 'YouTube User',
            };
        }
        catch (error) {
            console.error('Failed to get YouTube user info:', error.response?.data || error.message);
            throw new Error('Failed to get YouTube channel information');
        }
    }
    /**
     * Get channel analytics data
     */
    async getChannelAnalytics(userId) {
        const accessToken = await this.getValidAccessToken(userId);
        if (!accessToken) {
            throw new Error('YouTube not connected or token expired');
        }
        try {
            const response = await axios_1.default.get('https://www.googleapis.com/youtube/v3/channels', {
                params: {
                    part: 'snippet,statistics',
                    mine: true,
                },
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });
            const channel = response.data.items[0];
            return {
                subscriberCount: parseInt(channel.statistics.subscriberCount),
                viewCount: parseInt(channel.statistics.viewCount),
                videoCount: parseInt(channel.statistics.videoCount),
            };
        }
        catch (error) {
            console.error('Failed to fetch YouTube analytics:', error);
            throw new Error('Failed to fetch YouTube analytics');
        }
    }
    /**
     * Get historical analytics data from YouTube Analytics API
     * Returns REAL view data for the specified date range
     */
    async getHistoricalAnalytics(userId, startDate, endDate) {
        const accessToken = await this.getValidAccessToken(userId);
        if (!accessToken) {
            throw new Error('YouTube not connected or token expired');
        }
        try {
            // YouTube Analytics API endpoint
            const response = await axios_1.default.get('https://youtubeanalytics.googleapis.com/v2/reports', {
                params: {
                    ids: 'channel==MINE',
                    startDate,
                    endDate,
                    metrics: 'views,likes,comments,shares,subscribersGained,subscribersLost',
                    dimensions: 'day',
                    sort: 'day',
                },
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });
            return response.data;
        }
        catch (error) {
            console.error('Failed to fetch YouTube historical analytics:', error.response?.data || error.message);
            throw new Error('Failed to fetch YouTube historical analytics');
        }
    }
}
exports.YouTubeOAuthService = YouTubeOAuthService;
//# sourceMappingURL=youtube.service.js.map