/**
 * Authentication Service
 * Handles user registration, login, password management
 */

import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';
import { TokenService } from './token.service';
import { EmailService } from './email.service';
import { EncryptionService } from './encryption.service';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';

const prisma = new PrismaClient();
const BCRYPT_ROUNDS = 12;
const EMAIL_VERIFICATION_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours
const PASSWORD_RESET_EXPIRY = 60 * 60 * 1000; // 1 hour

export class AuthService {
  /**
   * Register a new user
   */
  static async register(email: string, password: string, name?: string) {
    // Check if user exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new Error('Email already registered');
    }

    // Validate password strength
    if (password.length < 8) {
      throw new Error('Password must be at least 8 characters');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name,
        emailVerified: false,
      },
    });

    // Generate verification token
    const verificationToken = EncryptionService.generateToken(32);
    const expiresAt = new Date(Date.now() + EMAIL_VERIFICATION_EXPIRY);

    await prisma.emailVerificationToken.create({
      data: {
        userId: user.id,
        token: verificationToken,
        expiresAt,
      },
    });

        // Send verification email (non-blocking - don't fail registration if email fails)
            try {
                        await EmailService.sendVerificationEmail(email, name || 'there', verificationToken);
            } catch (emailError) {
                        console.warn('Failed to send verification email, but registration succeeded:', emailError);
            }
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  /**
   * Login user
   */
  static async login(email: string, password: string, rememberMe: boolean = false) {
    // Find user
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.passwordHash) {
      throw new Error('Invalid credentials');
    }

    // Verify password
    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      throw new Error('Invalid credentials');
    }

    // Check email verification
    if (!user.emailVerified) {
      throw new Error('Please verify your email before logging in');
    }

    // Generate tokens
    const accessToken = TokenService.generateAccessToken(user.id, user.email);
    const { token: refreshToken, jti } = TokenService.generateRefreshToken(user.id, rememberMe);

    // Calculate expiry (7 days for remember me, 24 hours otherwise)
    const expiryDays = rememberMe ? 7 : 1;
    const expiresAt = TokenService.getTokenExpiration(expiryDays);

    // Create session
    await prisma.session.create({
      data: {
        userId: user.id,
        token: accessToken,
        refreshToken,
        expiresAt,
      },
    });

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        lastLogin: new Date(),
      },
      accessToken,
      refreshToken,
      expiresIn: TokenService.getAccessTokenExpiry(),
    };
  }

  /**
   * Verify email
   */
  static async verifyEmail(token: string) {
    const verificationToken = await prisma.emailVerificationToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!verificationToken) {
      throw new Error('Invalid verification token');
    }

    if (verificationToken.expiresAt < new Date()) {
      throw new Error('Verification token expired');
    }

    // Update user
    await prisma.user.update({
      where: { id: verificationToken.userId },
      data: { emailVerified: true },
    });

    // Delete verification token
    await prisma.emailVerificationToken.delete({
      where: { id: verificationToken.id },
    });

    // Send welcome email
    await EmailService.sendWelcomeEmail(
      verificationToken.user.email,
      verificationToken.user.name || 'there'
    );

    return verificationToken.user;
  }

  /**
   * Request password reset
   */
  static async forgotPassword(email: string) {
    const user = await prisma.user.findUnique({ where: { email } });

    // Always return success (don't reveal if email exists)
    if (!user) {
      return { success: true };
    }

    // Generate reset token
    const resetToken = EncryptionService.generateToken(32);
    const expiresAt = new Date(Date.now() + PASSWORD_RESET_EXPIRY);

    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token: resetToken,
        expiresAt,
      },
    });

    // Send reset email
    await EmailService.sendPasswordResetEmail(email, user.name || 'there', resetToken);

    return { success: true };
  }

  /**
   * Reset password with token
   */
  static async resetPassword(token: string, newPassword: string) {
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!resetToken || resetToken.used) {
      throw new Error('Invalid or expired reset token');
    }

    if (resetToken.expiresAt < new Date()) {
      throw new Error('Reset token expired');
    }

    // Validate new password
    if (newPassword.length < 8) {
      throw new Error('Password must be at least 8 characters');
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);

    // Update password
    await prisma.user.update({
      where: { id: resetToken.userId },
      data: { passwordHash },
    });

    // Mark token as used
    await prisma.passwordResetToken.update({
      where: { id: resetToken.id },
      data: { used: true },
    });

    // Invalidate all sessions
    await prisma.session.deleteMany({
      where: { userId: resetToken.userId },
    });

    return { success: true };
  }

  /**
   * Refresh access token
   */
  static async refreshToken(refreshToken: string) {
    // Verify refresh token
    const payload = TokenService.verifyRefreshToken(refreshToken);

    // Get rememberMe preference from token payload
    const rememberMe = payload.rememberMe || false;

    // Find session
    const session = await prisma.session.findUnique({
      where: { refreshToken },
      include: { user: true },
    });

    if (!session) {
      throw new Error('Invalid refresh token');
    }

    if (session.expiresAt < new Date()) {
      throw new Error('Session expired');
    }

    // Generate new tokens (rotation) - preserve rememberMe
    const newAccessToken = TokenService.generateAccessToken(
      session.user.id,
      session.user.email
    );
    const { token: newRefreshToken } = TokenService.generateRefreshToken(session.user.id, rememberMe);

    // Update session
    await prisma.session.update({
      where: { id: session.id },
      data: {
        token: newAccessToken,
        refreshToken: newRefreshToken,
      },
    });

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      expiresIn: TokenService.getAccessTokenExpiry(),
      rememberMe, // Return rememberMe so controller can set cookie expiry correctly
    };
  }

  /**
   * Logout user
   */
  static async logout(userId: string, refreshToken?: string) {
    if (refreshToken) {
      // Delete specific session
      await prisma.session.deleteMany({
        where: {
          userId,
          refreshToken,
        },
      });
    } else {
      // Delete all sessions for user
      await prisma.session.deleteMany({
        where: { userId },
      });
    }

    return { success: true };
  }

  /**
   * Get user by ID
   */
  static async getUserById(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        sessions: {
          where: {
            expiresAt: {
              gt: new Date(),
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 1,
        },
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Infer rememberMe from session expiry time
    // If session expires in more than 2 days, it's a "remember me" session (7 days)
    // Otherwise it's a normal session (1 day)
    let rememberMe = false;
    if (user.sessions.length > 0) {
      const session = user.sessions[0];
      const timeUntilExpiry = session.expiresAt.getTime() - Date.now();
      const daysUntilExpiry = timeUntilExpiry / (1000 * 60 * 60 * 24);
      rememberMe = daysUntilExpiry > 2; // If more than 2 days left, it was a "remember me" login
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      lastLogin: user.lastLogin,
      country: user.country,
      timezone: user.timezone,
      phone: user.phone,
      bio: user.bio,
      profilePicture: user.profilePicture,
      twoFactorEnabled: user.twoFactorEnabled,
      rememberMe, // Return the inferred rememberMe value
    };
  }

  /**
   * Log authentication attempt
   */
  static async logAuthAttempt(
    email: string,
    success: boolean,
    ipAddress: string,
    userAgent?: string
  ) {
    await prisma.authAttempt.create({
      data: {
        email,
        success,
        ipAddress,
        userAgent,
      },
    });
  }

  /**
   * Check if user has too many failed login attempts
   */
  static async checkRateLimit(email: string, ipAddress: string): Promise<boolean> {
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);

    const recentAttempts = await prisma.authAttempt.count({
      where: {
        email,
        success: false,
        createdAt: {
          gte: fifteenMinutesAgo,
        },
      },
    });

    return recentAttempts >= 5;
  }

  /**
   * Change user password
   */
  static async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.passwordHash) {
      throw new Error('User not found');
    }

    // Verify current password
    const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValid) {
      throw new Error('Current password is incorrect');
    }

    // Validate new password
    if (newPassword.length < 8) {
      throw new Error('Password must be at least 8 characters');
    }

    // Check password has uppercase, number, and special character
    const hasUpperCase = /[A-Z]/.test(newPassword);
    const hasNumber = /[0-9]/.test(newPassword);
    const hasSpecial = /[^A-Za-z0-9]/.test(newPassword);

    if (!hasUpperCase || !hasNumber || !hasSpecial) {
      throw new Error('Password must include uppercase, number, and special character');
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    // Invalidate all sessions except current one
    await prisma.session.deleteMany({
      where: { userId },
    });

    return { success: true };
  }

  /**
   * Setup 2FA - Generate secret and QR code
   */
  static async setup2FA(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new Error('User not found');
    }

    // Generate secret
    const secret = speakeasy.generateSecret({
      name: `Prolium (${user.email})`,
      length: 20,
    });

    // Generate QR code
    const qrCode = await QRCode.toDataURL(secret.otpauth_url!);

    // Store encrypted secret temporarily (not enabled yet)
    await prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorSecret: EncryptionService.encrypt(secret.base32),
        twoFactorEnabled: false, // Not enabled until verified
      },
    });

    return {
      secret: secret.base32,
      qrCode,
    };
  }

  /**
   * Verify 2FA code and enable 2FA
   */
  static async verify2FA(userId: string, token: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.twoFactorSecret) {
      throw new Error('2FA not set up');
    }

    const secret = EncryptionService.decrypt(user.twoFactorSecret);

    const verified = speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token,
      window: 2, // Allow 2 time steps before/after
    });

    if (!verified) {
      throw new Error('Invalid code');
    }

    // Enable 2FA
    await prisma.user.update({
      where: { id: userId },
      data: { twoFactorEnabled: true },
    });

    // Generate backup codes
    const backupCodes = Array.from({ length: 10 }, () =>
      EncryptionService.generateToken(8).toUpperCase()
    );

    // Store encrypted backup codes
    await prisma.user.update({
      where: { id: userId },
      data: {
        backupCodes: backupCodes.map(code => EncryptionService.encrypt(code)),
      },
    });

    return { success: true, backupCodes };
  }

  /**
   * Disable 2FA
   */
  static async disable2FA(userId: string, token: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.twoFactorSecret || !user.twoFactorEnabled) {
      throw new Error('2FA not enabled');
    }

    const secret = EncryptionService.decrypt(user.twoFactorSecret);

    const verified = speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token,
      window: 2,
    });

    if (!verified) {
      throw new Error('Invalid code');
    }

    // Disable 2FA
    await prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorSecret: null,
        twoFactorEnabled: false,
        backupCodes: [],
      },
    });

    return { success: true };
  }

  /**
   * Get active sessions for user
   */
  static async getActiveSessions(userId: string) {
    const sessions = await prisma.session.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return sessions.map(session => ({
      id: session.id,
      createdAt: session.createdAt,
      expiresAt: session.expiresAt,
      // Would normally store device info, IP, location
    }));
  }

  /**
   * Revoke a session
   */
  static async revokeSession(userId: string, sessionId: string) {
    await prisma.session.deleteMany({
      where: {
        id: sessionId,
        userId, // Ensure user can only revoke their own sessions
      },
    });

    return { success: true };
  }

  /**
   * Update user profile
   */
  static async updateProfile(
    userId: string,
    data: {
      name?: string;
      email?: string;
      country?: string;
      timezone?: string;
      phone?: string;
      bio?: string;
      profilePicture?: string | null;
    }
  ) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new Error('User not found');
    }

    // If email is being changed, verify it's not taken
    if (data.email && data.email !== user.email) {
      const existing = await prisma.user.findUnique({
        where: { email: data.email },
      });
      if (existing) {
        throw new Error('Email already in use');
      }
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        name: data.name,
        email: data.email,
        country: data.country,
        timezone: data.timezone,
        phone: data.phone,
        bio: data.bio,
        profilePicture: data.profilePicture !== undefined ? data.profilePicture : undefined,
      },
    });

    return {
      id: updated.id,
      email: updated.email,
      name: updated.name,
      country: updated.country,
      timezone: updated.timezone,
      phone: updated.phone,
      bio: updated.bio,
      profilePicture: updated.profilePicture,
    };
  }
}
