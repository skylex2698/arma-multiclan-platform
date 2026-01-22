import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import { PrismaClient } from '@prisma/client';
import { authRoutes } from './routes/auth.routes';
import { discordRoutes } from './routes/discord.routes';
import { clanRoutes } from './routes/clan.routes';
import { userRoutes } from './routes/user.routes';
import eventRoutes from './routes/event.routes';
import { slotRoutes, squadRouter } from './routes/slot.routes';
import communicationTreeRoutes from './routes/communicationTree.routes';
import { generalLimiter, loginLimiter, registerLimiter, uploadLimiter, sensitiveLimiter } from './middlewares/rateLimiter';
import { logger } from './utils/logger';

dotenv.config();

export const prisma = new PrismaClient();

const app = express();
const PORT = process.env.PORT || 3000;
const isProduction = process.env.NODE_ENV === 'production';

// ============================================
// SEGURIDAD: Helmet para cabeceras HTTP
// ============================================
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      connectSrc: ["'self'", process.env.FRONTEND_URL || 'http://localhost:5173'],
      fontSrc: ["'self'", "https:", "data:"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false, // Necesario para cargar imágenes externas
  crossOriginOpenerPolicy: { policy: "same-origin" },
  crossOriginResourcePolicy: { policy: "cross-origin" }, // Para servir imágenes
  hsts: isProduction ? { maxAge: 31536000, includeSubDomains: true } : false,
  noSniff: true,
  referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  xssFilter: true,
}));

// ============================================
// SEGURIDAD: Rate Limiting general
// ============================================
app.use(generalLimiter);

// ============================================
// CORS configuración segura
// ============================================
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:5173', // Desarrollo
].filter(Boolean) as string[];

app.use(cors({
  origin: (origin, callback) => {
    // Permitir requests sin origin (mobile apps, Postman en dev)
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      logger.warn('CORS blocked origin', { origin });
      callback(new Error('No permitido por CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400, // Cache preflight por 24h
}));

// ============================================
// Middleware básico
// ============================================
app.use(cookieParser());
app.use(express.json({ limit: '1mb' })); // Limitar tamaño de body
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// ============================================
// Archivos estáticos con seguridad
// ============================================
app.use('/uploads', express.static(path.join(process.cwd(), 'public', 'uploads'), {
  maxAge: '1d',
  dotfiles: 'deny',
  index: false,
  setHeaders: (res) => {
    res.set('X-Content-Type-Options', 'nosniff');
    res.set('Cache-Control', 'public, max-age=86400');
  }
}));

// ============================================
// Health check (sin rate limit)
// ============================================
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Arma Events Platform API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// ============================================
// Rutas con Rate Limiting específico
// ============================================

// Auth con rate limiting estricto
app.use('/api/auth/login', loginLimiter);
app.use('/api/auth/register', registerLimiter);
app.use('/api/auth', authRoutes);

// Discord
app.use('/api/discord', discordRoutes);

// Clanes con rate limit para uploads
app.use('/api/clans', clanRoutes);

// Usuarios con rate limit para operaciones sensibles
app.use('/api/users/change-password', sensitiveLimiter);
app.use('/api/users', userRoutes);

// Eventos
app.use('/api/events', eventRoutes);

// Slots y escuadras
app.use('/api/slots', slotRoutes);
app.use('/api/squads', squadRouter);

// Árbol de comunicaciones
app.use('/api/events', communicationTreeRoutes);

// ============================================
// Manejo de errores global (sin exponer detalles en producción)
// ============================================
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  // Loggear error completo internamente
  logger.error('Unhandled error', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    ip: req.ip,
  });

  // Respuesta al cliente (sin exponer detalles en producción)
  const statusCode = err.status || err.statusCode || 500;

  res.status(statusCode).json({
    success: false,
    message: isProduction
      ? 'Ha ocurrido un error en el servidor'
      : err.message || 'Internal Server Error',
    ...(isProduction ? {} : { stack: err.stack }),
  });
});

// ============================================
// Manejo de rutas no encontradas
// ============================================
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Ruta no encontrada',
  });
});

// ============================================
// Inicio del servidor
// ============================================
app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`, {
    environment: process.env.NODE_ENV || 'development',
    port: PORT,
  });

  if (!isProduction) {
    console.log('Health check: http://localhost:' + PORT + '/health');
    console.log('API Base: http://localhost:' + PORT + '/api');
  }
});

// ============================================
// Graceful shutdown
// ============================================
const gracefulShutdown = async () => {
  logger.info('Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
};

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);
