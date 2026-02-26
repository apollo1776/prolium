"use strict";
/**
 * Email Service
 * Handles email sending via SendGrid
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailService = void 0;
const mail_1 = __importDefault(require("@sendgrid/mail"));
class EmailService {
    /**
     * Initialize SendGrid with API key
     */
    static initialize() {
        if (this.initialized)
            return;
        const apiKey = process.env.SENDGRID_API_KEY;
        if (!apiKey || apiKey === 'SG.your_sendgrid_api_key_here') {
            console.warn('⚠️  SendGrid not configured. Email functionality will be disabled.');
            return;
        }
        mail_1.default.setApiKey(apiKey);
        this.initialized = true;
        console.log('✓ SendGrid initialized');
    }
    /**
     * Send email verification link
     */
    static async sendVerificationEmail(to, name, verificationToken) {
        this.initialize();
        if (!this.initialized) {
            console.log(`[MOCK] Verification email would be sent to ${to}`);
            console.log(`[MOCK] Verification link: ${process.env.FRONTEND_URL}/verify-email/${verificationToken}`);
            return;
        }
        const verificationUrl = `${process.env.FRONTEND_URL}/verify-email/${verificationToken}`;
        const from = process.env.EMAIL_FROM || 'noreply@proliumai.com';
        const msg = {
            to,
            from,
            subject: 'Verify Your Email - ProliumAI',
            text: `Hi ${name || 'there'},\n\nPlease verify your email by clicking this link:\n\n${verificationUrl}\n\nThis link expires in 24 hours.\n\nIf you didn't create an account, please ignore this email.`,
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #6366f1;">Verify Your Email</h2>
          <p>Hi ${name || 'there'},</p>
          <p>Thanks for signing up for ProliumAI! Please verify your email address by clicking the button below:</p>
          <a href="${verificationUrl}" style="display: inline-block; padding: 12px 24px; background-color: #6366f1; color: white; text-decoration: none; border-radius: 8px; margin: 20px 0;">
            Verify Email Address
          </a>
          <p style="color: #666; font-size: 14px;">This link expires in 24 hours.</p>
          <p style="color: #666; font-size: 14px;">If you didn't create an account, please ignore this email.</p>
        </div>
      `,
        };
        try {
            await mail_1.default.send(msg);
            console.log(`✓ Verification email sent to ${to}`);
        }
        catch (error) {
            console.error('Failed to send verification email:', error);
            throw new Error('Failed to send verification email');
        }
    }
    /**
     * Send password reset link
     */
    static async sendPasswordResetEmail(to, name, resetToken) {
        this.initialize();
        if (!this.initialized) {
            console.log(`[MOCK] Password reset email would be sent to ${to}`);
            console.log(`[MOCK] Reset link: ${process.env.FRONTEND_URL}/reset-password/${resetToken}`);
            return;
        }
        const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
        const from = process.env.EMAIL_FROM || 'noreply@proliumai.com';
        const msg = {
            to,
            from,
            subject: 'Reset Your Password - ProliumAI',
            text: `Hi ${name || 'there'},\n\nYou requested to reset your password. Click this link to reset it:\n\n${resetUrl}\n\nThis link expires in 1 hour.\n\nIf you didn't request this, please ignore this email.`,
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #6366f1;">Reset Your Password</h2>
          <p>Hi ${name || 'there'},</p>
          <p>You requested to reset your password. Click the button below to reset it:</p>
          <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background-color: #6366f1; color: white; text-decoration: none; border-radius: 8px; margin: 20px 0;">
            Reset Password
          </a>
          <p style="color: #666; font-size: 14px;">This link expires in 1 hour.</p>
          <p style="color: #666; font-size: 14px;">If you didn't request this, please ignore this email and your password will remain unchanged.</p>
        </div>
      `,
        };
        try {
            await mail_1.default.send(msg);
            console.log(`✓ Password reset email sent to ${to}`);
        }
        catch (error) {
            console.error('Failed to send password reset email:', error);
            throw new Error('Failed to send password reset email');
        }
    }
    /**
     * Send welcome email after successful verification
     */
    static async sendWelcomeEmail(to, name) {
        this.initialize();
        if (!this.initialized) {
            console.log(`[MOCK] Welcome email would be sent to ${to}`);
            return;
        }
        const from = process.env.EMAIL_FROM || 'noreply@proliumai.com';
        const msg = {
            to,
            from,
            subject: 'Welcome to ProliumAI!',
            text: `Hi ${name || 'there'},\n\nWelcome to ProliumAI! Your account is now verified and ready to use.\n\nYou can now connect your social media platforms and start analyzing your content.\n\nGet started: ${process.env.FRONTEND_URL}/dashboard`,
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #6366f1;">Welcome to ProliumAI!</h2>
          <p>Hi ${name || 'there'},</p>
          <p>Your account is now verified and ready to use. 🎉</p>
          <p>You can now connect your social media platforms (YouTube, TikTok, Instagram) and start analyzing your content with AI-powered insights.</p>
          <a href="${process.env.FRONTEND_URL}/dashboard" style="display: inline-block; padding: 12px 24px; background-color: #6366f1; color: white; text-decoration: none; border-radius: 8px; margin: 20px 0;">
            Go to Dashboard
          </a>
          <p style="color: #666; font-size: 14px;">If you have any questions, feel free to reach out to our support team.</p>
        </div>
      `,
        };
        try {
            await mail_1.default.send(msg);
            console.log(`✓ Welcome email sent to ${to}`);
        }
        catch (error) {
            console.error('Failed to send welcome email:', error);
            // Don't throw error for welcome email failure
        }
    }
}
exports.EmailService = EmailService;
EmailService.initialized = false;
//# sourceMappingURL=email.service.js.map