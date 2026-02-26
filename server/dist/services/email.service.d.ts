/**
 * Email Service
 * Handles email sending via SendGrid
 */
export declare class EmailService {
    private static initialized;
    /**
     * Initialize SendGrid with API key
     */
    static initialize(): void;
    /**
     * Send email verification link
     */
    static sendVerificationEmail(to: string, name: string, verificationToken: string): Promise<void>;
    /**
     * Send password reset link
     */
    static sendPasswordResetEmail(to: string, name: string, resetToken: string): Promise<void>;
    /**
     * Send welcome email after successful verification
     */
    static sendWelcomeEmail(to: string, name: string): Promise<void>;
}
//# sourceMappingURL=email.service.d.ts.map