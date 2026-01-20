import { Request, Response } from 'express';
import { userService } from '../services/user.service';
import { successResponse, errorResponse } from '../utils/responses';
import { logger } from '../utils/logger';
import { UserRole, UserStatus } from '@prisma/client';
import { isValidEmail, sanitizeNickname, isStrongPassword } from '../utils/validators';
import { prisma } from '../config/database';

export class UserController {
  // GET /api/users
  async getAllUsers(req: Request, res: Response) {
    try {
      const { clanId, role, status } = req.query;

      const users = await userService.getAllUsers({
        clanId: clanId as string,
        role: role as UserRole,
        status: status as UserStatus
      });

      return successResponse(res, { users, count: users.length }, 'Usuarios obtenidos correctamente');
    } catch (error: any) {
      logger.error('Error in getAllUsers', error);
      return errorResponse(res, error.message || 'Error al obtener usuarios', 500);
    }
  }

  // GET /api/users/:id
  async getUserById(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      const user = await userService.getUserById(id);
      return successResponse(res, { user }, 'Usuario obtenido correctamente');
    } catch (error: any) {
      logger.error('Error in getUserById', error);
      return errorResponse(res, error.message || 'Error al obtener usuario', 404);
    }
  }

  // POST /api/users/:id/validate
  async validateUser(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      
      if (!req.user) {
        return errorResponse(res, 'No autenticado', 401);
      }

      const user = await userService.validateUser(
        id,
        req.user.id,
        req.user.role,
        req.user.clanId
      );

      return successResponse(res, { user }, 'Usuario validado correctamente');
    } catch (error: any) {
      logger.error('Error in validateUser', error);
      return errorResponse(res, error.message || 'Error al validar usuario', 500);
    }
  }

  // PUT /api/users/:id/role
  async changeUserRole(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      const { role } = req.body;

      if (!req.user) {
        return errorResponse(res, 'No autenticado', 401);
      }

      if (!role || !Object.values(UserRole).includes(role)) {
        return errorResponse(res, 'Rol inválido', 400);
      }

      const user = await userService.changeUserRole(id, role, req.user.id);

      return successResponse(res, { user }, 'Rol actualizado correctamente');
    } catch (error: any) {
      logger.error('Error in changeUserRole', error);
      return errorResponse(res, error.message || 'Error al cambiar rol', 500);
    }
  }

  // PUT /api/users/:id/status
  async changeUserStatus(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      const { status } = req.body;

      if (!req.user) {
        return errorResponse(res, 'No autenticado', 401);
      }

      if (!status || !Object.values(UserStatus).includes(status)) {
        return errorResponse(res, 'Estado inválido', 400);
      }

      const user = await userService.changeUserStatus(id, status, req.user.id);

      return successResponse(res, { user }, 'Estado actualizado correctamente');
    } catch (error: any) {
      logger.error('Error in changeUserStatus', error);
      return errorResponse(res, error.message || 'Error al cambiar estado', 500);
    }
  }

  // PUT /api/users/:id/clan
  async changeUserClan(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      const { clanId } = req.body;

      if (!req.user) {
        return errorResponse(res, 'No autenticado', 401);
      }

      const user = await userService.changeUserClan(id, clanId || null, req.user.id);

      return successResponse(res, { user }, 'Clan actualizado correctamente');
    } catch (error: any) {
      logger.error('Error in changeUserClan', error);
      return errorResponse(res, error.message || 'Error al cambiar clan', 500);
    }
  }

  // POST /api/users/clan-change-request
  async requestClanChange(req: Request, res: Response) {
    try {
      if (!req.user) {
        return errorResponse(res, 'No autenticado', 401);
      }

      const { targetClanId, reason } = req.body;

      if (!targetClanId) {
        return errorResponse(res, 'El clan destino es obligatorio', 400);
      }

      const request = await userService.requestClanChange(
        req.user.id,
        targetClanId,
        reason
      );

      return successResponse(
        res,
        { request },
        'Solicitud de cambio de clan creada correctamente',
        201
      );
    } catch (error: any) {
      logger.error('Error in requestClanChange', error);
      return errorResponse(res, error.message || 'Error al crear solicitud', 500);
    }
  }

  // GET /api/users/clan-change-requests
  async getClanChangeRequests(req: Request, res: Response) {
    try {
      const { status, targetClanId } = req.query;

      // Si es líder de clan, filtrar por su clan
      let filters: any = {
        status: status as string
      };

      if (req.user?.role === UserRole.CLAN_LEADER && req.user.clanId) {
        filters.targetClanId = req.user.clanId;
      } else if (targetClanId) {
        filters.targetClanId = targetClanId as string;
      }

      const requests = await userService.getClanChangeRequests(filters);

      return successResponse(
        res,
        { requests, count: requests.length },
        'Solicitudes obtenidas correctamente'
      );
    } catch (error: any) {
      logger.error('Error in getClanChangeRequests', error);
      return errorResponse(res, error.message || 'Error al obtener solicitudes', 500);
    }
  }

  // POST /api/users/clan-change-requests/:id/review
  async reviewClanChangeRequest(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      const { approved } = req.body;

      if (!req.user) {
        return errorResponse(res, 'No autenticado', 401);
      }

      if (typeof approved !== 'boolean') {
        return errorResponse(res, 'El campo "approved" es obligatorio y debe ser booleano', 400);
      }

      const request = await userService.reviewClanChangeRequest(
        id,
        req.user.id,
        req.user.role,
        req.user.clanId,
        approved
      );

      return successResponse(
        res,
        { request },
        approved ? 'Solicitud aprobada correctamente' : 'Solicitud rechazada correctamente'
      );
    } catch (error: any) {
      logger.error('Error in reviewClanChangeRequest', error);
      return errorResponse(res, error.message || 'Error al revisar solicitud', 500);
    }
  }

  // PUT /api/users/profile
  async updateProfile(req: Request, res: Response) {
    try {
      if (!req.user) {
        return errorResponse(res, 'No autenticado', 401);
      }

      const userId = req.user.id;
      const { nickname, email } = req.body;

      // Validaciones
      if (email) {
        if (!isValidEmail(email)) {
          return errorResponse(res, 'Email inválido', 400);
        }

        // Verificar si el email ya está en uso por otro usuario
        const existingUser = await prisma.user.findFirst({
          where: {
            email,
            NOT: { id: userId },
          },
        });

        if (existingUser) {
          return errorResponse(res, 'El email ya está en uso', 400);
        }
      }

      if (nickname) {
        const cleanNickname = sanitizeNickname(nickname);
        if (cleanNickname.length < 3) {
          return errorResponse(
            res,
            'El nickname debe tener al menos 3 caracteres',
            400
          );
        }
      }

      // Actualizar usuario
      const updatedUser = await userService.updateProfile(userId, {
        nickname,
        email,
      });

      return successResponse(
        res,
        { user: updatedUser },
        'Perfil actualizado correctamente'
      );
    } catch (error: any) {
      logger.error('Error in updateProfile', error);
      return errorResponse(
        res,
        error.message || 'Error al actualizar perfil',
        500
      );
    }
  }

  // PUT /api/users/change-password
  async changePassword(req: Request, res: Response) {
    try {
      if (!req.user) {
        return errorResponse(res, 'No autenticado', 401);
      }

      const userId = req.user.id;
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        return errorResponse(
          res,
          'La contraseña actual y nueva son obligatorias',
          400
        );
      }

      if (!isStrongPassword(newPassword)) {
        return errorResponse(
          res,
          'La contraseña debe tener mínimo 8 caracteres, una mayúscula, una minúscula y un número',
          400
        );
      }

      await userService.changePassword(userId, currentPassword, newPassword);

      return successResponse(res, {}, 'Contraseña actualizada correctamente');
    } catch (error: any) {
      logger.error('Error in changePassword', error);
      return errorResponse(
        res,
        error.message || 'Error al cambiar contraseña',
        400
      );
    }
  }

  // Actualizar rol de usuario
  async updateRole(req: Request, res: Response) {
    try {
      const { userId } = req.params;
      const { role } = req.body;

      if (Array.isArray(userId)) {
        return res.status(400).json({
          success: false,
          message: 'ID de usuario inválido',
        });
      }

      const user = await userService.updateRole(userId, role);

      res.json({
        success: true,
        data: { user },
        message: 'Rol actualizado correctamente',
      });
    } catch (error) {
      console.error('Error al actualizar rol:', error);
      res.status(500).json({
        success: false,
        message: 'Error al actualizar rol',
      });
    }
  }

  // Actualizar estado de usuario
  async updateStatus(req: Request, res: Response) {
    try {
      const { userId } = req.params;
      const { status } = req.body;

      if (Array.isArray(userId)) {
        return res.status(400).json({
          success: false,
          message: 'ID de usuario inválido',
        });
      }

      const user = await userService.updateStatus(userId, status);

      res.json({
        success: true,
        data: { user },
        message: 'Estado actualizado correctamente',
      });
    } catch (error) {
      console.error('Error al actualizar estado:', error);
      res.status(500).json({
        success: false,
        message: 'Error al actualizar estado',
      });
    }
  }
}

export const userController = new UserController();