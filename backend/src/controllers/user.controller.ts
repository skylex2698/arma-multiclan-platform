import { Request, Response } from 'express';
import { userService } from '../services/user.service';
import { successResponse, errorResponse } from '../utils/responses';
import { logger } from '../utils/logger';
import { ClanCreationRequestStatus, GameIdentityProviderKind, GameIdentityStatus, UserRole, UserStatus } from '@prisma/client';
import { isValidEmail, normalizeEmail, sanitizeNickname, isStrongPassword } from '../utils/validators';
import { prisma } from '../index';
import { gameIdentityService } from '../services/gameIdentity.service';

const isValidTimezone = (value: string) => {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: value });
    return true;
  } catch {
    return false;
  }
};

export class UserController {
  // GET /api/users
  async getAllUsers(req: Request, res: Response) {
    try {
      const { clanId, role, status, search, page, limit } = req.query;

      // Si es líder de clan, filtrar solo por su clan
      let filters: any = {
        role: role as UserRole,
        status: status as UserStatus,
        search: search as string,
        page: page ? parseInt(page as string, 10) : 1,
        limit: limit ? parseInt(limit as string, 10) : 20,
      };

      if (req.user?.role !== UserRole.ADMIN && req.user?.clanId) {
        // Cualquier rol de gestión de clan ve únicamente a su propio clan.
        filters.clanId = req.user.clanId;
      } else if (clanId) {
        // Admin puede filtrar por cualquier clan
        filters.clanId = clanId as string;
      }

      const result = await userService.getAllUsers(filters);

      return successResponse(res, {
        users: result.users,
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      }, 'Usuarios obtenidos correctamente');
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
      const id = req.params.userId as string;
      
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

  // PUT /api/users/:userId/clan
  async changeUserClan(req: Request, res: Response) {
    try {
      const userId = req.params.userId as string;
      const { clanId } = req.body;

      if (!req.user) {
        return errorResponse(res, 'No autenticado', 401);
      }

      const user = await userService.changeUserClan(userId, clanId || null, req.user.id);

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

      if (!req.user || (req.user.role !== UserRole.ADMIN && req.user.role !== UserRole.CLAN_LEADER)) {
        return errorResponse(
          res,
          'Solo los administradores y líderes de clan pueden ver estas solicitudes',
          403
        );
      }

      // Si es líder de clan, filtrar por su clan
      let filters: any = {
        status: status as string
      };

      if (req.user?.role !== UserRole.ADMIN && req.user?.clanId) {
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

      if (req.user.role !== UserRole.ADMIN && req.user.role !== UserRole.CLAN_LEADER) {
        return errorResponse(
          res,
          'Solo los administradores y líderes de clan pueden revisar estas solicitudes',
          403
        );
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

  async getClanCreationRequests(req: Request, res: Response) {
    try {
      if (req.user?.role !== UserRole.ADMIN) {
        return errorResponse(res, 'Solo los administradores pueden revisar estas solicitudes', 403);
      }

      const status = req.query.status as ClanCreationRequestStatus | undefined;
      const requests = await userService.getClanCreationRequests({ status });

      return successResponse(
        res,
        { requests, count: requests.length },
        'Solicitudes de creación de clan obtenidas correctamente'
      );
    } catch (error: any) {
      logger.error('Error in getClanCreationRequests', error);
      return errorResponse(res, error.message || 'Error al obtener solicitudes', 500);
    }
  }

  async reviewClanCreationRequest(req: Request, res: Response) {
    try {
      if (!req.user || req.user.role !== UserRole.ADMIN) {
        return errorResponse(res, 'Solo los administradores pueden revisar estas solicitudes', 403);
      }

      const requestId = req.params.id as string;
      const { approved, reviewNote } = req.body;

      if (typeof approved !== 'boolean') {
        return errorResponse(res, 'El campo "approved" es obligatorio y debe ser booleano', 400);
      }

      const request = await userService.reviewClanCreationRequest(
        requestId,
        req.user.id,
        approved,
        reviewNote ? String(reviewNote) : undefined
      );

      return successResponse(
        res,
        { request },
        approved
          ? 'Solicitud de creación de clan aprobada correctamente'
          : 'Solicitud de creación de clan rechazada correctamente'
      );
    } catch (error: any) {
      logger.error('Error in reviewClanCreationRequest', error);
      return errorResponse(res, error.message || 'Error al revisar solicitud', 500);
    }
  }

  async getCurrentApprovedClanCreationRequest(req: Request, res: Response) {
    try {
      if (!req.user) {
        return errorResponse(res, 'No autenticado', 401);
      }

      const request = await userService.getCurrentUserApprovedClanCreationRequest(req.user.id);
      return successResponse(res, { request }, 'Solicitud aprobada obtenida correctamente');
    } catch (error: any) {
      logger.error('Error in getCurrentApprovedClanCreationRequest', error);
      return errorResponse(res, error.message || 'Error al obtener la solicitud aprobada', 404);
    }
  }

  // PUT /api/users/profile
  async updateProfile(req: Request, res: Response) {
    try {
      if (!req.user) {
        return errorResponse(res, 'No autenticado', 401);
      }

      const userId = req.user.id;
      const { nickname, email, timezone } = req.body;

      // Validaciones
      if (email) {
        if (!isValidEmail(email)) {
          return errorResponse(res, 'Email inválido', 400);
        }

        const normalizedEmail = normalizeEmail(String(email));

        // Verificar si el email ya está en uso por otro usuario
        const existingUser = await prisma.user.findFirst({
          where: {
            email: {
              equals: normalizedEmail,
              mode: 'insensitive',
            },
            NOT: { id: userId },
          },
        });

        if (existingUser) {
          return errorResponse(
            res,
            'Solo se permite una cuenta por correo electrónico. Ese email ya está en uso.',
            400
          );
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

      if (timezone !== undefined && !isValidTimezone(String(timezone))) {
        return errorResponse(res, 'Zona horaria inválida', 400);
      }

      // Actualizar usuario
      const updatedUser = await userService.updateProfile(userId, {
        nickname,
        email: email ? normalizeEmail(String(email)) : undefined,
        timezone: timezone ? String(timezone) : undefined,
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

  async getCurrentUserGameIdentities(req: Request, res: Response) {
    try {
      if (!req.user) {
        return errorResponse(res, 'No autenticado', 401);
      }

      const identities = await gameIdentityService.listUserIdentities(req.user.id);
      return successResponse(res, { identities }, 'Identidades obtenidas correctamente');
    } catch (error: any) {
      logger.error('Error in getCurrentUserGameIdentities', error);
      return errorResponse(res, error.message || 'Error al obtener identidades', 500);
    }
  }

  async upsertCurrentUserGameIdentity(req: Request, res: Response) {
    try {
      if (!req.user) {
        return errorResponse(res, 'No autenticado', 401);
      }

      const { gameId } = req.params;
      const { providerKind, value } = req.body;

      const identity = await gameIdentityService.upsertIdentity(req.user.id, gameId as string, {
        providerKind: providerKind as GameIdentityProviderKind | undefined,
        value,
      });

      return successResponse(res, { identity }, 'Identidad actualizada correctamente');
    } catch (error: any) {
      logger.error('Error in upsertCurrentUserGameIdentity', error);
      return errorResponse(res, error.message || 'Error al actualizar identidad', 500);
    }
  }

  async updateGameIdentityStatus(req: Request, res: Response) {
    try {
      if (!req.user) {
        return errorResponse(res, 'No autenticado', 401);
      }

      const { identityId } = req.params;
      const { status } = req.body;

      if (!status || !Object.values(GameIdentityStatus).includes(status)) {
        return errorResponse(res, 'Estado de identidad inválido', 400);
      }

      const identity = await gameIdentityService.setIdentityStatus(
        identityId as string,
        req.user.id,
        req.user.role,
        req.user.clanId,
        status
      );

      return successResponse(res, { identity }, 'Estado de identidad actualizado');
    } catch (error: any) {
      logger.error('Error in updateGameIdentityStatus', error);
      return errorResponse(res, error.message || 'Error al revisar identidad', 500);
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

  async selfResetPassword(req: Request, res: Response) {
    try {
      if (!req.user) {
        return errorResponse(res, 'No autenticado', 401);
      }

      const { newPassword } = req.body;

      if (!newPassword) {
        return errorResponse(res, 'La nueva contraseña es obligatoria', 400);
      }

      if (!isStrongPassword(newPassword)) {
        return errorResponse(
          res,
          'La contraseña debe tener mínimo 8 caracteres, una mayúscula, una minúscula y un número',
          400
        );
      }

      await userService.selfResetPassword(req.user.id, newPassword);

      return successResponse(res, {}, 'Contraseña restablecida correctamente');
    } catch (error: any) {
      logger.error('Error in selfResetPassword', error);
      return errorResponse(
        res,
        error.message || 'Error al restablecer contraseña',
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

      if (!req.user) {
        return errorResponse(res, 'No autenticado', 401);
      }

      if (!Object.values(UserRole).includes(role)) {
        return errorResponse(res, 'Rol inválido', 400);
      }

      const user = await userService.updateRole(userId, role, {
        id: req.user.id,
        role: req.user.role,
        clanId: req.user.clanId,
      });

      return successResponse(res, { user }, 'Rol actualizado correctamente');
    } catch (error: any) {
      logger.error('Error in updateRole', error);
      return errorResponse(res, error.message || 'Error al actualizar rol', 500);
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

  async adminUpdateUserProfile(req: Request, res: Response) {
    try {
      if (!req.user) {
        return errorResponse(res, 'No autenticado', 401);
      }

      const userId = req.params.userId as string;
      const { nickname, email } = req.body;

      if (nickname !== undefined) {
        const sanitized = sanitizeNickname(String(nickname));
        if (!sanitized || sanitized.length < 3) {
          return errorResponse(res, 'Nickname inválido', 400);
        }
      }

      if (email !== undefined && email !== null && email !== '') {
        if (!isValidEmail(String(email))) {
          return errorResponse(res, 'Email inválido', 400);
        }
      }

      const user = await userService.adminUpdateUserProfile(
        userId,
        {
          nickname:
            nickname !== undefined ? sanitizeNickname(String(nickname)) : undefined,
          email:
            email === undefined ? undefined : email === '' ? null : String(email).trim(),
        },
        req.user.id
      );

      return successResponse(res, { user }, 'Perfil de usuario actualizado correctamente');
    } catch (error: any) {
      logger.error('Error in adminUpdateUserProfile', error);
      return errorResponse(
        res,
        error.message || 'Error al actualizar perfil de usuario',
        500
      );
    }
  }

  async adminResetUserPassword(req: Request, res: Response) {
    try {
      if (!req.user) {
        return errorResponse(res, 'No autenticado', 401);
      }

      const userId = req.params.userId as string;
      const result = await userService.adminResetUserPassword(userId, req.user.id);

      return successResponse(
        res,
        result,
        'Contraseña temporal generada correctamente'
      );
    } catch (error: any) {
      logger.error('Error in adminResetUserPassword', error);
      return errorResponse(
        res,
        error.message || 'Error al resetear la contraseña',
        500
      );
    }
  }

  async adminUpdateUserPermissions(req: Request, res: Response) {
    try {
      if (!req.user) {
        return errorResponse(res, 'No autenticado', 401);
      }

      const userId = req.params.userId as string;
      const { permissions } = req.body;

      if (!Array.isArray(permissions)) {
        return errorResponse(res, 'La lista de permisos es obligatoria', 400);
      }

      const user = await userService.adminUpdateUserPermissions(
        userId,
        permissions.map((permission) => String(permission)),
        req.user.id
      );

      return successResponse(res, { user }, 'Permisos actualizados correctamente');
    } catch (error: any) {
      logger.error('Error in adminUpdateUserPermissions', error);
      return errorResponse(
        res,
        error.message || 'Error al actualizar permisos',
        500
      );
    }
  }
  // POST /api/users/external
  async createExternalUser(req: Request, res: Response) {
    try {
      if (!req.user) {
        return errorResponse(res, 'No autenticado', 401);
      }

      const { nickname, clanId } = req.body;

      if (!nickname || typeof nickname !== 'string') {
        return errorResponse(res, 'El nombre es obligatorio', 400);
      }

      // Cualquier rol de clan con permiso crea externos solo en su propio clan.
      // Admin puede especificar cualquier clan.
      let targetClanId: string;
      if (req.user.role !== UserRole.ADMIN) {
        if (!req.user.clanId) {
          return errorResponse(res, 'No perteneces a ningún clan', 400);
        }
        targetClanId = req.user.clanId;
      } else {
        // Admin
        targetClanId = clanId || req.user.clanId;
        if (!targetClanId) {
          return errorResponse(res, 'Debes especificar un clan', 400);
        }
      }

      const user = await userService.createExternalUser(
        nickname,
        targetClanId,
        req.user.id
      );

      return successResponse(res, { user }, 'Miembro externo registrado correctamente');
    } catch (error: any) {
      logger.error('Error in createExternalUser', error);
      return errorResponse(res, error.message || 'Error al crear miembro externo', 400);
    }
  }

  async deleteUser(req: Request, res: Response) {
    try {
      if (!req.user) {
        return errorResponse(res, 'No autenticado', 401);
      }

      const userId = req.params.userId as string;
      await userService.deleteUser(userId, req.user.id);

      return successResponse(res, {}, 'Usuario eliminado correctamente');
    } catch (error: any) {
      logger.error('Error in deleteUser', error);
      return errorResponse(res, error.message || 'Error al eliminar usuario', 400);
    }
  }
}

export const userController = new UserController();
