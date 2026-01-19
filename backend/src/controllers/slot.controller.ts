import { Request, Response } from 'express';
import { slotService } from '../services/slot.service';
import { successResponse, errorResponse } from '../utils/responses';
import { logger } from '../utils/logger';

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
}

export const slotController = new SlotController();