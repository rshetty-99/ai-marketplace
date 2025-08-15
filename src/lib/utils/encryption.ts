/**
 * Encryption utilities for sensitive data
 * Provides AES-256 encryption, hashing, and key derivation functions
 */

import crypto from 'crypto';

/**
 * Encryption configuration
 */
const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32; // 256 bits
const IV_LENGTH = 16; // 128 bits
const TAG_LENGTH = 16; // 128 bits
const SALT_LENGTH = 32; // 256 bits

/**
 * Get encryption key from environment or generate one
 */
function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY;
  
  if (!key) {
    throw new Error('ENCRYPTION_KEY environment variable is required');
  }
  
  if (key.length !== 64) { // 32 bytes = 64 hex characters
    throw new Error('ENCRYPTION_KEY must be 64 hex characters (32 bytes)');
  }
  
  return Buffer.from(key, 'hex');
}

/**
 * Generate a random encryption key
 */
export function generateEncryptionKey(): string {
  return crypto.randomBytes(KEY_LENGTH).toString('hex');
}

/**
 * Encrypt data with AES-256-GCM
 */
export function encrypt(plaintext: string, additionalData?: string): string {
  try {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    
    const cipher = crypto.createCipher(ALGORITHM, key);
    cipher.setAAD(Buffer.from(additionalData || '', 'utf8'));
    
    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const tag = cipher.getAuthTag();
    
    // Combine IV + tag + encrypted data
    const result = iv.toString('hex') + tag.toString('hex') + encrypted;
    
    return result;
  } catch (error) {
    throw new Error(`Encryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Decrypt data encrypted with AES-256-GCM
 */
export function decrypt(encryptedData: string, additionalData?: string): string {
  try {
    const key = getEncryptionKey();
    
    // Extract IV, tag, and encrypted data
    const iv = Buffer.from(encryptedData.slice(0, IV_LENGTH * 2), 'hex');
    const tag = Buffer.from(encryptedData.slice(IV_LENGTH * 2, (IV_LENGTH + TAG_LENGTH) * 2), 'hex');
    const encrypted = encryptedData.slice((IV_LENGTH + TAG_LENGTH) * 2);
    
    const decipher = crypto.createDecipher(ALGORITHM, key);
    decipher.setAuthTag(tag);
    decipher.setAAD(Buffer.from(additionalData || '', 'utf8'));
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    throw new Error(`Decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Hash password with bcrypt-like functionality using PBKDF2
 */
export function hashPassword(password: string, rounds: number = 100000): string {
  try {
    const salt = crypto.randomBytes(SALT_LENGTH);
    const hash = crypto.pbkdf2Sync(password, salt, rounds, 64, 'sha512');
    
    // Store salt + rounds + hash
    return `$pbkdf2-sha512$${rounds}$${salt.toString('base64')}$${hash.toString('base64')}`;
  } catch (error) {
    throw new Error(`Password hashing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Verify password against hash
 */
export function verifyPassword(password: string, hash: string): boolean {
  try {
    const parts = hash.split('$');
    
    if (parts.length !== 5 || parts[0] !== '' || parts[1] !== 'pbkdf2-sha512') {
      throw new Error('Invalid hash format');
    }
    
    const rounds = parseInt(parts[2], 10);
    const salt = Buffer.from(parts[3], 'base64');
    const originalHash = parts[4];
    
    const testHash = crypto.pbkdf2Sync(password, salt, rounds, 64, 'sha512');
    
    return crypto.timingSafeEqual(Buffer.from(originalHash, 'base64'), testHash);
  } catch (error) {
    console.error('Password verification error:', error);
    return false;
  }
}

/**
 * Generate secure random token
 */
export function generateSecureToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Generate API key
 */
export function generateApiKey(prefix: string = 'ak'): string {
  const timestamp = Date.now().toString(36);
  const randomBytes = crypto.randomBytes(24).toString('base64url');
  
  return `${prefix}_${timestamp}_${randomBytes}`;
}

/**
 * Hash sensitive data (one-way)
 */
export function hashData(data: string, algorithm: string = 'sha256'): string {
  return crypto.createHash(algorithm).update(data).digest('hex');
}

/**
 * HMAC signature generation
 */
export function generateHmac(data: string, secret: string, algorithm: string = 'sha256'): string {
  return crypto.createHmac(algorithm, secret).update(data).digest('hex');
}

/**
 * Verify HMAC signature
 */
export function verifyHmac(data: string, signature: string, secret: string, algorithm: string = 'sha256'): boolean {
  const expectedSignature = generateHmac(data, secret, algorithm);
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
}

/**
 * Encrypt PII (Personally Identifiable Information)
 */
export class PIIEncryption {
  private static readonly CONTEXT_PREFIX = 'PII:';

  /**
   * Encrypt PII data with context
   */
  static encryptPII(data: string, context: string = 'default'): string {
    const contextualData = `${this.CONTEXT_PREFIX}${context}`;
    return encrypt(data, contextualData);
  }

  /**
   * Decrypt PII data with context
   */
  static decryptPII(encryptedData: string, context: string = 'default'): string {
    const contextualData = `${this.CONTEXT_PREFIX}${context}`;
    return decrypt(encryptedData, contextualData);
  }

  /**
   * Mask PII for logging (show only first and last characters)
   */
  static maskPII(data: string, visibleChars: number = 2): string {
    if (data.length <= visibleChars * 2) {
      return '*'.repeat(data.length);
    }
    
    const start = data.substring(0, visibleChars);
    const end = data.substring(data.length - visibleChars);
    const middle = '*'.repeat(data.length - visibleChars * 2);
    
    return `${start}${middle}${end}`;
  }

  /**
   * Mask email address
   */
  static maskEmail(email: string): string {
    const [username, domain] = email.split('@');
    if (!domain) return this.maskPII(email);
    
    const maskedUsername = username.length > 2 
      ? `${username[0]}${'*'.repeat(username.length - 2)}${username[username.length - 1]}`
      : '*'.repeat(username.length);
    
    return `${maskedUsername}@${domain}`;
  }

  /**
   * Mask phone number
   */
  static maskPhoneNumber(phone: string): string {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length < 4) return '*'.repeat(phone.length);
    
    const lastFour = cleaned.slice(-4);
    const masked = '*'.repeat(cleaned.length - 4) + lastFour;
    
    // Preserve original formatting
    let result = '';
    let maskedIndex = 0;
    
    for (let i = 0; i < phone.length; i++) {
      if (/\d/.test(phone[i])) {
        result += masked[maskedIndex++];
      } else {
        result += phone[i];
      }
    }
    
    return result;
  }
}

/**
 * Payment data encryption (PCI DSS compliance helpers)
 */
export class PaymentEncryption {
  /**
   * Encrypt credit card number (for temporary storage only - use payment processor for real implementation)
   */
  static encryptCardNumber(cardNumber: string): string {
    // Remove spaces and non-digits
    const cleaned = cardNumber.replace(/\D/g, '');
    return encrypt(cleaned, 'PAYMENT:CARD');
  }

  /**
   * Mask credit card number for display
   */
  static maskCardNumber(cardNumber: string): string {
    const cleaned = cardNumber.replace(/\D/g, '');
    if (cleaned.length < 8) return '*'.repeat(cardNumber.length);
    
    const lastFour = cleaned.slice(-4);
    const firstFour = cleaned.slice(0, 4);
    const middleMask = '*'.repeat(cleaned.length - 8);
    
    return `${firstFour}${middleMask}${lastFour}`;
  }

  /**
   * Generate payment token (for tokenization)
   */
  static generatePaymentToken(): string {
    return `tok_${generateSecureToken(16)}`;
  }
}

/**
 * Database field encryption
 */
export class FieldEncryption {
  private static readonly ENCRYPTED_FIELD_PREFIX = 'enc:';

  /**
   * Encrypt a field value
   */
  static encryptField(value: string, fieldName: string): string {
    const encrypted = encrypt(value, `FIELD:${fieldName}`);
    return `${this.ENCRYPTED_FIELD_PREFIX}${encrypted}`;
  }

  /**
   * Decrypt a field value
   */
  static decryptField(encryptedValue: string, fieldName: string): string {
    if (!encryptedValue.startsWith(this.ENCRYPTED_FIELD_PREFIX)) {
      return encryptedValue; // Not encrypted
    }
    
    const encrypted = encryptedValue.slice(this.ENCRYPTED_FIELD_PREFIX.length);
    return decrypt(encrypted, `FIELD:${fieldName}`);
  }

  /**
   * Check if field is encrypted
   */
  static isEncrypted(value: string): boolean {
    return value.startsWith(this.ENCRYPTED_FIELD_PREFIX);
  }

  /**
   * Encrypt multiple fields in an object
   */
  static encryptFields<T extends Record<string, any>>(
    obj: T,
    fieldsToEncrypt: (keyof T)[]
  ): T {
    const result = { ...obj };
    
    for (const field of fieldsToEncrypt) {
      if (result[field] && typeof result[field] === 'string') {
        result[field] = this.encryptField(result[field] as string, String(field));
      }
    }
    
    return result;
  }

  /**
   * Decrypt multiple fields in an object
   */
  static decryptFields<T extends Record<string, any>>(
    obj: T,
    fieldsToDecrypt: (keyof T)[]
  ): T {
    const result = { ...obj };
    
    for (const field of fieldsToDecrypt) {
      if (result[field] && typeof result[field] === 'string') {
        result[field] = this.decryptField(result[field] as string, String(field));
      }
    }
    
    return result;
  }
}

/**
 * Secure comparison utility
 */
export function secureCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

/**
 * Key derivation from password
 */
export function deriveKeyFromPassword(password: string, salt: string, iterations: number = 100000): Buffer {
  return crypto.pbkdf2Sync(password, salt, iterations, KEY_LENGTH, 'sha512');
}

/**
 * Encrypt large files (streaming)
 */
export function createEncryptionStream(key?: Buffer) {
  const encryptionKey = key || getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  
  const cipher = crypto.createCipher(ALGORITHM, encryptionKey);
  
  return {
    cipher,
    iv,
    getAuthTag: () => cipher.getAuthTag()
  };
}

/**
 * Decrypt large files (streaming)
 */
export function createDecryptionStream(iv: Buffer, authTag: Buffer, key?: Buffer) {
  const encryptionKey = key || getEncryptionKey();
  
  const decipher = crypto.createDecipher(ALGORITHM, encryptionKey);
  decipher.setAuthTag(authTag);
  
  return decipher;
}

// Export all encryption utilities
export {
  PIIEncryption,
  PaymentEncryption,
  FieldEncryption,
  ALGORITHM,
  KEY_LENGTH,
  IV_LENGTH,
  TAG_LENGTH,
  SALT_LENGTH
};