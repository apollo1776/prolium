/**
 * Encryption Service
 * Provides AES-256-GCM encryption for sensitive data like OAuth tokens
 */
export declare class EncryptionService {
    private static key;
    /**
     * Initialize encryption key from environment variable
     */
    static initialize(): void;
    /**
     * Encrypt a string using AES-256-GCM
     * Returns format: iv:authTag:encrypted
     */
    static encrypt(plaintext: string): string;
    /**
     * Decrypt a string encrypted with AES-256-GCM
     */
    static decrypt(encryptedData: string): string;
    /**
     * Hash a password using SHA-256 (for non-user passwords like API keys)
     * Note: Use bcrypt for user passwords
     */
    static hash(data: string): string;
    /**
     * Generate a secure random token
     */
    static generateToken(bytes?: number): string;
}
//# sourceMappingURL=encryption.service.d.ts.map