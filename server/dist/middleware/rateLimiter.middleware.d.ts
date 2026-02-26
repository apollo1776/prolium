/**
 * Rate Limiting Middleware
 * Prevents brute force attacks and API abuse
 */
/**
 * Rate limiter for authentication endpoints
 * 5 requests per 15 minutes per IP
 */
export declare const authRateLimiter: import("express-rate-limit").RateLimitRequestHandler;
/**
 * Rate limiter for OAuth callback endpoints
 * 10 requests per minute per IP
 */
export declare const oauthCallbackRateLimiter: import("express-rate-limit").RateLimitRequestHandler;
/**
 * General API rate limiter
 * 100 requests per minute per IP
 */
export declare const apiRateLimiter: import("express-rate-limit").RateLimitRequestHandler;
/**
 * Strict rate limiter for sensitive operations
 * 3 requests per hour per IP
 */
export declare const strictRateLimiter: import("express-rate-limit").RateLimitRequestHandler;
//# sourceMappingURL=rateLimiter.middleware.d.ts.map