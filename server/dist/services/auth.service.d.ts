/**
 * Authentication Service
 * Handles user registration, login, password management
 */
export declare class AuthService {
    /**
     * Register a new user
     */
    static register(email: string, password: string, name?: string): Promise<{
        id: string;
        email: string;
        name: string | null;
        emailVerified: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>;
    /**
     * Login user
     */
    static login(email: string, password: string, rememberMe?: boolean): Promise<{
        user: {
            id: string;
            email: string;
            name: string | null;
            emailVerified: true;
            createdAt: Date;
            updatedAt: Date;
            lastLogin: Date;
        };
        accessToken: string;
        refreshToken: string;
        expiresIn: number;
    }>;
    /**
     * Verify email
     */
    static verifyEmail(token: string): Promise<{
        id: string;
        email: string;
        passwordHash: string | null;
        name: string | null;
        emailVerified: boolean;
        createdAt: Date;
        updatedAt: Date;
        lastLogin: Date | null;
    }>;
    /**
     * Request password reset
     */
    static forgotPassword(email: string): Promise<{
        success: boolean;
    }>;
    /**
     * Reset password with token
     */
    static resetPassword(token: string, newPassword: string): Promise<{
        success: boolean;
    }>;
    /**
     * Refresh access token
     */
    static refreshToken(refreshToken: string): Promise<{
        accessToken: string;
        refreshToken: string;
        expiresIn: number;
        rememberMe: boolean;
    }>;
    /**
     * Logout user
     */
    static logout(userId: string, refreshToken?: string): Promise<{
        success: boolean;
    }>;
    /**
     * Get user by ID
     */
    static getUserById(userId: string): Promise<{
        id: string;
        email: string;
        name: string | null;
        emailVerified: boolean;
        createdAt: Date;
        updatedAt: Date;
        lastLogin: Date | null;
    }>;
    /**
     * Log authentication attempt
     */
    static logAuthAttempt(email: string, success: boolean, ipAddress: string, userAgent?: string): Promise<void>;
    /**
     * Check if user has too many failed login attempts
     */
    static checkRateLimit(email: string, ipAddress: string): Promise<boolean>;
}
//# sourceMappingURL=auth.service.d.ts.map