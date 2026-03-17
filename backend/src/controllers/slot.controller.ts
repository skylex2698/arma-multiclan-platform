import { Request, Response } from 'express';
import { slotService } from '../services/slot.service';
import { successResponse, errorResponse } from '../utils/responses';
import { logger } from '../utils/logger';
import { prisma } from '../index';
import { hasPermission, PERMISSIONS } from '../auth/rbac';

export class SlotController {
  // POST /api/slots/:id/assign
  async assignSlot(req: Request, res: Response) {
    try {
      if (!req.user) {
        return errorResponse(res, 'No autenticado', 401);
      }

      const slotId = req.params.id as string;
      const { userId } = req.body;

      // Si no se proporciona userId, el usuario se apunta a sí mismo
      const targetUserId = userId || req.user.id;

      const slot = await slotService.assignSlot(
        slotId,
        targetUserId,
        req.user.id,
        req.user.role,
        req.user.clanId
      );

      return successResponse(res, { slot }, 'Usuario asignado al slot correctamente');
    } catch (error: any) {
      logger.error('Error in assignSlot', error);
      return errorResponse(res, error.message || 'Error al asignar slot', 500);
    }
  }

  // POST /api/slots/:id/unassign
  async unassignSlot(req: Request, res: Response) {
    try {
      if (!req.user) {
        return errorResponse(res, 'No autenticado', 401);
      }

      const slotId = req.params.id as string;

      const slot = await slotService.unassignSlot(
        slotId,
        req.user.id,
        req.user.role,
        req.user.clanId
      );

      return successResponse(res, { slot }, 'Usuario desasignado del slot correctamente');
    } catch (error: any) {
      logger.error('Error in unassignSlot', error);
      return errorResponse(res, error.message || 'Error al desasignar slot', 500);
    }
  }

  // POST /api/events/:id/absence
  async markAbsence(req: Request, res: Response) {
    try {
      if (!req.user) {
        return errorResponse(res, 'No autenticado', 401);
      }

      const eventId = req.params.id as string;
      const { reason } = req.body;

      const result = await slotService.markAbsence(eventId, req.user.id, reason);

      return successResponse(res, result, 'Ausencia registrada correctamente');
    } catch (error: any) {
      logger.error('Error in markAbsence', error);
      return errorResponse(res, error.message || 'Error al registrar ausencia', 500);
    }
  }

  // POST /api/events/:id/squads
  async createSquad(req: Request, res: Response) {
    try {
      if (!req.user) {
        return errorResponse(res, 'No autenticado', 401);
      }

      const eventId = req.params.id as string;
      const { name, order, slots } = req.body;

      if (!name || order === undefined || !slots || !Array.isArray(slots)) {
        return errorResponse(res, 'Datos incompletos o inválidos', 400);
      }

      if (slots.length === 0) {
        return errorResponse(res, 'La escuadra debe tener al menos un slot', 400);
      }

      const squad = await slotService.createSquad(eventId, { name, order, slots }, req.user.id);

      return successResponse(res, { squad }, 'Escuadra creada correctamente', 201);
    } catch (error: any) {
      logger.error('Error in createSquad', error);
      return errorResponse(res, error.message || 'Error al crear escuadra', 500);
    }
  }

  // PUT /api/squads/:id
  async updateSquad(req: Request, res: Response) {
    try {
      if (!req.user) {
        return errorResponse(res, 'No autenticado', 401);
      }

      const squadId = req.params.id as string;
      const { name, order } = req.body;

      if (!name && order === undefined) {
        return errorResponse(res, 'Debes proporcionar al menos un campo para actualizar', 400);
      }

      const squad = await slotService.updateSquad(squadId, { name, order }, req.user.id);

      return successResponse(res, { squad }, 'Escuadra actualizada correctamente');
    } catch (error: any) {
      logger.error('Error in updateSquad', error);
      return errorResponse(res, error.message || 'Error al actualizar escuadra', 500);
    }
  }

  // DELETE /api/squads/:id
  async deleteSquad(req: Request, res: Response) {
    try {
      if (!req.user) {
        return errorResponse(res, 'No autenticado', 401);
      }

      const squadId = req.params.id as string;
      const result = await slotService.deleteSquad(squadId, req.user.id);

      return successResponse(res, result, 'Escuadra eliminada correctamente');
    } catch (error: any) {
      logger.error('Error in deleteSquad', error);
      return errorResponse(res, error.message || 'Error al eliminar escuadra', 500);
    }
  }

  // POST /api/squads/:id/slots
  async createSlot(req: Request, res: Response) {
    try {
      if (!req.user) {
        return errorResponse(res, 'No autenticado', 401);
      }

      const squadId = req.params.id as string;
      const { role, order } = req.body;

      if (!role || order === undefined) {
        return errorResponse(res, 'Datos incompletos', 400);
      }

      const slot = await slotService.createSlot(squadId, { role, order }, req.user.id);

      return successResponse(res, { slot }, 'Slot creado correctamente', 201);
    } catch (error: any) {
      logger.error('Error in createSlot', error);
      return errorResponse(res, error.message || 'Error al crear slot', 500);
    }
  }

  // PUT /api/slots/:id
  async updateSlot(req: Request, res: Response) {
    try {
      if (!req.user) {
        return errorResponse(res, 'No autenticado', 401);
      }

      const slotId = req.params.id as string;
      const { role, order } = req.body;

      if (!role && order === undefined) {
        return errorResponse(res, 'Debes proporcionar al menos un campo para actualizar', 400);
      }

      const slot = await slotService.updateSlot(slotId, { role, order }, req.user.id);

      return successResponse(res, { slot }, 'Slot actualizado correctamente');
    } catch (error: any) {
      logger.error('Error in updateSlot', error);
      return errorResponse(res, error.message || 'Error al actualizar slot', 500);
    }
  }

