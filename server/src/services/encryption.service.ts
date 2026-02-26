/**
 * Encryption Service
 * Provides AES-256-GCM encryption for sensitive data like OAuth tokens
 */

import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
const KEY_LENGTH = 32;

export class EncryptionService {
  private static key: Buffer;

  /**
   * Initialize encryption key from environment variable
   */
  static initialize(): void {
    const keyHex = process.env.ENCRYPTION_KEY;
    if (!keyHex || keyHex.length !== 64) {
      throw new Error('ENCRYPTION_KEY must be a 64-character hex string (32 bytes)');
    }
    this.key = Buffer.from(keyHex, 'hex');
    if (this.key.length !== KEY_LENGTH) {
      throw new Error('Invalid ENCRYPTION_KEY length');
    }
  }

  /**
   * Encrypt a string using AES-256-GCM
   * Returns format: iv:authTag:encrypted
   */
  static encrypt(plaintext: string): string {
    if (!this.key) {
      this.initialize();
    }

    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, this.key, iv);

    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    // Format: iv:authTag:encrypted
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  }

  /**
   * Decrypt a string encrypted with AES-256-GCM
   */
  static decrypt(encryptedData: string): string {
    if (!this.key) {
      this.initialize();
    }

    const parts = encryptedData.split(':');
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted data format');
    }

    const [ivHex, authTagHex, encrypted] = parts;

    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, this.key, iv);

    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  /**
   * Hash a password using SHA-256 (for non-user passwords like API keys)
   * Note: Use bcrypt for user passwords
   */
  static hash(data: string): string {
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Generate a secure random token
   */
  static generateToken(bytes: number = 32): string {
    return crypto.randomBytes(bytes).toString('hex');
  }
}
