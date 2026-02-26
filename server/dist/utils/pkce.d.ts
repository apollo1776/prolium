/**
 * PKCE (Proof Key for Code Exchange) Utilities
 * Implements RFC 7636 for secure OAuth2 flows
 */
/**
 * Generate a cryptographically random code verifier
 * Returns a base64url-encoded string (43-128 characters)
 */
export declare function generateCodeVerifier(): string;
/**
 * Generate code challenge from verifier using S256 method
 * Returns SHA-256 hash of verifier, base64url-encoded
 */
export declare function generateCodeChallenge(verifier: string): string;
/**
 * Verify that a code verifier matches a code challenge
 */
export declare function verifyCodeChallenge(verifier: string, challenge: string): boolean;
/**
 * Generate state parameter for OAuth flow
 * Used to prevent CSRF attacks
 */
export declare function generateState(): string;
/**
 * Create PKCE pair (verifier + challenge)
 */
export declare function createPKCEPair(): {
    codeVerifier: string;
    codeChallenge: string;
};
//# sourceMappingURL=pkce.d.ts.map