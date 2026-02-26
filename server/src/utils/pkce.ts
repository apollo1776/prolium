/**
 * PKCE (Proof Key for Code Exchange) Utilities
 * Implements RFC 7636 for secure OAuth2 flows
 */

import crypto from 'crypto';

/**
 * Generate a cryptographically random code verifier
 * Returns a base64url-encoded string (43-128 characters)
 */
export function generateCodeVerifier(): string {
  // Generate 32 random bytes (256 bits)
  return crypto.randomBytes(32).toString('base64url');
}

/**
 * Generate code challenge from verifier using S256 method
 * Returns SHA-256 hash of verifier, base64url-encoded
 */
export function generateCodeChallenge(verifier: string): string {
  return crypto
    .createHash('sha256')
    .update(verifier)
    .digest('base64url');
}

/**
 * Verify that a code verifier matches a code challenge
 */
export function verifyCodeChallenge(
  verifier: string,
  challenge: string
): boolean {
  const computedChallenge = generateCodeChallenge(verifier);
  return computedChallenge === challenge;
}

/**
 * Generate state parameter for OAuth flow
 * Used to prevent CSRF attacks
 */
export function generateState(): string {
  return crypto.randomBytes(32).toString('base64url');
}

/**
 * Create PKCE pair (verifier + challenge)
 */
export function createPKCEPair(): {
  codeVerifier: string;
  codeChallenge: string;
} {
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = generateCodeChallenge(codeVerifier);

  return {
    codeVerifier,
    codeChallenge,
  };
}
