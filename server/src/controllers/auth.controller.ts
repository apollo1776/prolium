/**
 * Authentication Controller
 * Handles HTTP requests for authentication endpoints
 */

import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { UploadService } from '../services/upload.service';

export class AuthController {
  /**
   * POST /api/auth/register
   * Register a new user
   */
  static async register(req: Request, res: Response) {
    try {
      const { email, password, name } = req.body;
      const ipAddress = req.ip || req.socket.remoteAddress || 'unknown';

      const user = await AuthService.register(email, password, name);

      // Log successful registration
      await AuthService.logAuthAttempt(email, true, ipAddress, req.get('user-agent'));

      res.status(201).json({
        success: true,
        message: 'Registration successful. Please check your email to verify your account.',
        user,
      });
    } catch (error: any) {
      const ipAddress = req.ip || 'unknown';
      await AuthService.logAuthAttempt(req.body.email, false, ipAddress, req.get('user-agent'));

      res.status(400).json({
        error: 'RegistrationFailed',
        message: error.message || 'Failed to register user',
      });
    }
  }

  /**
   * POST /api/auth/login
   * Login user
   */
  static async login(req: Request, res: Response) {
    try {
      const { email, password, rememberMe } = req.body;
      const ipAddress = req.ip || req.socket.remoteAddress || 'unknown';

      // Check rate limit
      const isRateLimited = await AuthService.checkRateLimit(email, ipAddress);
      if (isRateLimited) {
        return res.status(429).json({
          error: 'TooManyAttempts',
          message: 'Too many failed login attempts. Please try again in 15 minutes.',
        });
      }

      const result = await AuthService.login(email, password, rememberMe);

      // Log successful login
      await AuthService.logAuthAttempt(email, true, ipAddress, req.get('user-agent'));

      // Set cookies with explicit path
      const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax' as const,
        path: '/',
        maxAge: rememberMe ? 7 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000,
      };

      res.cookie('accessToken', result.accessToken, cookieOptions);
      res.cookie('refreshToken', result.refreshToken, cookieOptions);

      console.log('Cookies set:', { rememberMe, maxAge: cookieOptions.maxAge });

      res.json({
        success: true,
        message: 'Login successful',
        user: result.user,
        accessToken: result.accessToken,
        expiresIn: result.expiresIn,
      });
    } catch (error: any) {
      const ipAddress = req.ip || 'unknown';
      await AuthService.logAuthAttempt(req.body.email, false, ipAddress, req.get('user-agent'));

      if (error.message === 'Please verify your email before logging in') {
        return res.status(403).json({
          error: 'EmailNotVerified',
          message: error.message,
        });
      }

      res.status(401).json({
        error: 'LoginFailed',
        message: 'Invalid credentials',
      });
    }
  }

  /**
   * POST /api/auth/logout
   * Logout user
   */
  static async logout(req: Request, res: Response) {
    try {
      const userId = req.user!.userId;
      const refreshToken = req.cookies.refreshToken;

      await AuthService.logout(userId, refreshToken);

      // Clear cookies
      res.clearCookie('accessToken');
      res.clearCookie('refreshToken');

      res.json({
        success: true,
        message: 'Logout successful',
      });
    } catch (error: any) {
      res.status(500).json({
        error: 'LogoutFailed',
        message: 'Failed to logout',
      });
    }
  }

  /**
   * POST /api/auth/refresh-token
   * Refresh access token
   */
  static async refreshToken(req: Request, res: Response) {
    try {
      const refreshToken = req.cookies.refreshToken || req.body.refreshToken;

      if (!refreshToken) {
        return res.status(401).json({
          error: 'NoRefreshToken',
          message: 'No refresh token provided',
        });
      }

      const result = await AuthService.refreshToken(refreshToken);

      // Update cookies with explicit path - preserve rememberMe preference
      const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax' as const,
        path: '/',
        maxAge: result.rememberMe ? 7 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000,
      };

      res.cookie('accessToken', result.accessToken, cookieOptions);
      res.cookie('refreshToken', result.refreshToken, cookieOptions);

      console.log('Tokens refreshed successfully', { rememberMe: result.rememberMe, maxAge: cookieOptions.maxAge });

      res.json({
        success: true,
        accessToken: result.accessToken,
        expiresIn: result.expiresIn,
      });
    } catch (error: any) {
      res.status(401).json({
        error: 'RefreshFailed',
        message: error.message || 'Failed to refresh token',
      });
    }
  }

  /**
   * POST /api/auth/forgot-password
   * Request password reset
   */
  static async forgotPassword(req: Request, res: Response) {
    try {
      const { email } = req.body;

      await AuthService.forgotPassword(email);

      // Always return success (don't reveal if email exists)
      res.json({
        success: true,
        message: 'If that email exists, a password reset link has been sent.',
      });
    } catch (error: any) {
      res.status(500).json({
        error: 'ForgotPasswordFailed',
        message: 'Failed to process password reset request',
      });
    }
  }

  /**
   * POST /api/auth/reset-password
   * Reset password with token
   */
  static async resetPassword(req: Request, res: Response) {
    try {
      const { token, password } = req.body;

      await AuthService.resetPassword(token, password);

      res.json({
        success: true,
        message: 'Password reset successful. You can now login with your new password.',
      });
    } catch (error: any) {
      res.status(400).json({
        error: 'ResetPasswordFailed',
        message: error.message || 'Failed to reset password',
      });
    }
  }

  /**
   * GET /api/auth/verify-email/:token
   * Verify email address
   */
  static async verifyEmail(req: Request, res: Response) {
    try {
      const { token } = req.params;

      await AuthService.verifyEmail(token);

      // Redirect to frontend success page
      res.redirect(`${process.env.FRONTEND_URL}/email-verified?success=true`);
    } catch (error: any) {
      // Redirect to frontend error page
      res.redirect(
        `${process.env.FRONTEND_URL}/email-verified?success=false&error=${encodeURIComponent(error.message)}`
      );
    }
  }

  /**
   * GET /api/auth/me
   * Get current user
   */
  static async getCurrentUser(req: Request, res: Response) {
    try {
      const userId = req.user!.userId;

      const user = await AuthService.getUserById(userId);

      res.json({
        success: true,
        user,
      });
    } catch (error: any) {
      res.status(404).json({
        error: 'UserNotFound',
        message: 'User not found',
      });
    }
  }

  /**
   * POST /api/auth/change-password
   * Change user password
   */
  static async changePassword(req: Request, res: Response) {
    try {
      const userId = req.user!.userId;
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({
          error: 'MissingFields',
          message: 'Current password and new password are required',
        });
      }

      await AuthService.changePassword(userId, currentPassword, newPassword);

      res.json({
        success: true,
        message: 'Password changed successfully',
      });
    } catch (error: any) {
      res.status(400).json({
        error: 'ChangePasswordFailed',
        message: error.message || 'Failed to change password',
      });
    }
  }

  /**
   * POST /api/auth/2fa/setup
   * Setup 2FA for user
   */
  static async setup2FA(req: Request, res: Response) {
    try {
      const userId = req.user!.userId;

      const result = await AuthService.setup2FA(userId);

      res.json({
        success: true,
        secret: result.secret,
        qrCode: result.qrCode,
      });
    } catch (error: any) {
      res.status(500).json({
        error: 'Setup2FAFailed',
        message: error.message || 'Failed to setup 2FA',
      });
    }
  }

  /**
   * POST /api/auth/2fa/verify
   * Verify 2FA code and enable 2FA
   */
  static async verify2FA(req: Request, res: Response) {
    try {
      const userId = req.user!.userId;
      const { token } = req.body;

      if (!token) {
        return res.status(400).json({
          error: 'MissingToken',
          message: 'Verification code is required',
        });
      }

      const result = await AuthService.verify2FA(userId, token);

      res.json({
        success: true,
        message: '2FA enabled successfully',
        backupCodes: result.backupCodes,
      });
    } catch (error: any) {
      res.status(400).json({
        error: 'Verify2FAFailed',
        message: error.message || 'Failed to verify 2FA code',
      });
    }
  }

  /**
   * POST /api/auth/2fa/disable
   * Disable 2FA
   */
  static async disable2FA(req: Request, res: Response) {
    try {
      const userId = req.user!.userId;
      const { token } = req.body;

      if (!token) {
        return res.status(400).json({
          error: 'MissingToken',
          message: 'Verification code is required',
        });
      }

      await AuthService.disable2FA(userId, token);

      res.json({
        success: true,
        message: '2FA disabled successfully',
      });
    } catch (error: any) {
      res.status(400).json({
        error: 'Disable2FAFailed',
        message: error.message || 'Failed to disable 2FA',
      });
    }
  }

  /**
   * GET /api/auth/sessions
   * Get active sessions
   */
  static async getActiveSessions(req: Request, res: Response) {
    try {
      const userId = req.user!.userId;

      const sessions = await AuthService.getActiveSessions(userId);

      res.json({
        success: true,
        sessions,
      });
    } catch (error: any) {
      res.status(500).json({
        error: 'GetSessionsFailed',
        message: 'Failed to retrieve sessions',
      });
    }
  }

  /**
   * DELETE /api/auth/sessions/:sessionId
   * Revoke a session
   */
  static async revokeSession(req: Request, res: Response) {
    try {
      const userId = req.user!.userId;
      const { sessionId } = req.params;

      await AuthService.revokeSession(userId, sessionId);

      res.json({
        success: true,
        message: 'Session revoked successfully',
      });
    } catch (error: any) {
      res.status(500).json({
        error: 'RevokeSessionFailed',
        message: 'Failed to revoke session',
      });
    }
  }

  /**
   * PUT /api/auth/profile
   * Update user profile
   */
  static async updateProfile(req: Request, res: Response) {
    try {
      const userId = req.user!.userId;
      const { name, email, country, timezone, phone, bio } = req.body;

      const updatedUser = await AuthService.updateProfile(userId, {
        name,
        email,
        country,
        timezone,
        phone,
        bio,
      });

      res.json({
        success: true,
        message: 'Profile updated successfully',
        user: updatedUser,
      });
    } catch (error: any) {
      res.status(400).json({
        error: 'UpdateProfileFailed',
        message: error.message || 'Failed to update profile',
      });
    }
  }

  /**
   * POST /api/auth/upload-profile-picture
   * Upload profile picture
   */
  static async uploadProfilePicture(req: Request, res: Response) {
    try {
      const userId = req.user!.userId;

      if (!req.file) {
        return res.status(400).json({
          error: 'NoFileProvided',
          message: 'No file was uploaded',
        });
      }

      // Get current user to delete old profile picture
      const currentUser = await AuthService.getUserById(userId);
      if (currentUser.profilePicture) {
        UploadService.deleteProfilePicture(currentUser.profilePicture);
      }

      // Generate URL for the uploaded file
      const profilePictureUrl = UploadService.getProfilePictureUrl(req.file.filename);

      // Update user with new profile picture
      const updatedUser = await AuthService.updateProfile(userId, {
        profilePicture: profilePictureUrl,
      });

      res.json({
        success: true,
        message: 'Profile picture uploaded successfully',
        profilePicture: profilePictureUrl,
        user: updatedUser,
      });
    } catch (error: any) {
      res.status(500).json({
        error: 'UploadFailed',
        message: error.message || 'Failed to upload profile picture',
      });
    }
  }

  /**
   * DELETE /api/auth/profile-picture
   * Remove profile picture
   */
  static async removeProfilePicture(req: Request, res: Response) {
    try {
      const userId = req.user!.userId;

      // Get current user to delete profile picture file
      const currentUser = await AuthService.getUserById(userId);
      if (currentUser.profilePicture) {
        UploadService.deleteProfilePicture(currentUser.profilePicture);
      }

      // Update user to remove profile picture
      const updatedUser = await AuthService.updateProfile(userId, {
        profilePicture: null,
      });

      res.json({
        success: true,
        message: 'Profile picture removed successfully',
        user: updatedUser,
      });
    } catch (error: any) {
      res.status(500).json({
        error: 'RemoveFailed',
        message: 'Failed to remove profile picture',
      });
    }
  }
}