  // DELETE /api/slots/:id
  async deleteSlot(req: Request, res: Response) {
    try {
      if (!req.user) {
        return errorResponse(res, 'No autenticado', 401);
      }

      const slotId = req.params.id as string;
      const result = await slotService.deleteSlot(slotId, req.user.id);

      return successResponse(res, result, 'Slot eliminado correctamente');
    } catch (error: any) {
      logger.error('Error in deleteSlot', error);
      return errorResponse(res, error.message || 'Error al eliminar slot', 500);
    }
  }

  // POST /api/slots/:id/admin-assign
  async adminAssignSlot(req: Request, res: Response) {
    try {
      if (!req.user) {
        return errorResponse(res, 'No autenticado', 401);
      }

      const slotId = req.params.id as string;
      const { userId } = req.body;

      if (!userId) {
        return errorResponse(res, 'userId es obligatorio', 400);
      }

      // Verificar permisos
      const userRole = req.user.role;
      const userClanId = req.user.clanId;

      if (!hasPermission(req.user, PERMISSIONS.SLOT_MANAGE)) {
        return errorResponse(
          res,
          'No tienes permisos para asignar usuarios',
          403
        );
      }

      // Si es líder de clan, verificar que el usuario sea de su clan
      if (userRole !== 'ADMIN') {
        const targetUser = await prisma.user.findUnique({
          where: { id: userId },
          select: { clanId: true },
        });

        if (!targetUser || targetUser.clanId !== userClanId) {
          return errorResponse(
            res,
            'Solo puedes asignar usuarios de tu clan',
            403
          );
        }
      }

      const slot = await slotService.adminAssignSlot(slotId, userId, req.user.id);

      return successResponse(
        res,
        { slot },
        'Usuario asignado al slot correctamente'
      );
    } catch (error: any) {
      logger.error('Error in adminAssignSlot', error);
      return errorResponse(
        res,
        error.message || 'Error al asignar usuario',
        500
      );
    }
  }

  // POST /api/slots/:id/admin-unassign
  async adminUnassignSlot(req: Request, res: Response) {
    try {
      if (!req.user) {
        return errorResponse(res, 'No autenticado', 401);
      }

      const slotId = req.params.id as string;
      const userRole = req.user.role;
      const userClanId = req.user.clanId;

      if (!hasPermission(req.user, PERMISSIONS.SLOT_MANAGE)) {
        return errorResponse(
          res,
          'No tienes permisos para desasignar usuarios',
          403
        );
      }

      // Obtener el slot para verificar el usuario asignado
      const slot = await prisma.slot.findUnique({
        where: { id: slotId },
        include: {
          user: {
            select: {
              id: true,
              clanId: true,
            },
          },
        },
      });

      if (!slot) {
        return errorResponse(res, 'Slot no encontrado', 404);
      }

      if (!slot.userId) {
        return errorResponse(res, 'El slot ya está libre', 400);
      }

      // Si es líder de clan, verificar que el usuario sea de su clan
      if (userRole !== 'ADMIN') {
        if (!slot.user || slot.user.clanId !== userClanId) {
          return errorResponse(
            res,
            'Solo puedes desasignar usuarios de tu clan',
            403
          );
        }
      }

      const updatedSlot = await slotService.adminUnassignSlot(slotId, req.user.id);

      return successResponse(
        res,
        { slot: updatedSlot },
        'Usuario desasignado del slot correctamente'
      );
    } catch (error: any) {
      logger.error('Error in adminUnassignSlot', error);
      return errorResponse(
        res,
        error.message || 'Error al desasignar usuario',
        500
      );
    }
  }

  // PATCH /api/squads/:id/reserve
  async reserveSquad(req: Request, res: Response) {
    try {
      if (!req.user) {
        return errorResponse(res, 'No autenticado', 401);
      }

      const squadId = req.params.id as string;
      const { clanId } = req.body;

      const squad = await prisma.squad.findUnique({
        where: { id: squadId },
        include: {
          reservedForClan: {
            select: { id: true, name: true },
          },
        },
      });

      if (!squad) {
        return errorResponse(res, 'Escuadra no encontrada', 404);
      }

      const userRole = req.user.role;
      const userClanId = req.user.clanId;

      const isAdmin = userRole === 'ADMIN';

      if (!hasPermission(req.user, PERMISSIONS.SLOT_MANAGE)) {
        return errorResponse(
          res,
          'No tienes permisos para reservar escuadras en este evento',
          403
        );
      }

      if (!isAdmin) {
        if (!userClanId) {
          return errorResponse(
            res,
            'Debes pertenecer a un clan para gestionar reservas de escuadra',
            403
          );
        }

        if (clanId) {
          if (clanId !== userClanId) {
            return errorResponse(
              res,
              'Solo puedes reservar escuadras para tu propio clan',
              403
            );
          }
        } else if (squad.reservedForClanId !== userClanId) {
          return errorResponse(
            res,
            'Solo puedes quitar la reserva de una escuadra reservada para tu clan',
            403
          );
        }
      }

      const updatedSquad = await slotService.reserveSquad(
        squadId,
        clanId ?? null,
        req.user.id
      );

      const message = clanId
        ? 'Escuadra reservada para el clan correctamente'
        : 'Reserva de clan eliminada correctamente';

      return successResponse(res, { squad: updatedSquad }, message);
    } catch (error: any) {
      logger.error('Error in reserveSquad', error);
      return errorResponse(
        res,
        error.message || 'Error al reservar escuadra',
        500
      );
    }
  }
}

export const slotController = new SlotController();
