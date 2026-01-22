/**
 * Encryption utilities for storing sensitive credentials
 * Uses AES-256-GCM for encryption
 */

import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
const SALT_LENGTH = 32;

// Get encryption key from environment or generate a default for development
function getEncryptionKey(): Buffer {
  const envKey = process.env.IBIRD_ENCRYPTION_KEY;
  if (envKey) {
    // If provided as hex string
    if (envKey.length === 64) {
      return Buffer.from(envKey, 'hex');
    }
    // If provided as base64
    if (envKey.length === 44) {
      return Buffer.from(envKey, 'base64');
    }
    // Otherwise derive from string
    return crypto.scryptSync(envKey, 'ibird-salt', 32);
  }

  // For development only - generate a deterministic key
  console.warn('IBIRD_ENCRYPTION_KEY not set - using development key');
  return crypto.scryptSync('dev-key-do-not-use-in-production', 'ibird-salt', 32);
}

const KEY = getEncryptionKey();

/**
 * Encrypt a string or object
 * Returns base64-encoded encrypted data
 */
export function encrypt(data: string | object): Buffer {
  const plaintext = typeof data === 'string' ? data : JSON.stringify(data);

  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);

  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ]);

  const authTag = cipher.getAuthTag();

  // Combine: IV + authTag + encrypted
  return Buffer.concat([iv, authTag, encrypted]);
}

/**
 * Decrypt buffer back to string
 */
export function decrypt(encryptedBuffer: Buffer): string {
  const iv = encryptedBuffer.subarray(0, IV_LENGTH);
  const authTag = encryptedBuffer.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
  const encrypted = encryptedBuffer.subarray(IV_LENGTH + AUTH_TAG_LENGTH);

  const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ]);

  return decrypted.toString('utf8');
}

/**
 * Decrypt buffer and parse as JSON
 */
export function decryptJSON<T>(encryptedBuffer: Buffer): T {
  const decrypted = decrypt(encryptedBuffer);
  return JSON.parse(decrypted) as T;
}

/**
 * Encrypt credentials for storage
 */
export interface EncryptedCredentials {
  type: 'password' | 'oauth2';
  password?: string;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: string;
}

export function encryptCredentials(credentials: EncryptedCredentials): Buffer {
  return encrypt(credentials);
}

export function decryptCredentials(encrypted: Buffer): EncryptedCredentials {
  return decryptJSON<EncryptedCredentials>(encrypted);
}
