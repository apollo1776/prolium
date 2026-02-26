/**
 * Authentication Controller
 * Handles HTTP requests for authentication endpoints
 */
import { Request, Response } from 'express';
export declare class AuthController {
    /**
     * POST /api/auth/register
     * Register a new user
     */
    static register(req: Request, res: Response): Promise<void>;
    /**
     * POST /api/auth/login
     * Login user
     */
    static login(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * POST /api/auth/logout
     * Logout user
     */
    static logout(req: Request, res: Response): Promise<void>;
    /**
     * POST /api/auth/refresh-token
     * Refresh access token
     */
    static refreshToken(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * POST /api/auth/forgot-password
     * Request password reset
     */
    static forgotPassword(req: Request, res: Response): Promise<void>;
    /**
     * POST /api/auth/reset-password
     * Reset password with token
     */
    static resetPassword(req: Request, res: Response): Promise<void>;
    /**
     * GET /api/auth/verify-email/:token
     * Verify email address
     */
    static verifyEmail(req: Request, res: Response): Promise<void>;
    /**
     * GET /api/auth/me
     * Get current user
     */
    static getCurrentUser(req: Request, res: Response): Promise<void>;
}
//# sourceMappingURL=auth.controller.d.ts.map