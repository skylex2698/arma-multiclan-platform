import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import { PrismaClient } from '@prisma/client';
import type { Server } from 'http';
import { authRoutes } from './routes/auth.routes';
import { discordRoutes } from './routes/discord.routes';
import { clanRoutes } from './routes/clan.routes';
import { gameRoutes } from './routes/game.routes';
import { userRoutes } from './routes/user.routes';
import { feedbackRoutes } from './routes/feedback.routes';
import eventRoutes from './routes/event.routes';
import { slotRoutes, squadRouter } from './routes/slot.routes';
import { generalLimiter, loginLimiter, registerLimiter, uploadLimiter, sensitiveLimiter } from './middlewares/rateLimiter';
import { logger } from './utils/logger';
import { softDeleteMiddleware } from './middlewares/softDelete';

dotenv.config();

export const prisma = new PrismaClient();
softDeleteMiddleware(prisma);

const app = express();
const PORT = process.env.PORT || 3000;
const isProduction = process.env.NODE_ENV === 'production';
let server: Server | null = null;

const normalizeOrigin = (value?: string): string | null => {
  if (!value) return null;

  try {
    const url = new URL(value);
    return url.origin;
  } catch {
    return null;
  }
};

const frontendConnectOrigin =
  process.env.FRONTEND_URL || 'http://localhost:5173';

const buildAllowedOrigins = (): string[] => {
  const origins = new Set<string>();
  const frontendOrigin = normalizeOrigin(process.env.FRONTEND_URL);
  const frontendPort = process.env.FRONTEND_PORT;

  if (frontendOrigin) {
    origins.add(frontendOrigin);

    if (frontendPort) {
      const frontendUrl = new URL(frontendOrigin);
      const defaultPort =
        frontendUrl.protocol === 'https:' ? '443' : '80';

      if (!frontendUrl.port && frontendPort !== defaultPort) {
        frontendUrl.port = frontendPort;
        origins.add(frontendUrl.origin);
      }
    }
  }

  const extraOrigins = (process.env.CORS_EXTRA_ORIGINS || '')
    .split(',')
    .map(origin => normalizeOrigin(origin))
    .filter((origin): origin is string => Boolean(origin));

  extraOrigins.forEach(origin => origins.add(origin));
  origins.add('http://localhost:5173');

  return Array.from(origins);
};

// ============================================
// Trust proxy (necesario detrás de nginx/reverse proxy)
// ============================================
app.set('trust proxy', 1);

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
      connectSrc: ["'self'", frontendConnectOrigin],
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
const allowedOrigins = buildAllowedOrigins();

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
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
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
  setHeaders: (res, filePath) => {
    res.set('X-Content-Type-Options', 'nosniff');
    res.set('Cache-Control', 'public, max-age=86400');

    // Seguridad extra para archivos HTML (modsets): sandbox CSP impide
    // ejecución de scripts, envío de formularios, popups, etc.
    // Defensa en profundidad junto con la sanitización DOMPurify en upload.
    if (filePath.endsWith('.html') || filePath.endsWith('.htm')) {
      res.set('Content-Security-Policy', 'sandbox');
      res.set('X-Frame-Options', 'DENY');
    }
  }
}));

// ============================================
// Health check (sin rate limit)
// ============================================
const healthHandler = (req: express.Request, res: express.Response) => {
  res.json({
    status: 'OK',
    message: 'Arma Events Platform API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
};

app.get('/health', healthHandler);
app.get('/api/health', healthHandler);

// ============================================
// Rutas con Rate Limiting específico
// ============================================

// Auth con rate limiting estricto
app.use('/api/auth/login', loginLimiter);
app.use('/api/auth/register', registerLimiter);
app.use('/api/auth/forgot-password', sensitiveLimiter);
app.use('/api/auth/reset-password', sensitiveLimiter);
app.use('/api/auth', authRoutes);

// Discord
app.use('/api/discord', discordRoutes);

// Clanes con rate limit para uploads
app.use('/api/clans', clanRoutes);

// Catálogo de juegos
app.use('/api/games', gameRoutes);

// Usuarios con rate limit para operaciones sensibles
app.use('/api/users/change-password', sensitiveLimiter);
app.use('/api/users', userRoutes);

// Feedback de plataforma
app.use('/api/feedback', feedbackRoutes);

// Eventos
app.use('/api/events', eventRoutes);

// Slots y escuadras
app.use('/api/slots', slotRoutes);
app.use('/api/squads', squadRouter);

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
export const startServer = () => {
  if (server) {
    return server;
  }

  server = app.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`, {
      environment: process.env.NODE_ENV || 'development',
      port: PORT,
    });

    if (!isProduction) {
      console.log('Health check: http://localhost:' + PORT + '/health');
      console.log('API Base: http://localhost:' + PORT + '/api');
    }
  });

  return server;
};

// ============================================
// Graceful shutdown
// ============================================
const gracefulShutdown = async () => {
  logger.info('Shutting down gracefully...');
  if (server) {
    await new Promise<void>((resolve, reject) => {
      server!.close((error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve();
      });
    });
    server = null;
  }
  await prisma.$disconnect();
  process.exit(0);
};

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);

if (require.main === module) {
  startServer();
}

export { app };
