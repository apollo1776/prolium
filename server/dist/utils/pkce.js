"use strict";
/**
 * PKCE (Proof Key for Code Exchange) Utilities
 * Implements RFC 7636 for secure OAuth2 flows
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateCodeVerifier = generateCodeVerifier;
exports.generateCodeChallenge = generateCodeChallenge;
exports.verifyCodeChallenge = verifyCodeChallenge;
exports.generateState = generateState;
exports.createPKCEPair = createPKCEPair;
const crypto_1 = __importDefault(require("crypto"));
/**
 * Generate a cryptographically random code verifier
 * Returns a base64url-encoded string (43-128 characters)
 */
function generateCodeVerifier() {
    // Generate 32 random bytes (256 bits)
    return crypto_1.default.randomBytes(32).toString('base64url');
}
/**
 * Generate code challenge from verifier using S256 method
 * Returns SHA-256 hash of verifier, base64url-encoded
 */
function generateCodeChallenge(verifier) {
    return crypto_1.default
        .createHash('sha256')
        .update(verifier)
        .digest('base64url');
}
/**
 * Verify that a code verifier matches a code challenge
 */
function verifyCodeChallenge(verifier, challenge) {
    const computedChallenge = generateCodeChallenge(verifier);
    return computedChallenge === challenge;
}
/**
 * Generate state parameter for OAuth flow
 * Used to prevent CSRF attacks
 */
function generateState() {
    return crypto_1.default.randomBytes(32).toString('base64url');
}
/**
 * Create PKCE pair (verifier + challenge)
 */
function createPKCEPair() {
    const codeVerifier = generateCodeVerifier();
    const codeChallenge = generateCodeChallenge(codeVerifier);
    return {
        codeVerifier,
        codeChallenge,
    };
}
//# sourceMappingURL=pkce.js.map