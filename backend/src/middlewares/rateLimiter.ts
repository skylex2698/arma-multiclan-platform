import rateLimit from 'express-rate-limit';

/**
 * Rate Limiter Middleware
 * Protección contra ataques de fuerza bruta y DoS
 */

// Límite general: 100 peticiones por minuto por IP
export const generalLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 100,
  message: {
    success: false,
    message: 'Demasiadas peticiones. Por favor, intenta de nuevo en un minuto.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip rate limiting for health checks
  skip: (req) => req.path === '/health',
});

// Límite estricto para login: 5 intentos por 15 minutos
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5,
  message: {
    success: false,
    message: 'Demasiados intentos de inicio de sesión. Intenta de nuevo en 15 minutos.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // No contar peticiones exitosas
});

// Límite para registro: 3 registros por hora por IP
export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 3,
  message: {
    success: false,
    message: 'Has alcanzado el límite de registros. Intenta de nuevo en 1 hora.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Límite para operaciones sensibles (cambio de contraseña, etc.): 3 por hora
export const sensitiveLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 3,
  message: {
    success: false,
    message: 'Has alcanzado el límite de operaciones sensibles. Intenta de nuevo en 1 hora.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Límite para subida de archivos: 10 por hora
export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 10,
  message: {
    success: false,
    message: 'Has alcanzado el límite de subidas. Intenta de nuevo en 1 hora.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Límite para API endpoints: 30 por minuto
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 30,
  message: {
    success: false,
    message: 'Demasiadas peticiones a la API. Intenta de nuevo en un minuto.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
