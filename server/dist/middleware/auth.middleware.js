"use strict";
/**
 * Authentication Middleware
 * Validates JWT tokens and protects routes
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.optionalAuthMiddleware = exports.authMiddleware = void 0;
const token_service_1 = require("../services/token.service");
const authMiddleware = async (req, res, next) => {
    try {
        // Get token from Authorization header or cookies
        let token = req.headers.authorization?.replace('Bearer ', '');
        if (!token) {
            token = req.cookies.accessToken;
        }
        if (!token) {
            return res.status(401).json({
                error: 'Unauthorized',
                message: 'No authentication token provided',
            });
        }
        // Verify token
        const payload = token_service_1.TokenService.verifyAccessToken(token);
        // Attach user to request
        req.user = {
            userId: payload.userId,
            email: payload.email,
        };
        next();
    }
    catch (error) {
        if (error.message === 'Token expired') {
            return res.status(401).json({
                error: 'TokenExpired',
                message: 'Authentication token expired',
            });
        }
        return res.status(401).json({
            error: 'Unauthorized',
            message: 'Invalid authentication token',
        });
    }
};
exports.authMiddleware = authMiddleware;
/**
 * Optional auth middleware - doesn't fail if no token
 */
const optionalAuthMiddleware = async (req, res, next) => {
    try {
        let token = req.headers.authorization?.replace('Bearer ', '');
        if (!token) {
            token = req.cookies.accessToken;
        }
        if (token) {
            const payload = token_service_1.TokenService.verifyAccessToken(token);
            req.user = {
                userId: payload.userId,
                email: payload.email,
            };
        }
        next();
    }
    catch (error) {
        // Continue without auth
        next();
    }
};
exports.optionalAuthMiddleware = optionalAuthMiddleware;
//# sourceMappingURL=auth.middleware.js.map