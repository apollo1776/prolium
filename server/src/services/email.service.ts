/**
 * Email Service
 * Handles email sending via Resend
 */
import https from 'https';

export class EmailService {
    private static apiKey: string | null = null;

  /**
     * Initialize Resend with API key
     */
  static initialize(): void {
        const apiKey = process.env.RESEND_API_KEY;
        if (!apiKey || apiKey === 're_your_resend_api_key_here') {
                console.warn('⚠️ Resend not configured. Email functionality will be disabled.');
                return;
        }
        this.apiKey = apiKey;
        console.log('✓ Resend initialized');
  }

  /**
     * Send email via Resend API
     */
  private static async sendEmail(payload: {
        from: string;
        to: string;
        subject: string;
        html: string;
        text: string;
  }): Promise<void> {
        if (!this.apiKey) {
                const from = process.env.EMAIL_FROM || 'noreply@proliumai.com';
                console.log(`[MOCK] Email would be sent from ${from} to ${payload.to}: ${payload.subject}`);
                return;
        }

      const body = JSON.stringify(payload);

      return new Promise((resolve, reject) => {
              const options = {
                        hostname: 'api.resend.com',
                        path: '/emails',
                        method: 'POST',
                        headers: {
                                    'Authorization': `Bearer ${this.apiKey}`,
                                    'Content-Type': 'application/json',
                                    'Content-Length': Buffer.byteLength(body),
                        },
              };

                               const req = https.request(options, (res) => {
                                         let data = '';
                                         res.on('data', (chunk) => { data += chunk; });
                                         res.on('end', () => {
                                                     if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
                                                                   resolve();
                                                     } else {
                                                                   reject(new Error(`Resend API error: ${res.statusCode} - ${data}`));
                                                     }
                                         });
                               });

                               req.on('error', reject);
              req.write(body);
              req.end();
      });
  }

  /**
     * Send email verification link
     */
  static async sendVerificationEmail(
        to: string,
        name: string,
        verificationToken: string
      ): Promise<void> {
        const verificationUrl = `${process.env.FRONTEND_URL}/verify-email/${verificationToken}`;
        const from = process.env.EMAIL_FROM || 'noreply@proliumai.com';

      try {
              await this.sendEmail({
                        from,
                        to,
                        subject: 'Verify Your Email - Prolium',
                        text: `Hi ${name || 'there'},\n\nPlease verify your email by clicking this link:\n\n${verificationUrl}\n\nThis link expires in 24 hours.\n\nIf you didn't create an account, please ignore this email.`,
                        html: `
                                  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                                              <h2 style="color: #6366f1;">Verify Your Email</h2>
                                                          <p>Hi ${name || 'there'},</p>
                                                                      <p>Thanks for signing up for Prolium! Please verify your email address by clicking the button below:</p>
                                                                                  <a href="${verificationUrl}" style="display: inline-block; padding: 12px 24px; background-color: #6366f1; color: white; text-decoration: none; border-radius: 8px; margin: 20px 0;">
                                                                                                Verify Email Address
                                                                                                            </a>
                                                                                                                        <p style="color: #666; font-size: 14px;">Or copy this link: ${verificationUrl}</p>
                                                                                                                                    <p style="color: #666; font-size: 14px;">This link expires in 24 hours.</p>
                                                                                                                                                <p style="color: #666; font-size: 14px;">If you didn't create an account, please ignore this email.</p>
                                                                                                                                                          </div>
                                                                                                                                                                  `,
              });
              console.log(`✓ Verification email sent to ${to}`);
      } catch (error) {
              console.error('Failed to send verification email:', error);
              throw new Error('Failed to send verification email');
      }
  }

  /**
     * Send password reset link
     */
  static async sendPasswordResetEmail(
        to: string,
        name: string,
        resetToken: string
      ): Promise<void> {
        const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
        const from = process.env.EMAIL_FROM || 'noreply@proliumai.com';

      try {
              await this.sendEmail({
                        from,
                        to,
                        subject: 'Reset Your Password - Prolium',
                        text: `Hi ${name || 'there'},\n\nYou requested to reset your password. Click this link to reset it:\n\n${resetUrl}\n\nThis link expires in 1 hour.\n\nIf you didn't request this, please ignore this email.`,
                        html: `
                                  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                                              <h2 style="color: #6366f1;">Reset Your Password</h2>
                                                          <p>Hi ${name || 'there'},</p>
                                                                      <p>You requested to reset your password. Click the button below to reset it:</p>
                                                                                  <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background-color: #6366f1; color: white; text-decoration: none; border-radius: 8px; margin: 20px 0;">
                                                                                                Reset Password
                                                                                                            </a>
                                                                                                                        <p style="color: #666; font-size: 14px;">Or copy this link: ${resetUrl}</p>
                                                                                                                                    <p style="color: #666; font-size: 14px;">This link expires in 1 hour.</p>
                                                                                                                                                <p style="color: #666; font-size: 14px;">If you didn't request this, please ignore this email and your password will remain unchanged.</p>
                                                                                                                                                          </div>
                                                                                                                                                                  `,
              });
              console.log(`✓ Password reset email sent to ${to}`);
      } catch (error) {
              console.error('Failed to send password reset email:', error);
              throw new Error('Failed to send password reset email');
      }
  }

  /**
     * Send welcome email after successful verification
     */
  static async sendWelcomeEmail(to: string, name: string): Promise<void> {
        const from = process.env.EMAIL_FROM || 'noreply@proliumai.com';

      try {
              await this.sendEmail({
                        from,
                        to,
                        subject: 'Welcome to Prolium!',
                        text: `Hi ${name || 'there'},\n\nWelcome to Prolium! Your account is now verified and ready to use.\n\nYou can now connect your social media platforms and start analyzing your content.\n\nGet started: ${process.env.FRONTEND_URL}/dashboard`,
                        html: `
                                  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                                              <h2 style="color: #6366f1;">Welcome to Prolium!</h2>
                                                          <p>Hi ${name || 'there'},</p>
                                                                      <p>Your account is now verified and ready to use. 🎉</p>
                                                                                  <p>You can now connect your social media platforms (YouTube, TikTok, Instagram) and start analyzing your content with AI-powered insights.</p>
                                                                                              <a href="${process.env.FRONTEND_URL}/dashboard" style="display: inline-block; padding: 12px 24px; background-color: #6366f1; color: white; text-decoration: none; border-radius: 8px; margin: 20px 0;">
                                                                                                            Go to Dashboard
                                                                                                                        </a>
                                                                                                                                    <p style="color: #666; font-size: 14px;">If you have any questions, feel free to reach out to our support team.</p>
                                                                                                                                              </div>
                                                                                                                                                      `,
              });
              console.log(`✓ Welcome email sent to ${to}`);
      } catch (error) {
              console.error('Failed to send welcome email:', error);
              // Don't throw error for welcome email failure
      }
  }
}
