"use strict";
/**
 * Token Service
 * Handles JWT token generation, validation, and refresh
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TokenService = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const uuid_1 = require("uuid");
const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';
class TokenService {
    /**
     * Initialize token secrets from environment
     */
    static initialize() {
        this.accessSecret = process.env.JWT_ACCESS_SECRET;
        this.refreshSecret = process.env.JWT_REFRESH_SECRET;
        if (!this.accessSecret || !this.refreshSecret) {
            throw new Error('JWT secrets not configured');
        }
    }
    /**
     * Generate access token (short-lived, 15 minutes)
     */
    static generateAccessToken(userId, email) {
        if (!this.accessSecret) {
            this.initialize();
        }
        const payload = {
            userId,
            email,
            type: 'access',
        };
        return jsonwebtoken_1.default.sign(payload, this.accessSecret, {
            expiresIn: ACCESS_TOKEN_EXPIRY,
            issuer: 'proliumai',
            audience: 'proliumai-client',
        });
    }
    /**
     * Generate refresh token (long-lived, 7 days or 1 day based on rememberMe)
     */
    static generateRefreshToken(userId, rememberMe = false) {
        if (!this.refreshSecret) {
            this.initialize();
        }
        const jti = (0, uuid_1.v4)(); // Unique identifier for token rotation
        const expiresIn = rememberMe ? '7d' : '1d';
        const payload = {
            userId,
            type: 'refresh',
            jti,
            rememberMe,
        };
        const token = jsonwebtoken_1.default.sign(payload, this.refreshSecret, {
            expiresIn,
            issuer: 'proliumai',
            audience: 'proliumai-client',
        });
        return { token, jti };
    }
    /**
     * Verify and decode access token
     */
    static verifyAccessToken(token) {
        if (!this.accessSecret) {
            this.initialize();
        }
        try {
            const payload = jsonwebtoken_1.default.verify(token, this.accessSecret, {
                issuer: 'proliumai',
                audience: 'proliumai-client',
            });
            if (payload.type !== 'access') {
                throw new Error('Invalid token type');
            }
            return payload;
        }
        catch (error) {
            if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
                throw new Error('Token expired');
            }
            else if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
                throw new Error('Invalid token');
            }
            throw error;
        }
    }
    /**
     * Verify and decode refresh token
     */
    static verifyRefreshToken(token) {
        if (!this.refreshSecret) {
            this.initialize();
        }
        try {
            const payload = jsonwebtoken_1.default.verify(token, this.refreshSecret, {
                issuer: 'proliumai',
                audience: 'proliumai-client',
            });
            if (payload.type !== 'refresh') {
                throw new Error('Invalid token type');
            }
            return payload;
        }
        catch (error) {
            if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
                throw new Error('Refresh token expired');
            }
            else if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
                throw new Error('Invalid refresh token');
            }
            throw error;
        }
    }
    /**
     * Get token expiration date
     */
    static getTokenExpiration(days) {
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + days);
        return expiryDate;
    }
    /**
     * Calculate expiration timestamp for access token (15 minutes)
     */
    static getAccessTokenExpiry() {
        return 15 * 60 * 1000; // 15 minutes in milliseconds
    }
    /**
     * Calculate expiration timestamp for refresh token (7 days)
     */
    static getRefreshTokenExpiry() {
        return 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
    }
}
exports.TokenService = TokenService;
//# sourceMappingURL=token.service.js.map