"use strict";
/**
 * Authentication Controller
 * Handles HTTP requests for authentication endpoints
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const auth_service_1 = require("../services/auth.service");
class AuthController {
    /**
     * POST /api/auth/register
     * Register a new user
     */
    static async register(req, res) {
        try {
            const { email, password, name } = req.body;
            const ipAddress = req.ip || req.socket.remoteAddress || 'unknown';
            const user = await auth_service_1.AuthService.register(email, password, name);
            // Log successful registration
            await auth_service_1.AuthService.logAuthAttempt(email, true, ipAddress, req.get('user-agent'));
            res.status(201).json({
                success: true,
                message: 'Registration successful. Please check your email to verify your account.',
                user,
            });
        }
        catch (error) {
            const ipAddress = req.ip || 'unknown';
            await auth_service_1.AuthService.logAuthAttempt(req.body.email, false, ipAddress, req.get('user-agent'));
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
    static async login(req, res) {
        try {
            const { email, password, rememberMe } = req.body;
            const ipAddress = req.ip || req.socket.remoteAddress || 'unknown';
            // Check rate limit
            const isRateLimited = await auth_service_1.AuthService.checkRateLimit(email, ipAddress);
            if (isRateLimited) {
                return res.status(429).json({
                    error: 'TooManyAttempts',
                    message: 'Too many failed login attempts. Please try again in 15 minutes.',
                });
            }
            const result = await auth_service_1.AuthService.login(email, password, rememberMe);
            // Log successful login
            await auth_service_1.AuthService.logAuthAttempt(email, true, ipAddress, req.get('user-agent'));
            // Set cookies with explicit path
            const cookieOptions = {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
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
        }
        catch (error) {
            const ipAddress = req.ip || 'unknown';
            await auth_service_1.AuthService.logAuthAttempt(req.body.email, false, ipAddress, req.get('user-agent'));
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
    static async logout(req, res) {
        try {
            const userId = req.user.userId;
            const refreshToken = req.cookies.refreshToken;
            await auth_service_1.AuthService.logout(userId, refreshToken);
            // Clear cookies
            res.clearCookie('accessToken');
            res.clearCookie('refreshToken');
            res.json({
                success: true,
                message: 'Logout successful',
            });
        }
        catch (error) {
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
    static async refreshToken(req, res) {
        try {
            const refreshToken = req.cookies.refreshToken || req.body.refreshToken;
            if (!refreshToken) {
                return res.status(401).json({
                    error: 'NoRefreshToken',
                    message: 'No refresh token provided',
                });
            }
            const result = await auth_service_1.AuthService.refreshToken(refreshToken);
            // Update cookies with explicit path - preserve rememberMe preference
            const cookieOptions = {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
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
        }
        catch (error) {
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
    static async forgotPassword(req, res) {
        try {
            const { email } = req.body;
            await auth_service_1.AuthService.forgotPassword(email);
            // Always return success (don't reveal if email exists)
            res.json({
                success: true,
                message: 'If that email exists, a password reset link has been sent.',
            });
        }
        catch (error) {
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
    static async resetPassword(req, res) {
        try {
            const { token, password } = req.body;
            await auth_service_1.AuthService.resetPassword(token, password);
            res.json({
                success: true,
                message: 'Password reset successful. You can now login with your new password.',
            });
        }
        catch (error) {
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
    static async verifyEmail(req, res) {
        try {
            const { token } = req.params;
            await auth_service_1.AuthService.verifyEmail(token);
            // Redirect to frontend success page
            res.redirect(`${process.env.FRONTEND_URL}/email-verified?success=true`);
        }
        catch (error) {
            // Redirect to frontend error page
            res.redirect(`${process.env.FRONTEND_URL}/email-verified?success=false&error=${encodeURIComponent(error.message)}`);
        }
    }
    /**
     * GET /api/auth/me
     * Get current user
     */
    static async getCurrentUser(req, res) {
        try {
            const userId = req.user.userId;
            const user = await auth_service_1.AuthService.getUserById(userId);
            res.json({
                success: true,
                user,
            });
        }
        catch (error) {
            res.status(404).json({
                error: 'UserNotFound',
                message: 'User not found',
            });
        }
    }
}
exports.AuthController = AuthController;
//# sourceMappingURL=auth.controller.js.map