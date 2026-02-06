import jwt, { SignOptions, VerifyOptions } from 'jsonwebtoken';
import { Response } from 'express';
import { JWTPayload } from '../types';

// ============================================
// SEGURIDAD: Validación estricta de JWT_SECRET
// ============================================

const JWT_SECRET: jwt.Secret = process.env.JWT_SECRET as string;

if (!JWT_SECRET) {
  console.error('FATAL: JWT_SECRET environment variable is required');
  process.exit(1);
}

if (JWT_SECRET.length < 32) {
  console.error('FATAL: JWT_SECRET must be at least 32 characters long');
  process.exit(1);
}

// Reducido de 7d a 24h por seguridad
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

// ============================================
// Token Blacklist para revocación de tokens
// ============================================

const tokenBlacklist = new Set<string>();

export const blacklistToken = (token: string): void => {
  tokenBlacklist.add(token);
  // Auto-limpiar después del tiempo de expiración máximo (24h)
  setTimeout(() => tokenBlacklist.delete(token), 24 * 60 * 60 * 1000);
};

export const isTokenBlacklisted = (token: string): boolean => {
  return tokenBlacklist.has(token);
};

// ============================================
// Funciones de generación y verificación
// ============================================

export const generateToken = (payload: JWTPayload): string => {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
    algorithm: 'HS256' // Algoritmo explícito para prevenir confusion attacks
  } as SignOptions);
};

export const verifyToken = (token: string): JWTPayload | null => {
  try {
    // Verificar si está en la blacklist
    if (isTokenBlacklisted(token)) {
      return null;
    }

    const options: VerifyOptions = {
      algorithms: ['HS256'] // Solo aceptar HS256
    };
    return jwt.verify(token, JWT_SECRET, options) as JWTPayload;
  } catch (error) {
    return null;
  }
};

export const decodeToken = (token: string): JWTPayload | null => {
  try {
    return jwt.decode(token) as JWTPayload;
  } catch (error) {
    return null;
  }
};

// ============================================
// Opciones de cookie para JWT
// ============================================

export const getCookieOptions = () => {
  const isSecure = process.env.COOKIE_SECURE === 'true';
  const sameSite = (process.env.COOKIE_SAMESITE || 'lax') as 'strict' | 'lax' | 'none';

  return {
    httpOnly: true,
    secure: isSecure,
    sameSite,
    path: '/',
    maxAge: 24 * 60 * 60 * 1000, // 24 horas (sincronizado con JWT_EXPIRES_IN)
  };
};

/**
 * Establece el JWT en una cookie httpOnly
 */
export const setJWTCookie = (res: Response, payload: JWTPayload): void => {
  const token = generateToken(payload);
  res.cookie('token', token, getCookieOptions());
};

/**
 * Limpia la cookie del JWT (logout) y añade el token a la blacklist
 */
export const clearJWTCookie = (res: Response, token?: string): void => {
  // Añadir token a la blacklist si se proporciona
  if (token) {
    blacklistToken(token);
  }

  const opts = getCookieOptions();
  res.clearCookie('token', {
    httpOnly: opts.httpOnly,
    secure: opts.secure,
    sameSite: opts.sameSite,
    path: opts.path,
  });
};
