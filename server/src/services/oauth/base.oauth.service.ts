/**
 * Base OAuth Service
 * Provides common OAuth functionality for all platforms
 */

import { PrismaClient, Platform } from '@prisma/client';
import { EncryptionService } from '../encryption.service';
import { createPKCEPair, generateState } from '../../utils/pkce';

const prisma = new PrismaClient();

export interface OAuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number; // seconds
  tokenType?: string;
}

export interface OAuthUserInfo {
  platformUserId: string;
  platformUsername?: string;
  email?: string;
}

export abstract class BaseOAuthService {
  protected abstract platform: Platform;
  protected abstract clientId: string;
  protected abstract clientSecret: string;
  protected abstract redirectUri: string;
  protected abstract scopes: string[];

  /**
   * Generate authorization URL with PKCE
   */
  async generateAuthorizationUrl(userId: string): Promise<{
    authUrl: string;
    state: string;
  }> {
    const state = generateState();
    const { codeVerifier, codeChallenge } = createPKCEPair();

    // Store PKCE verifier and state in session (temporary storage)
    await this.storeOAuthState(userId, state, codeVerifier);

    const authUrl = this.buildAuthorizationUrl(state, codeChallenge);

    return { authUrl, state };
  }

  /**
   * Abstract method to build platform-specific authorization URL
   */
  protected abstract buildAuthorizationUrl(
    state: string,
    codeChallenge: string
  ): string;

  /**
   * Exchange authorization code for tokens
   */
  abstract exchangeCodeForTokens(
    code: string,
    codeVerifier: string
  ): Promise<OAuthTokens>;

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
  async savePlatformConnection(
    userId: string,
    tokens: OAuthTokens,
    userInfo: OAuthUserInfo,
    scopesGranted: string[]
  ) {
    // Encrypt tokens before storing
    const encryptedAccessToken = EncryptionService.encrypt(tokens.accessToken);
    const encryptedRefreshToken = tokens.refreshToken
      ? EncryptionService.encrypt(tokens.refreshToken)
      : null;

    // Calculate token expiry
    const tokenExpiresAt = tokens.expiresIn
      ? new Date(Date.now() + tokens.expiresIn * 1000)
      : null;

    // Upsert connection (update if exists, create if not)
    const connection = await prisma.platformConnection.upsert({
      where: {
        userId_platform: {
          userId,
          platform: this.platform,
        },
      },
      update: {
        accessToken: encryptedAccessToken,
        refreshToken: encryptedRefreshToken,
        tokenExpiresAt,
        platformUserId: userInfo.platformUserId,
        platformUsername: userInfo.platformUsername,
        scopesGranted,
        isActive: true,
        lastSynced: new Date(),
      },
      create: {
        userId,
        platform: this.platform,
        accessToken: encryptedAccessToken,
        refreshToken: encryptedRefreshToken,
        tokenExpiresAt,
        platformUserId: userInfo.platformUserId,
        platformUsername: userInfo.platformUsername,
        scopesGranted,
        isActive: true,
      },
    });

    return connection;
  }

  /**
   * Get platform connection for user
   */
  async getConnection(userId: string) {
    const connection = await prisma.platformConnection.findUnique({
      where: {
        userId_platform: {
          userId,
          platform: this.platform,
        },
      },
    });

    if (!connection) {
      return null;
    }

    // Decrypt tokens
    return {
      ...connection,
      accessToken: EncryptionService.decrypt(connection.accessToken),
      refreshToken: connection.refreshToken
        ? EncryptionService.decrypt(connection.refreshToken)
        : null,
    };
  }

  /**
   * Disconnect platform
   */
  async disconnect(userId: string) {
    await prisma.platformConnection.deleteMany({
      where: {
        userId,
        platform: this.platform,
      },
    });

    return { success: true };
  }

  /**
   * Check if token is expired
   */
  isTokenExpired(expiresAt?: Date): boolean {
    if (!expiresAt) return false;
    return expiresAt < new Date();
  }

  /**
   * Auto-refresh token if expired
   */
  async getValidAccessToken(userId: string): Promise<string | null> {
    const connection = await this.getConnection(userId);

    if (!connection || !connection.isActive) {
      return null;
    }

    // Check if token is expired
    if (this.isTokenExpired(connection.tokenExpiresAt)) {
      if (!connection.refreshToken) {
        // Mark connection as inactive
        await prisma.platformConnection.update({
          where: { id: connection.id },
          data: { isActive: false },
        });
        return null;
      }

      // Refresh token
      try {
        const newTokens = await this.refreshAccessToken(connection.refreshToken);

        // Update connection with new tokens
        const encryptedAccessToken = EncryptionService.encrypt(newTokens.accessToken);
        const encryptedRefreshToken = newTokens.refreshToken
          ? EncryptionService.encrypt(newTokens.refreshToken)
          : connection.refreshToken;

        const tokenExpiresAt = newTokens.expiresIn
          ? new Date(Date.now() + newTokens.expiresIn * 1000)
          : null;

        await prisma.platformConnection.update({
          where: { id: connection.id },
          data: {
            accessToken: encryptedAccessToken,
            refreshToken: encryptedRefreshToken,
            tokenExpiresAt,
          },
        });

        return newTokens.accessToken;
      } catch (error) {
        console.error(`Failed to refresh ${this.platform} token:`, error);
        // Mark connection as inactive
        await prisma.platformConnection.update({
          where: { id: connection.id },
          data: { isActive: false },
        });
        return null;
      }
    }

    return connection.accessToken;
  }

  /**
   * Store OAuth state temporarily (in-memory for simplicity)
   * In production, use Redis or database
   */
  private static oauthStates = new Map<
    string,
    { userId: string; codeVerifier: string; timestamp: number }
  >();

  private async storeOAuthState(
    userId: string,
    state: string,
    codeVerifier: string
  ) {
    BaseOAuthService.oauthStates.set(state, {
      userId,
      codeVerifier,
      timestamp: Date.now(),
    });

    // Clean up old states (> 10 minutes)
    this.cleanupOldStates();
  }

  protected async getOAuthState(state: string): Promise<{
    userId: string;
    codeVerifier: string;
  } | null> {
    const stored = BaseOAuthService.oauthStates.get(state);

    if (!stored) {
      return null;
    }

    // Check if state is expired (10 minutes)
    if (Date.now() - stored.timestamp > 10 * 60 * 1000) {
      BaseOAuthService.oauthStates.delete(state);
      return null;
    }

    // Delete state after use (one-time use)
    BaseOAuthService.oauthStates.delete(state);

    return {
      userId: stored.userId,
      codeVerifier: stored.codeVerifier,
    };
  }

  private cleanupOldStates() {
    const tenMinutesAgo = Date.now() - 10 * 60 * 1000;

    for (const [state, data] of BaseOAuthService.oauthStates.entries()) {
      if (data.timestamp < tenMinutesAgo) {
        BaseOAuthService.oauthStates.delete(state);
      }
    }
  }

  /**
   * Log OAuth attempt
   */
  protected async logOAuthAttempt(
    userId: string | null,
    success: boolean,
    error: string | null,
    ipAddress: string
  ) {
    await prisma.oAuthAttempt.create({
      data: {
        userId,
        platform: this.platform,
        success,
        error,
        ipAddress,
      },
    });
  }
}
