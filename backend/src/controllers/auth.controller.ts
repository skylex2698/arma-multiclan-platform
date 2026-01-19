import { Request, Response } from 'express';
import { authService } from '../services/auth.service';
import { successResponse, errorResponse } from '../utils/responses';
import { isValidEmail, isStrongPassword, sanitizeNickname } from '../utils/validators';
import { logger } from '../utils/logger';
import { prisma } from '../config/database';

export class AuthController {
  // POST /api/auth/register/local
  async registerLocal(req: Request, res: Response) {
    try {
      const { email, password, nickname, clanId } = req.body;

      // Validaciones
      if (!email || !password || !nickname || !clanId) {
        return errorResponse(res, 'Todos los campos son obligatorios', 400);
      }

      if (!isValidEmail(email)) {
        return errorResponse(res, 'Email inválido', 400);
      }

      if (!isStrongPassword(password)) {
        return errorResponse(
          res,
          'La contraseña debe tener mínimo 8 caracteres, una mayúscula, una minúscula y un número',
          400
        );
      }

      const cleanNickname = sanitizeNickname(nickname);
      if (cleanNickname.length < 3) {
        return errorResponse(res, 'El nickname debe tener al menos 3 caracteres', 400);
      }

      // Registrar usuario
      const user = await authService.registerLocal({
        email,
        password,
        nickname: cleanNickname,
        clanId
      });

      return successResponse(
        res,
        { user },
        'Usuario registrado correctamente. Pendiente de validación por administrador o líder de clan.',
        201
      );
    } catch (error: any) {
      logger.error('Error in registerLocal', error);
      return errorResponse(res, error.message || 'Error al registrar usuario', 500);
    }
  }

  // POST /api/auth/login/local
  async loginLocal(req: Request, res: Response) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return errorResponse(res, 'Email y contraseña son obligatorios', 400);
      }

      const result = await authService.loginLocal(email, password);

      return successResponse(res, result, 'Login exitoso');
    } catch (error: any) {
      logger.error('Error in loginLocal', error);
      return errorResponse(res, error.message || 'Error al iniciar sesión', 401);
    }
  }

  // POST /api/auth/register/discord
  async completeDiscordRegistration(req: Request, res: Response) {
    try {
      const { discordId, discordUsername, email, nickname, clanId } = req.body;

      // Validaciones
      if (!discordId || !nickname || !clanId) {
        return errorResponse(res, 'Datos incompletos', 400);
      }

      const cleanNickname = sanitizeNickname(nickname);
      if (cleanNickname.length < 3) {
        return errorResponse(res, 'El nickname debe tener al menos 3 caracteres', 400);
      }

      // Completar registro
      const user = await authService.completeDiscordRegistration({
        discordId,
        discordUsername,
        email,
        nickname: cleanNickname,
        clanId
      });

      return successResponse(
        res,
        { user },
        'Registro completado. Pendiente de validación por administrador o líder de clan.',
        201
      );
    } catch (error: any) {
      logger.error('Error in completeDiscordRegistration', error);
      return errorResponse(res, error.message || 'Error al completar registro', 500);
    }
  }

  // GET /api/auth/me - Obtener usuario actual
  async getMe(req: Request, res: Response) {
    try {
      const userId = req.user!.id;

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          nickname: true,
          role: true,
          status: true,
          clanId: true,
          avatarUrl: true,
          createdAt: true,
          updatedAt: true,
          clan: {
            select: {
              id: true,
              name: true,
              tag: true,
              description: true,
              avatarUrl: true,
            },
          },
        },
      });

      if (!user) {
        return errorResponse(res, 'Usuario no encontrado', 404);
      }

      return successResponse(res, { user }, 'Usuario obtenido exitosamente');
    } catch (error: any) {
      logger.error('Error in getMe', error);
      return errorResponse(res, error.message || 'Error al obtener usuario', 500);
    }
  }
}

export const authController = new AuthController();