/**
 * Instagram OAuth Service
 * Implements OAuth2 flow for Instagram Graph API (Business/Creator accounts)
 * Requires Facebook OAuth → Instagram Business Account connection
 */

import axios from 'axios';
import { Platform } from '@prisma/client';
import { BaseOAuthService, OAuthTokens, OAuthUserInfo } from './base.oauth.service';

export class InstagramOAuthService extends BaseOAuthService {
  protected platform = Platform.INSTAGRAM;
  protected clientId = process.env.INSTAGRAM_CLIENT_ID!;
  protected clientSecret = process.env.INSTAGRAM_CLIENT_SECRET!;
  protected redirectUri = process.env.INSTAGRAM_REDIRECT_URI!;

  // Instagram Graph API requires Facebook OAuth with these scopes
  protected scopes = [
    'instagram_basic',              // Basic profile info
    'instagram_manage_insights',    // Analytics & insights
    'instagram_manage_comments',    // Comments management
    'pages_show_list',              // List Facebook Pages
    'pages_read_engagement',        // Page engagement data
  ];

  /**
   * Build Facebook OAuth authorization URL
   * Instagram Graph API uses Facebook OAuth, not Instagram OAuth
   */
  protected buildAuthorizationUrl(state: string, codeChallenge: string): string {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      scope: this.scopes.join(','),
      response_type: 'code',
      state,
    });

    // Facebook OAuth endpoint (NOT Instagram Basic Display)
    // This is the correct endpoint for Instagram Graph API
    return `https://www.facebook.com/v21.0/dialog/oauth?${params.toString()}`;
  }

  /**
   * Exchange authorization code for Facebook access token
   * Instagram Graph API uses Facebook tokens
   */
  async exchangeCodeForTokens(
    code: string,
    codeVerifier: string
  ): Promise<OAuthTokens> {
    try {
      console.log('[Instagram] Exchanging code for Facebook access token...');

      // Step 1: Get short-lived Facebook token
      const tokenResponse = await axios.get(
        'https://graph.facebook.com/v21.0/oauth/access_token',
        {
          params: {
            client_id: this.clientId,
            client_secret: this.clientSecret,
            redirect_uri: this.redirectUri,
            code,
          },
        }
      );

      const shortLivedToken = tokenResponse.data.access_token;
      console.log('[Instagram] Got short-lived token, exchanging for long-lived...');

      // Step 2: Exchange for long-lived token (60 days)
      const longLivedResponse = await axios.get(
        'https://graph.facebook.com/v21.0/oauth/access_token',
        {
          params: {
            grant_type: 'fb_exchange_token',
            client_id: this.clientId,
            client_secret: this.clientSecret,
            fb_exchange_token: shortLivedToken,
          },
        }
      );

      console.log('[Instagram] Got long-lived token');

      return {
        accessToken: longLivedResponse.data.access_token,
        expiresIn: longLivedResponse.data.expires_in || 5184000, // 60 days
        tokenType: 'Bearer',
      };
    } catch (error: any) {
      console.error('[Instagram] Token exchange failed:', error.response?.data || error.message);
      throw new Error('Failed to exchange code for Instagram tokens');
    }
  }

  /**
   * Refresh long-lived access token
   * Facebook long-lived tokens can be refreshed to extend expiry
   */
  async refreshAccessToken(accessToken: string): Promise<OAuthTokens> {
    try {
      console.log('[Instagram] Refreshing Facebook long-lived token...');

      const response = await axios.get(
        'https://graph.facebook.com/v21.0/oauth/access_token',
        {
          params: {
            grant_type: 'fb_exchange_token',
            client_id: this.clientId,
            client_secret: this.clientSecret,
            fb_exchange_token: accessToken,
          },
        }
      );

      console.log('[Instagram] Token refreshed successfully');

      return {
        accessToken: response.data.access_token,
        expiresIn: response.data.expires_in || 5184000, // 60 days
        tokenType: 'Bearer',
      };
    } catch (error: any) {
      console.error('[Instagram] Token refresh failed:', error.response?.data || error.message);
      throw new Error('Failed to refresh Instagram token');
    }
  }

  /**
   * Get Instagram Business Account information
   * Fetches from Facebook Pages API since we use Facebook OAuth
   */
  async getUserInfo(accessToken: string): Promise<OAuthUserInfo> {
    try {
      console.log('[Instagram] Fetching user Facebook Pages...');

      // Step 1: Get user's Facebook Pages
      const pagesResponse = await axios.get(
        'https://graph.facebook.com/v21.0/me/accounts',
        {
          params: {
            access_token: accessToken,
            fields: 'instagram_business_account,name',
          },
        }
      );

      console.log(`[Instagram] Found ${pagesResponse.data.data.length} Facebook Pages`);

      // Step 2: Find page with Instagram Business Account
      const pageWithInstagram = pagesResponse.data.data.find(
        (page: any) => page.instagram_business_account
      );

      if (!pageWithInstagram) {
        console.error('[Instagram] No Instagram Business Account found on any Facebook Page');
        throw new Error(
          'No Instagram Business Account found. Please connect your Instagram Business/Creator account to a Facebook Page.'
        );
      }

      const igAccountId = pageWithInstagram.instagram_business_account.id;
      console.log('[Instagram] Found Instagram Business Account:', igAccountId);

      // Step 3: Get Instagram account details
      const igResponse = await axios.get(
        `https://graph.facebook.com/v21.0/${igAccountId}`,
        {
          params: {
            access_token: accessToken,
            fields: 'id,username,name,profile_picture_url,followers_count,media_count',
          },
        }
      );

      console.log('[Instagram] Instagram account username:', igResponse.data.username);

      return {
        platformUserId: igResponse.data.id,
        platformUsername: igResponse.data.username,
      };
    } catch (error: any) {
      console.error('[Instagram] Failed to get user info:', error.response?.data || error.message);

      if (error.message.includes('No Instagram Business Account found')) {
        throw error; // Re-throw with user-friendly message
      }

      throw new Error('Failed to get Instagram user information');
    }
  }

  /**
   * Schedule token refresh (every 50 days, before 60-day expiry)
   */
  async scheduleTokenRefresh(userId: string) {
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
      } catch (error) {
        console.error(`Failed to refresh Instagram token for user ${userId}:`, error);
      }
    };

    // Start refresh cycle
    setTimeout(refresh, refreshInterval);
  }
}
