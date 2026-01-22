import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';
import { prisma } from '../index';
import { errorResponse } from '../utils/responses';
import { UserRole, UserStatus } from '@prisma/client';
import { AuthUser } from '../types';

// Extender Request para incluir user
declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    let token: string | undefined;

    // Prioridad 1: Leer token de cookie (httpOnly)
    if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    // Prioridad 2: Leer token del header Authorization (backwards compatibility)
    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7); // Remover 'Bearer '
      }
    }

    if (!token) {
      return errorResponse(res, 'Token no proporcionado', 401);
    }

    // Verificar token
    const payload = verifyToken(token);

    if (!payload) {
      return errorResponse(res, 'Token inválido o expirado', 401);
    }

    // Buscar usuario en BD
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        nickname: true,
        role: true,
        status: true,
        clanId: true,
        discordId: true
      }
    });

    if (!user) {
      return errorResponse(res, 'Usuario no encontrado', 401);
    }

    // Verificar estado del usuario
    if (user.status === UserStatus.BANNED) {
      return errorResponse(res, 'Usuario baneado', 403);
    }

    if (user.status === UserStatus.PENDING) {
      return errorResponse(res, 'Usuario pendiente de validación', 403);
    }

    // Agregar usuario a request
    req.user = user;
    next();
  } catch (error) {
    return errorResponse(res, 'Error de autenticación', 500);
  }
};

// Middleware para verificar roles
export const authorize = (...allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return errorResponse(res, 'No autenticado', 401);
    }

    if (!allowedRoles.includes(req.user.role)) {
      return errorResponse(res, 'No tienes permisos para esta acción', 403);
    }

    next();
  };
};

// Middleware para verificar que el usuario esté activo
export const requireActive = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return errorResponse(res, 'No autenticado', 401);
  }

  if (req.user.status !== UserStatus.ACTIVE) {
    return errorResponse(res, 'Usuario no está activo', 403);
  }

  next();
};

// Middleware para verificar que el usuario pertenezca a un clan
export const requireClan = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return errorResponse(res, 'No autenticado', 401);
  }

  if (!req.user.clanId) {
    return errorResponse(res, 'Usuario sin clan asignado', 403);
  }

  next();
};

// Middleware para requerir rol de admin
export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'No autenticado',
    });
  }

  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({
      success: false,
      message: 'Se requieren permisos de administrador',
    });
  }

  next();
};