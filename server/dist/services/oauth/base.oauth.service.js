"use strict";
/**
 * Base OAuth Service
 * Provides common OAuth functionality for all platforms
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseOAuthService = void 0;
const client_1 = require("@prisma/client");
const encryption_service_1 = require("../encryption.service");
const pkce_1 = require("../../utils/pkce");
const prisma = new client_1.PrismaClient();
class BaseOAuthService {
    /**
     * Generate authorization URL with PKCE
     */
    async generateAuthorizationUrl(userId) {
        const state = (0, pkce_1.generateState)();
        const { codeVerifier, codeChallenge } = (0, pkce_1.createPKCEPair)();
        // Store PKCE verifier and state in session (temporary storage)
        await this.storeOAuthState(userId, state, codeVerifier);
        const authUrl = this.buildAuthorizationUrl(state, codeChallenge);
        return { authUrl, state };
    }
    /**
     * Store OAuth connection in database
     */
    async savePlatformConnection(userId, tokens, userInfo, scopesGranted) {
        // Encrypt tokens before storing
        const encryptedAccessToken = encryption_service_1.EncryptionService.encrypt(tokens.accessToken);
        const encryptedRefreshToken = tokens.refreshToken
            ? encryption_service_1.EncryptionService.encrypt(tokens.refreshToken)
            : null;
        // Calculate token expiry
        const tokenExpiresAt = tokens.expiresIn
            ? new Date(Date.now() + tokens.expiresIn * 1000)
            : null;
        // Upsert connection (update if exists, create if not)
        const connection = await prisma.platformConnection.upsert({
            where: {
                userId_platform: {
                    userId,
                    platform: this.platform,
                },
            },
            update: {
                accessToken: encryptedAccessToken,
                refreshToken: encryptedRefreshToken,
                tokenExpiresAt,
                platformUserId: userInfo.platformUserId,
                platformUsername: userInfo.platformUsername,
                scopesGranted,
                isActive: true,
                lastSynced: new Date(),
            },
            create: {
                userId,
                platform: this.platform,
                accessToken: encryptedAccessToken,
                refreshToken: encryptedRefreshToken,
                tokenExpiresAt,
                platformUserId: userInfo.platformUserId,
                platformUsername: userInfo.platformUsername,
                scopesGranted,
                isActive: true,
            },
        });
        return connection;
    }
    /**
     * Get platform connection for user
     */
    async getConnection(userId) {
        const connection = await prisma.platformConnection.findUnique({
            where: {
                userId_platform: {
                    userId,
                    platform: this.platform,
                },
            },
        });
        if (!connection) {
            return null;
        }
        // Decrypt tokens
        return {
            ...connection,
            accessToken: encryption_service_1.EncryptionService.decrypt(connection.accessToken),
            refreshToken: connection.refreshToken
                ? encryption_service_1.EncryptionService.decrypt(connection.refreshToken)
                : null,
        };
    }
    /**
     * Disconnect platform
     */
    async disconnect(userId) {
        await prisma.platformConnection.deleteMany({
            where: {
                userId,
                platform: this.platform,
            },
        });
        return { success: true };
    }
    /**
     * Check if token is expired
     */
    isTokenExpired(expiresAt) {
        if (!expiresAt)
            return false;
        return expiresAt < new Date();
    }
    /**
     * Auto-refresh token if expired
     */
    async getValidAccessToken(userId) {
        const connection = await this.getConnection(userId);
        if (!connection || !connection.isActive) {
            return null;
        }
        // Check if token is expired
        if (this.isTokenExpired(connection.tokenExpiresAt)) {
            if (!connection.refreshToken) {
                // Mark connection as inactive
                await prisma.platformConnection.update({
                    where: { id: connection.id },
                    data: { isActive: false },
                });
                return null;
            }
            // Refresh token
            try {
                const newTokens = await this.refreshAccessToken(connection.refreshToken);
                // Update connection with new tokens
                const encryptedAccessToken = encryption_service_1.EncryptionService.encrypt(newTokens.accessToken);
                const encryptedRefreshToken = newTokens.refreshToken
                    ? encryption_service_1.EncryptionService.encrypt(newTokens.refreshToken)
                    : connection.refreshToken;
                const tokenExpiresAt = newTokens.expiresIn
                    ? new Date(Date.now() + newTokens.expiresIn * 1000)
                    : null;
                await prisma.platformConnection.update({
                    where: { id: connection.id },
                    data: {
                        accessToken: encryptedAccessToken,
                        refreshToken: encryptedRefreshToken,
                        tokenExpiresAt,
                    },
                });
                return newTokens.accessToken;
            }
            catch (error) {
                console.error(`Failed to refresh ${this.platform} token:`, error);
                // Mark connection as inactive
                await prisma.platformConnection.update({
                    where: { id: connection.id },
                    data: { isActive: false },
                });
                return null;
            }
        }
        return connection.accessToken;
    }
    async storeOAuthState(userId, state, codeVerifier) {
        BaseOAuthService.oauthStates.set(state, {
            userId,
            codeVerifier,
            timestamp: Date.now(),
        });
        // Clean up old states (> 10 minutes)
        this.cleanupOldStates();
    }
    async getOAuthState(state) {
        const stored = BaseOAuthService.oauthStates.get(state);
        if (!stored) {
            return null;
        }
        // Check if state is expired (10 minutes)
        if (Date.now() - stored.timestamp > 10 * 60 * 1000) {
            BaseOAuthService.oauthStates.delete(state);
            return null;
        }
        // Delete state after use (one-time use)
        BaseOAuthService.oauthStates.delete(state);
        return {
            userId: stored.userId,
            codeVerifier: stored.codeVerifier,
        };
    }
    cleanupOldStates() {
        const tenMinutesAgo = Date.now() - 10 * 60 * 1000;
        for (const [state, data] of BaseOAuthService.oauthStates.entries()) {
            if (data.timestamp < tenMinutesAgo) {
                BaseOAuthService.oauthStates.delete(state);
            }
        }
    }
    /**
     * Log OAuth attempt
     */
    async logOAuthAttempt(userId, success, error, ipAddress) {
        await prisma.oAuthAttempt.create({
            data: {
                userId,
                platform: this.platform,
                success,
                error,
                ipAddress,
            },
        });
    }
}
exports.BaseOAuthService = BaseOAuthService;
/**
 * Store OAuth state temporarily (in-memory for simplicity)
 * In production, use Redis or database
 */
BaseOAuthService.oauthStates = new Map();
//# sourceMappingURL=base.oauth.service.js.map