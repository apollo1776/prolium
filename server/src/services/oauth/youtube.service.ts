/**
 * YouTube OAuth Service
 * Implements OAuth2 flow for YouTube Data API v3
 */

import axios from 'axios';
import { Platform } from '@prisma/client';
import { BaseOAuthService, OAuthTokens, OAuthUserInfo } from './base.oauth.service';

export class YouTubeOAuthService extends BaseOAuthService {
  protected platform = Platform.YOUTUBE;
  protected clientId = process.env.YOUTUBE_CLIENT_ID!;
  protected clientSecret = process.env.YOUTUBE_CLIENT_SECRET!;
  protected redirectUri = process.env.YOUTUBE_REDIRECT_URI!;

  protected scopes = [
    'https://www.googleapis.com/auth/youtube.readonly',
    'https://www.googleapis.com/auth/youtube.force-ssl',
    'https://www.googleapis.com/auth/yt-analytics.readonly', // For historical analytics
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile',
  ];

  /**
   * Build YouTube OAuth authorization URL
   */
  protected buildAuthorizationUrl(state: string, codeChallenge: string): string {
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
  async exchangeCodeForTokens(
    code: string,
    codeVerifier: string
  ): Promise<OAuthTokens> {
    try {
      const response = await axios.post('https://oauth2.googleapis.com/token', {
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
    } catch (error: any) {
      console.error('YouTube token exchange failed:', error.response?.data || error.message);
      throw new Error('Failed to exchange code for YouTube tokens');
    }
  }

  /**
   * Refresh access token
   */
  async refreshAccessToken(refreshToken: string): Promise<OAuthTokens> {
    try {
      const response = await axios.post('https://oauth2.googleapis.com/token', {
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
    } catch (error: any) {
      console.error('YouTube token refresh failed:', error.response?.data || error.message);
      throw new Error('Failed to refresh YouTube token');
    }
  }

  /**
   * Get YouTube channel information
   */
  async getUserInfo(accessToken: string): Promise<OAuthUserInfo> {
    try {
      // First, try to get YouTube channel info
      const channelResponse = await axios.get(
        'https://www.googleapis.com/youtube/v3/channels',
        {
          params: {
            part: 'snippet,contentDetails,statistics',
            mine: true,
          },
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (channelResponse.data.items && channelResponse.data.items.length > 0) {
        const channel = channelResponse.data.items[0];
        return {
          platformUserId: channel.id,
          platformUsername: channel.snippet.title,
        };
      }

      // If no YouTube channel exists, use Google account info
      console.log('No YouTube channel found, using Google account info');
      const userInfoResponse = await axios.get(
        'https://www.googleapis.com/oauth2/v2/userinfo',
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      const userInfo = userInfoResponse.data;
      return {
        platformUserId: userInfo.id,
        platformUsername: userInfo.email || userInfo.name || 'YouTube User',
      };
    } catch (error: any) {
      console.error('Failed to get YouTube user info:', error.response?.data || error.message);
      throw new Error('Failed to get YouTube channel information');
    }
  }

  /**
   * Get channel analytics data
   */
  async getChannelAnalytics(userId: string) {
    const accessToken = await this.getValidAccessToken(userId);
    if (!accessToken) {
      throw new Error('YouTube not connected or token expired');
    }

    try {
      const response = await axios.get(
        'https://www.googleapis.com/youtube/v3/channels',
        {
          params: {
            part: 'snippet,statistics',
            mine: true,
          },
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      const channel = response.data.items[0];

      return {
        subscriberCount: parseInt(channel.statistics.subscriberCount),
        viewCount: parseInt(channel.statistics.viewCount),
        videoCount: parseInt(channel.statistics.videoCount),
      };
    } catch (error) {
      console.error('Failed to fetch YouTube analytics:', error);
      throw new Error('Failed to fetch YouTube analytics');
    }
  }

  /**
   * Get historical analytics data from YouTube Analytics API
   * Returns REAL view data for the specified date range
   */
  async getHistoricalAnalytics(userId: string, startDate: string, endDate: string) {
    const accessToken = await this.getValidAccessToken(userId);
    if (!accessToken) {
      throw new Error('YouTube not connected or token expired');
    }

    try {
      // YouTube Analytics API endpoint
      const response = await axios.get(
        'https://youtubeanalytics.googleapis.com/v2/reports',
        {
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
        }
      );

      return response.data;
    } catch (error: any) {
      console.error('Failed to fetch YouTube historical analytics:', error.response?.data || error.message);
      throw new Error('Failed to fetch YouTube historical analytics');
    }
  }
}
