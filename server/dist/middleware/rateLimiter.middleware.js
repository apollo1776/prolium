"use strict";
/**
 * Rate Limiting Middleware
 * Prevents brute force attacks and API abuse
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.strictRateLimiter = exports.apiRateLimiter = exports.oauthCallbackRateLimiter = exports.authRateLimiter = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
/**
 * Rate limiter for authentication endpoints
 * 5 requests per 15 minutes per IP
 */
exports.authRateLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 requests per window
    message: {
        error: 'TooManyRequests',
        message: 'Too many authentication attempts. Please try again in 15 minutes.',
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
        // Use IP address as key
        return req.ip || req.socket.remoteAddress || 'unknown';
    },
    handler: (req, res) => {
        res.status(429).json({
            error: 'TooManyRequests',
            message: 'Too many attempts. Please try again later.',
            retryAfter: Math.ceil(15 * 60), // seconds
        });
    },
});
/**
 * Rate limiter for OAuth callback endpoints
 * 10 requests per minute per IP
 */
exports.oauthCallbackRateLimiter = (0, express_rate_limit_1.default)({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 10,
    message: {
        error: 'TooManyRequests',
        message: 'Too many OAuth attempts. Please slow down.',
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => req.ip || 'unknown',
});
/**
 * General API rate limiter
 * 100 requests per minute per IP
 */
exports.apiRateLimiter = (0, express_rate_limit_1.default)({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 100,
    message: {
        error: 'TooManyRequests',
        message: 'Too many requests. Please try again later.',
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => req.ip || 'unknown',
});
/**
 * Strict rate limiter for sensitive operations
 * 3 requests per hour per IP
 */
exports.strictRateLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3,
    message: {
        error: 'TooManyRequests',
        message: 'Too many attempts. Please try again in an hour.',
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => req.ip || 'unknown',
});
//# sourceMappingURL=rateLimiter.middleware.js.map