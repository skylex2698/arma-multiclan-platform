import crypto from 'crypto';

/**
 * Módulo de cifrado AES-256-GCM
 * Para cifrar datos sensibles como tokens de OAuth
 */

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

// La clave debe ser de 32 bytes (256 bits) en hexadecimal
const getEncryptionKey = (): Buffer => {
  const key = process.env.ENCRYPTION_KEY;

  if (!key) {
    // En desarrollo, usar una clave derivada del JWT_SECRET
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('ENCRYPTION_KEY or JWT_SECRET must be set');
    }
    // Derivar una clave de 32 bytes del JWT_SECRET
    return crypto.createHash('sha256').update(jwtSecret).digest();
  }

  // La clave debe ser de 64 caracteres hexadecimales (32 bytes)
  if (key.length !== 64) {
    throw new Error('ENCRYPTION_KEY must be 64 hexadecimal characters (32 bytes)');
  }

  return Buffer.from(key, 'hex');
};

/**
 * Cifra un texto usando AES-256-GCM
 * @param plaintext - Texto a cifrar
 * @returns Texto cifrado en formato: iv:authTag:ciphertext (hexadecimal)
 */
export const encrypt = (plaintext: string): string => {
  if (!plaintext) return '';

  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();

  // Formato: iv:authTag:ciphertext
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
};

/**
 * Descifra un texto cifrado con AES-256-GCM
 * @param ciphertext - Texto cifrado en formato: iv:authTag:ciphertext
 * @returns Texto descifrado o null si falla
 */
export const decrypt = (ciphertext: string): string | null => {
  if (!ciphertext) return null;

  try {
    const parts = ciphertext.split(':');
    if (parts.length !== 3) {
      // Texto no cifrado (legacy), devolver tal cual
      return ciphertext;
    }

    const [ivHex, authTagHex, encryptedHex] = parts;

    const key = getEncryptionKey();
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    // Si falla el descifrado, podría ser un valor legacy sin cifrar
    console.error('Decryption failed, returning null');
    return null;
  }
};

/**
 * Verifica si un texto está cifrado (tiene el formato correcto)
 */
export const isEncrypted = (text: string): boolean => {
  if (!text) return false;
  const parts = text.split(':');
  return parts.length === 3 && parts[0].length === 32 && parts[1].length === 32;
};
