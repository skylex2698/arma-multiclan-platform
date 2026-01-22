import crypto from 'crypto';

/**
 * Genera un state aleatorio y seguro para OAuth2 (anti-CSRF)
 * @returns String aleatorio de 64 caracteres hexadecimales
 */
export const generateState = (): string => {
  return crypto.randomBytes(32).toString('hex');
};

/**
 * Valida que el state recibido coincida con el esperado
 * Usa comparación de tiempo constante para prevenir timing attacks
 * @param receivedState - State recibido del callback OAuth2
 * @param expectedState - State almacenado previamente
 * @returns true si coinciden, false en caso contrario
 */
export const validateState = (receivedState: string | undefined, expectedState: string | undefined): boolean => {
  if (!receivedState || !expectedState) {
    return false;
  }

  // Usar comparación de tiempo constante para prevenir timing attacks
  const a = Buffer.from(receivedState);
  const b = Buffer.from(expectedState);

  // Si las longitudes son diferentes, la comparación falla
  // Pero aún hacemos una comparación timing-safe para no revelar información
  if (a.length !== b.length) {
    // Comparar con un buffer de la misma longitud para mantener tiempo constante
    const dummy = Buffer.alloc(a.length);
    crypto.timingSafeEqual(a, dummy);
    return false;
  }

  return crypto.timingSafeEqual(a, b);
};

/**
 * Genera un token aleatorio seguro
 * @param bytes - Número de bytes (por defecto 32)
 * @returns Token en formato hexadecimal
 */
export const generateSecureToken = (bytes: number = 32): string => {
  return crypto.randomBytes(bytes).toString('hex');
};

/**
 * Hash de un string usando SHA-256
 * @param data - Dato a hashear
 * @returns Hash en hexadecimal
 */
export const hashSHA256 = (data: string): string => {
  return crypto.createHash('sha256').update(data).digest('hex');
};
