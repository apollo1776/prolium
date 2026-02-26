"use strict";
/**
 * Authentication Service
 * Handles user registration, login, password management
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const client_1 = require("@prisma/client");
const token_service_1 = require("./token.service");
const email_service_1 = require("./email.service");
const encryption_service_1 = require("./encryption.service");
const prisma = new client_1.PrismaClient();
const BCRYPT_ROUNDS = 12;
const EMAIL_VERIFICATION_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours
const PASSWORD_RESET_EXPIRY = 60 * 60 * 1000; // 1 hour
class AuthService {
    /**
     * Register a new user
     */
    static async register(email, password, name) {
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
        const passwordHash = await bcrypt_1.default.hash(password, BCRYPT_ROUNDS);
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
        const verificationToken = encryption_service_1.EncryptionService.generateToken(32);
        const expiresAt = new Date(Date.now() + EMAIL_VERIFICATION_EXPIRY);
        await prisma.emailVerificationToken.create({
            data: {
                userId: user.id,
                token: verificationToken,
                expiresAt,
            },
        });
        // Send verification email
        await email_service_1.EmailService.sendVerificationEmail(email, name || 'there', verificationToken);
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
    static async login(email, password, rememberMe = false) {
        // Find user
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || !user.passwordHash) {
            throw new Error('Invalid credentials');
        }
        // Verify password
        const isValid = await bcrypt_1.default.compare(password, user.passwordHash);
        if (!isValid) {
            throw new Error('Invalid credentials');
        }
        // Check email verification
        if (!user.emailVerified) {
            throw new Error('Please verify your email before logging in');
        }
        // Generate tokens
        const accessToken = token_service_1.TokenService.generateAccessToken(user.id, user.email);
        const { token: refreshToken, jti } = token_service_1.TokenService.generateRefreshToken(user.id, rememberMe);
        // Calculate expiry (7 days for remember me, 24 hours otherwise)
        const expiryDays = rememberMe ? 7 : 1;
        const expiresAt = token_service_1.TokenService.getTokenExpiration(expiryDays);
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
            expiresIn: token_service_1.TokenService.getAccessTokenExpiry(),
        };
    }
    /**
     * Verify email
     */
    static async verifyEmail(token) {
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
        await email_service_1.EmailService.sendWelcomeEmail(verificationToken.user.email, verificationToken.user.name || 'there');
        return verificationToken.user;
    }
    /**
     * Request password reset
     */
    static async forgotPassword(email) {
        const user = await prisma.user.findUnique({ where: { email } });
        // Always return success (don't reveal if email exists)
        if (!user) {
            return { success: true };
        }
        // Generate reset token
        const resetToken = encryption_service_1.EncryptionService.generateToken(32);
        const expiresAt = new Date(Date.now() + PASSWORD_RESET_EXPIRY);
        await prisma.passwordResetToken.create({
            data: {
                userId: user.id,
                token: resetToken,
                expiresAt,
            },
        });
        // Send reset email
        await email_service_1.EmailService.sendPasswordResetEmail(email, user.name || 'there', resetToken);
        return { success: true };
    }
    /**
     * Reset password with token
     */
    static async resetPassword(token, newPassword) {
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
        const passwordHash = await bcrypt_1.default.hash(newPassword, BCRYPT_ROUNDS);
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
    static async refreshToken(refreshToken) {
        // Verify refresh token
        const payload = token_service_1.TokenService.verifyRefreshToken(refreshToken);
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
        const newAccessToken = token_service_1.TokenService.generateAccessToken(session.user.id, session.user.email);
        const { token: newRefreshToken } = token_service_1.TokenService.generateRefreshToken(session.user.id, rememberMe);
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
            expiresIn: token_service_1.TokenService.getAccessTokenExpiry(),
            rememberMe, // Return rememberMe so controller can set cookie expiry correctly
        };
    }
    /**
     * Logout user
     */
    static async logout(userId, refreshToken) {
        if (refreshToken) {
            // Delete specific session
            await prisma.session.deleteMany({
                where: {
                    userId,
                    refreshToken,
                },
            });
        }
        else {
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
    static async getUserById(userId) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
        });
        if (!user) {
            throw new Error('User not found');
        }
        return {
            id: user.id,
            email: user.email,
            name: user.name,
            emailVerified: user.emailVerified,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
            lastLogin: user.lastLogin,
        };
    }
    /**
     * Log authentication attempt
     */
    static async logAuthAttempt(email, success, ipAddress, userAgent) {
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
    static async checkRateLimit(email, ipAddress) {
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
}
exports.AuthService = AuthService;
//# sourceMappingURL=auth.service.js.map