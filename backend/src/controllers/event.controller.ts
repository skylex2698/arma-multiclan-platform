import { Request, Response } from 'express';
import { eventService } from '../services/event.service';
import { successResponse, errorResponse } from '../utils/responses';
import { logger } from '../utils/logger';
import { EventStatus, GameType } from '@prisma/client';

export class EventController {
  // GET /api/events
  async getAllEvents(req: Request, res: Response) {
    try {
      const { status, gameType, upcoming } = req.query;

      const events = await eventService.getAllEvents({
        status: status as EventStatus,
        gameType: gameType as GameType,
        upcoming: upcoming === 'true'
      });

      return successResponse(res, { events, count: events.length }, 'Eventos obtenidos correctamente');
    } catch (error: any) {
      logger.error('Error in getAllEvents', error);
      return errorResponse(res, error.message || 'Error al obtener eventos', 500);
    }
  }

  // GET /api/events/:id
  async getEventById(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      const event = await eventService.getEventById(id);
      return successResponse(res, { event }, 'Evento obtenido correctamente');
    } catch (error: any) {
      logger.error('Error in getEventById', error);
      return errorResponse(res, error.message || 'Error al obtener evento', 404);
    }
  }

  // POST /api/events
  async createEvent(req: Request, res: Response) {
    try {
      if (!req.user) {
        return errorResponse(res, 'No autenticado', 401);
      }

      const { name, description, briefing, gameType, scheduledDate, squads } = req.body;

      // Validaciones
      if (!name || !gameType || !scheduledDate || !squads || !Array.isArray(squads)) {
        return errorResponse(res, 'Datos incompletos o inválidos', 400);
      }

      if (squads.length === 0) {
        return errorResponse(res, 'Debes crear al menos una escuadra', 400);
      }

      // Validar que todas las escuadras tengan slots
      for (const squad of squads) {
        if (!squad.slots || squad.slots.length === 0) {
          return errorResponse(res, `La escuadra "${squad.name}" debe tener al menos un slot`, 400);
        }
      }

      const event = await eventService.createEvent({
        name,
        description,
        briefing,
        gameType,
        scheduledDate: new Date(scheduledDate),
        creatorId: req.user.id,
        squads
      });

      return successResponse(res, { event }, 'Evento creado correctamente', 201);
    } catch (error: any) {
      logger.error('Error in createEvent', error);
      return errorResponse(res, error.message || 'Error al crear evento', 500);
    }
  }

  // POST /api/events/from-template
  async createEventFromTemplate(req: Request, res: Response) {
    try {
      if (!req.user) {
        return errorResponse(res, 'No autenticado', 401);
      }

      const { templateEventId, name, description, briefing, scheduledDate } = req.body;

      if (!templateEventId || !name || !scheduledDate) {
        return errorResponse(res, 'Datos incompletos', 400);
      }

      const event = await eventService.createEventFromTemplate({
        templateEventId,
        name,
        description,
        briefing,
        scheduledDate: new Date(scheduledDate),
        creatorId: req.user.id
      });

      return successResponse(res, { event }, 'Evento creado desde plantilla correctamente', 201);
    } catch (error: any) {
      logger.error('Error in createEventFromTemplate', error);
      return errorResponse(res, error.message || 'Error al crear evento desde plantilla', 500);
    }
  }

  // PUT /api/events/:id
  async updateEvent(req: Request, res: Response) {
    try {
      if (!req.user) {
        return errorResponse(res, 'No autenticado', 401);
      }

      const id = req.params.id as string;
      const { name, description, briefing, scheduledDate } = req.body;

      if (!name && !description && !briefing && !scheduledDate) {
        return errorResponse(res, 'Debes proporcionar al menos un campo para actualizar', 400);
      }

      const event = await eventService.updateEvent(
        id,
        {
          name,
          description,
          briefing,
          scheduledDate: scheduledDate ? new Date(scheduledDate) : undefined
        },
        req.user.id
      );

      return successResponse(res, { event }, 'Evento actualizado correctamente');
    } catch (error: any) {
      logger.error('Error in updateEvent', error);
      return errorResponse(res, error.message || 'Error al actualizar evento', 500);
    }
  }

  // PUT /api/events/:id/status
  async changeEventStatus(req: Request, res: Response) {
    try {
      if (!req.user) {
        return errorResponse(res, 'No autenticado', 401);
      }

      const id = req.params.id as string;
      const { status } = req.body;

      if (!status || !Object.values(EventStatus).includes(status)) {
        return errorResponse(res, 'Estado inválido', 400);
      }

      const event = await eventService.changeEventStatus(id, status, req.user.id);

      return successResponse(res, { event }, 'Estado del evento actualizado correctamente');
    } catch (error: any) {
      logger.error('Error in changeEventStatus', error);
      return errorResponse(res, error.message || 'Error al cambiar estado del evento', 500);
    }
  }

  // DELETE /api/events/:id
  async deleteEvent(req: Request, res: Response) {
    try {
      if (!req.user) {
        return errorResponse(res, 'No autenticado', 401);
      }

      const id = req.params.id as string;
      const result = await eventService.deleteEvent(id, req.user.id);

      return successResponse(res, result, 'Evento eliminado correctamente');
    } catch (error: any) {
      logger.error('Error in deleteEvent', error);
      return errorResponse(res, error.message || 'Error al eliminar evento', 500);
    }
  }
}

export const eventController = new EventController();