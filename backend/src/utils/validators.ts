/**
 * Validadores y sanitizadores de entrada
 * Previene XSS, injection y otros ataques
 */

/**
 * Valida formato de email
 */
export const isValidEmail = (email: string): boolean => {
  if (!email || typeof email !== 'string') return false;

  // RFC 5322 simplified
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

  return email.length <= 254 && emailRegex.test(email);
};

/**
 * Valida fortaleza de contraseña
 * Mínimo 8 caracteres, mayúscula, minúscula, número
 */
export const isStrongPassword = (password: string): boolean => {
  if (!password || typeof password !== 'string') return false;

  // Mínimo 8 caracteres, al menos una mayúscula, una minúscula y un número
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

  return passwordRegex.test(password);
};

/**
 * Sanitiza un nickname eliminando caracteres peligrosos
 * Solo permite alfanuméricos, espacios, guiones, underscores y caracteres latinos
 */
export const sanitizeNickname = (nickname: string): string => {
  if (!nickname || typeof nickname !== 'string') return '';

  return nickname
    .trim()
    // Eliminar caracteres de control y peligrosos
    .replace(/[\x00-\x1F\x7F<>\"'`\\\/]/g, '')
    // Solo permitir caracteres seguros (alfanuméricos, espacios, guiones, underscores, acentos)
    .replace(/[^\w\s\-_.áéíóúÁÉÍÓÚñÑüÜàèìòùÀÈÌÒÙâêîôûÂÊÎÔÛäëïöüÄËÏÖÜ]/g, '')
    // Colapsar múltiples espacios
    .replace(/\s+/g, ' ')
    // Limitar longitud
    .slice(0, 50);
};

/**
 * Sanitiza texto plano eliminando cualquier HTML
 */
export const sanitizeText = (text: string): string => {
  if (!text || typeof text !== 'string') return '';

  return text
    .replace(/<[^>]*>/g, '') // Eliminar tags HTML
    .replace(/[<>]/g, '')    // Eliminar caracteres restantes
    .trim()
    .slice(0, 1000);         // Limitar longitud
};

/**
 * Valida que un string sea un UUID válido
 */
export const isValidUUID = (uuid: string): boolean => {
  if (!uuid || typeof uuid !== 'string') return false;

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

/**
 * Sanitiza una URL eliminando protocolos peligrosos
 */
export const sanitizeUrl = (url: string): string => {
  if (!url || typeof url !== 'string') return '';

  const trimmed = url.trim();
  const lower = trimmed.toLowerCase();

  // Bloquear protocolos peligrosos
  const dangerousProtocols = ['javascript:', 'data:', 'vbscript:', 'file:'];
  for (const protocol of dangerousProtocols) {
    if (lower.startsWith(protocol)) {
      return '';
    }
  }

  return trimmed.slice(0, 2048); // Limitar longitud de URL
};

/**
 * Valida y limita un número entero
 */
export const validateInteger = (value: any, min: number = 0, max: number = Number.MAX_SAFE_INTEGER): number | null => {
  const num = parseInt(value, 10);

  if (isNaN(num)) return null;
  if (num < min || num > max) return null;

  return num;
};

/**
 * Valida que un valor esté en una lista de valores permitidos (enum)
 */
export const isValidEnum = <T extends string>(value: string, allowedValues: readonly T[]): value is T => {
  return allowedValues.includes(value as T);
};
