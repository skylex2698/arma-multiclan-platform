const jwt = require('jsonwebtoken');
import { Response } from 'express';
import { JWTPayload } from '../types';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export const generateToken = (payload: JWTPayload): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

export const verifyToken = (token: string): JWTPayload | null => {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
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

/**
 * Opciones de cookie para JWT
 */
const getCookieOptions = () => {
  const isSecure = process.env.COOKIE_SECURE === 'true';
  const sameSite = (process.env.COOKIE_SAMESITE || 'lax') as 'strict' | 'lax' | 'none';

  return {
    httpOnly: true,
    secure: isSecure,
    sameSite,
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 días en milisegundos
  };
};

/**
 * Establece el JWT en una cookie httpOnly
 * @param res - Response de Express
 * @param payload - Payload del JWT
 */
export const setJWTCookie = (res: Response, payload: JWTPayload): void => {
  const token = generateToken(payload);
  res.cookie('token', token, getCookieOptions());
};

/**
 * Limpia la cookie del JWT (logout)
 * @param res - Response de Express
 */
export const clearJWTCookie = (res: Response): void => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.COOKIE_SECURE === 'true',
    sameSite: (process.env.COOKIE_SAMESITE || 'lax') as 'strict' | 'lax' | 'none',
    path: '/',
  });
};