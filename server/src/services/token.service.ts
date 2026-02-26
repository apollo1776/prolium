/**
 * Token Service
 * Handles JWT token generation, validation, and refresh
 */

import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';

interface AccessTokenPayload {
  userId: string;
  email: string;
  type: 'access';
}

interface RefreshTokenPayload {
  userId: string;
  type: 'refresh';
  jti: string; // JWT ID for token rotation
  rememberMe?: boolean; // Store remember me preference
}

export class TokenService {
  private static accessSecret: string;
  private static refreshSecret: string;

  /**
   * Initialize token secrets from environment
   */
  static initialize(): void {
    this.accessSecret = process.env.JWT_ACCESS_SECRET;
    this.refreshSecret = process.env.JWT_REFRESH_SECRET;

    if (!this.accessSecret || !this.refreshSecret) {
      throw new Error('JWT secrets not configured');
    }
  }

  /**
   * Generate access token (short-lived, 15 minutes)
   */
  static generateAccessToken(userId: string, email: string): string {
    if (!this.accessSecret) {
      this.initialize();
    }

    const payload: AccessTokenPayload = {
      userId,
      email,
      type: 'access',
    };

    return jwt.sign(payload, this.accessSecret, {
      expiresIn: ACCESS_TOKEN_EXPIRY,
      issuer: 'proliumai',
      audience: 'proliumai-client',
    });
  }

  /**
   * Generate refresh token (long-lived, 7 days or 1 day based on rememberMe)
   */
  static generateRefreshToken(userId: string, rememberMe = false): { token: string; jti: string } {
    if (!this.refreshSecret) {
      this.initialize();
    }

    const jti = uuidv4(); // Unique identifier for token rotation
    const expiresIn = rememberMe ? '7d' : '1d';

    const payload: RefreshTokenPayload = {
      userId,
      type: 'refresh',
      jti,
      rememberMe,
    };

    const token = jwt.sign(payload, this.refreshSecret, {
      expiresIn,
      issuer: 'proliumai',
      audience: 'proliumai-client',
    });

    return { token, jti };
  }

  /**
   * Verify and decode access token
   */
  static verifyAccessToken(token: string): AccessTokenPayload {
    if (!this.accessSecret) {
      this.initialize();
    }

    try {
      const payload = jwt.verify(token, this.accessSecret, {
        issuer: 'proliumai',
        audience: 'proliumai-client',
      }) as AccessTokenPayload;

      if (payload.type !== 'access') {
        throw new Error('Invalid token type');
      }

      return payload;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error('Token expired');
      } else if (error instanceof jwt.JsonWebTokenError) {
        throw new Error('Invalid token');
      }
      throw error;
    }
  }

  /**
   * Verify and decode refresh token
   */
  static verifyRefreshToken(token: string): RefreshTokenPayload {
    if (!this.refreshSecret) {
      this.initialize();
    }

    try {
      const payload = jwt.verify(token, this.refreshSecret, {
        issuer: 'proliumai',
        audience: 'proliumai-client',
      }) as RefreshTokenPayload;

      if (payload.type !== 'refresh') {
        throw new Error('Invalid token type');
      }

      return payload;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error('Refresh token expired');
      } else if (error instanceof jwt.JsonWebTokenError) {
        throw new Error('Invalid refresh token');
      }
      throw error;
    }
  }

  /**
   * Get token expiration date
   */
  static getTokenExpiration(days: number): Date {
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + days);
    return expiryDate;
  }

  /**
   * Calculate expiration timestamp for access token (15 minutes)
   */
  static getAccessTokenExpiry(): number {
    return 15 * 60 * 1000; // 15 minutes in milliseconds
  }

  /**
   * Calculate expiration timestamp for refresh token (7 days)
   */
  static getRefreshTokenExpiry(): number {
    return 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
  }
}
