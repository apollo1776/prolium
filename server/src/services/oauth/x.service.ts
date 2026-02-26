/**
 * X (Twitter) OAuth Service
 * Implements OAuth2 flow for X API v2
 */

import axios from 'axios';
import { Platform } from '@prisma/client';
import { BaseOAuthService, OAuthTokens, OAuthUserInfo } from './base.oauth.service';

export class XOAuthService extends BaseOAuthService {
  protected platform = Platform.X;
  protected clientId = process.env.X_CLIENT_ID!;
  protected clientSecret = process.env.X_CLIENT_SECRET!;
  protected redirectUri = process.env.X_REDIRECT_URI!;

  protected scopes = [
    'tweet.read',
    'tweet.write',
    'users.read',
    'offline.access', // For refresh token
  ];

  /**
   * Build X OAuth authorization URL
   */
  protected buildAuthorizationUrl(state: string, codeChallenge: string): string {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      scope: this.scopes.join(' '),
      state,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
    });

    // Use x.com instead of twitter.com for newer apps
    const authUrl = `https://x.com/i/oauth2/authorize?${params.toString()}`;

    console.log('[X OAuth] Authorization URL generated:');
    console.log('[X OAuth] Client ID:', this.clientId);
    console.log('[X OAuth] Redirect URI:', this.redirectUri);
    console.log('[X OAuth] Scopes:', this.scopes.join(' '));
    console.log('[X OAuth] Full URL:', authUrl);

    return authUrl;
  }

  /**
   * Exchange authorization code for tokens
   */
  async exchangeCodeForTokens(
    code: string,
    codeVerifier: string
  ): Promise<OAuthTokens> {
    try {
      console.log('[X] Exchanging code for access token...');

      const response = await axios.post(
        'https://api.x.com/2/oauth2/token',
        new URLSearchParams({
          code,
          grant_type: 'authorization_code',
          client_id: this.clientId,
          redirect_uri: this.redirectUri,
          code_verifier: codeVerifier,
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          auth: {
            username: this.clientId,
            password: this.clientSecret,
          },
        }
      );

      console.log('[X] Successfully obtained access token');

      return {
        accessToken: response.data.access_token,
        refreshToken: response.data.refresh_token,
        expiresIn: response.data.expires_in, // 7200 seconds (2 hours)
        tokenType: response.data.token_type,
      };
    } catch (error: any) {
      console.error('[X] Token exchange failed:', error.response?.data || error.message);
      throw new Error('Failed to exchange code for X tokens');
    }
  }

  /**
   * Refresh access token
   */
  async refreshAccessToken(refreshToken: string): Promise<OAuthTokens> {
    try {
      console.log('[X] Refreshing access token...');

      const response = await axios.post(
        'https://api.x.com/2/oauth2/token',
        new URLSearchParams({
          refresh_token: refreshToken,
          grant_type: 'refresh_token',
          client_id: this.clientId,
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          auth: {
            username: this.clientId,
            password: this.clientSecret,
          },
        }
      );

      console.log('[X] Token refreshed successfully');

      return {
        accessToken: response.data.access_token,
        refreshToken: response.data.refresh_token, // X returns new refresh token
        expiresIn: response.data.expires_in,
        tokenType: response.data.token_type,
      };
    } catch (error: any) {
      console.error('[X] Token refresh failed:', error.response?.data || error.message);
      throw new Error('Failed to refresh X token');
    }
  }

  /**
   * Get X user information
   */
  async getUserInfo(accessToken: string): Promise<OAuthUserInfo> {
    try {
      console.log('[X] Fetching user information...');

      const response = await axios.get('https://api.x.com/2/users/me', {
        params: {
          'user.fields': 'id,name,username,public_metrics',
        },
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const user = response.data.data;
      console.log('[X] User info retrieved:', user.username);

      return {
        platformUserId: user.id,
        platformUsername: user.username,
      };
    } catch (error: any) {
      console.error('[X] Failed to get user info:', error.response?.data || error.message);
      throw new Error('Failed to get X user information');
    }
  }

  /**
   * Get user analytics data
   */
  async getUserAnalytics(userId: string) {
    const accessToken = await this.getValidAccessToken(userId);
    if (!accessToken) {
      throw new Error('X not connected or token expired');
    }

    try {
      console.log('[X] Fetching user analytics...');

      const response = await axios.get('https://api.x.com/2/users/me', {
        params: {
          'user.fields': 'public_metrics',
        },
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const metrics = response.data.data.public_metrics;

      return {
        followersCount: metrics.followers_count,
        followingCount: metrics.following_count,
        tweetCount: metrics.tweet_count,
        listedCount: metrics.listed_count,
      };
    } catch (error: any) {
      console.error('[X] Failed to fetch analytics:', error.response?.data || error.message);
      throw new Error('Failed to fetch X analytics');
    }
  }
}
