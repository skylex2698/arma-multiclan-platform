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
 * @param receivedState - State recibido del callback OAuth2
 * @param expectedState - State almacenado previamente
 * @returns true si coinciden, false en caso contrario
 */
export const validateState = (receivedState: string | undefined, expectedState: string | undefined): boolean => {
  if (!receivedState || !expectedState) {
    return false;
  }
  return receivedState === expectedState;
};
