import { Request, Response } from 'express';
import path from 'path';
import { eventService } from '../services/event.service';
import { successResponse, errorResponse } from '../utils/responses';
import { logger } from '../utils/logger';
import { EventStatus, GameType } from '@prisma/client';
import { prisma } from '../index';
import { validatePdfFile, validateHtmlFile, deleteFile } from '../config/multer.config';

export class EventController {
  // GET /api/events
  async getAllEvents(req: Request, res: Response) {
    try {
      const { status, gameType, upcoming, includeAll, search, page, limit } = req.query;

      const result = await eventService.getAllEvents({
        status: status as EventStatus,
        gameType: gameType as GameType,
        upcoming: upcoming === 'true',
        includeAll: includeAll === 'true',
        search: search as string,
        page: page ? parseInt(page as string, 10) : 1,
        limit: limit ? parseInt(limit as string, 10) : 12,
      });

      return successResponse(res, {
        events: result.events,
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      }, 'Eventos obtenidos correctamente');
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
      const id = req.params.id as string; // <-- ARREGLADO
      const data = req.body;
      const userId = req.user!.id;
      const userRole = req.user!.role;

      // Obtener el evento para verificar permisos
      const event = await prisma.event.findUnique({
        where: { id },
        include: {
          creator: {
            select: {
              id: true,
              clanId: true,
            },
          },
        },
      });

      if (!event) {
        return errorResponse(res, 'Evento no encontrado', 404);
      }

      // Verificar permisos
      const isCreator = event.creatorId === userId;
      const isAdmin = userRole === 'ADMIN';
      const isClanLeader =
        userRole === 'CLAN_LEADER' &&
        req.user!.clanId === event.creator?.clanId;

      if (!isCreator && !isAdmin && !isClanLeader) {
        return errorResponse(res, 'No tienes permisos para editar este evento', 403);
      }

      // Actualizar evento
      const updatedEvent = await eventService.updateEvent(id, data, userId); // <-- ARREGLADO: agregar userId

      return successResponse(res, { event: updatedEvent }, 'Evento actualizado exitosamente');
    } catch (error: any) {
      logger.error('Error in updateEvent', error);
      return errorResponse(
        res,
        error.message || 'Error al actualizar evento',
        500
      );
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

      const event = await eventService.changeEventStatus(
        id,
        status,
        req.user.id,
        req.user.role,
        req.user.clanId || undefined
      );

      return successResponse(res, { event }, 'Estado del evento actualizado correctamente');
    } catch (error: any) {
      logger.error('Error in changeEventStatus', error);
      return errorResponse(res, error.message || 'Error al cambiar estado del evento', 400);
    }
  }

  // DELETE /api/events/:id
  async deleteEvent(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      const userId = req.user!.id;
      const userRole = req.user!.role;
      const userClanId = req.user!.clanId;

      // Obtener el evento para verificar permisos
      const event = await prisma.event.findUnique({
        where: { id },
        include: {
          creator: {
            select: {
              id: true,
              clanId: true,
            },
          },
        },
      });

      if (!event) {
        return errorResponse(res, 'Evento no encontrado', 404);
      }

      // Verificar permisos:
      // - Admin puede eliminar cualquier evento
      // - Creador puede eliminar su propio evento
      // - Líder de clan puede eliminar eventos de su clan
      const isAdmin = userRole === 'ADMIN';
      const isCreator = event.creatorId === userId;
      const isClanLeader =
        userRole === 'CLAN_LEADER' &&
        userClanId === event.creator?.clanId;

      if (!isAdmin && !isCreator && !isClanLeader) {
        return errorResponse(
          res,
          'No tienes permisos para eliminar este evento',
          403
        );
      }

      await eventService.deleteEvent(id);

      return successResponse(res, {}, 'Evento eliminado exitosamente');
    } catch (error: any) {
      logger.error('Error in deleteEvent', error);
      return errorResponse(
        res,
        error.message || 'Error al eliminar evento',
        500
      );
    }
  }

  // POST /api/events/:id/briefing-file
  async uploadBriefingFile(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      const userId = req.user!.id;
      const userRole = req.user!.role;

      // Verificar que el evento existe y permisos
      const event = await prisma.event.findUnique({
        where: { id },
        include: {
          creator: {
            select: { id: true, clanId: true },
          },
        },
      });

      if (!event) {
        return errorResponse(res, 'Evento no encontrado', 404);
      }

      if (event.status === 'FINISHED') {
        return errorResponse(res, 'No se puede modificar un evento finalizado', 403);
      }

      // Verificar permisos
      const isCreator = event.creatorId === userId;
      const isAdmin = userRole === 'ADMIN';
      const isClanLeader = userRole === 'CLAN_LEADER' && req.user!.clanId === event.creator?.clanId;

      if (!isCreator && !isAdmin && !isClanLeader) {
        return errorResponse(res, 'No tienes permisos para modificar este evento', 403);
      }

      if (!req.file) {
        return errorResponse(res, 'No se proporcionó ningún archivo', 400);
      }

      // Validar que sea PDF real
      const filePath = path.join(process.cwd(), 'public', 'uploads', 'events', req.file.filename);
      const isValidPdf = await validatePdfFile(filePath);

      if (!isValidPdf) {
        deleteFile(filePath);
        return errorResponse(res, 'El archivo no es un PDF válido', 400);
      }

      // Eliminar archivo anterior si existe
      if (event.briefingFileUrl) {
        const oldFilePath = path.join(process.cwd(), 'public', event.briefingFileUrl);
        deleteFile(oldFilePath);
      }

      // Actualizar evento con la URL del archivo
      const briefingFileUrl = `/uploads/events/${req.file.filename}`;
      const updatedEvent = await prisma.event.update({
        where: { id },
        data: { briefingFileUrl },
      });

      logger.info('Briefing file uploaded', { eventId: id, userId });

      return successResponse(res, {
        event: updatedEvent,
        briefingFileUrl
      }, 'Archivo de briefing subido correctamente');
    } catch (error: any) {
      logger.error('Error in uploadBriefingFile', error);
      return errorResponse(res, error.message || 'Error al subir archivo de briefing', 500);
    }
  }

  // POST /api/events/:id/modset-file
  async uploadModsetFile(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      const userId = req.user!.id;
      const userRole = req.user!.role;

      // Verificar que el evento existe y permisos
      const event = await prisma.event.findUnique({
        where: { id },
        include: {
          creator: {
            select: { id: true, clanId: true },
          },
        },
      });

      if (!event) {
        return errorResponse(res, 'Evento no encontrado', 404);
      }

      if (event.status === 'FINISHED') {
        return errorResponse(res, 'No se puede modificar un evento finalizado', 403);
      }

      // Verificar permisos
      const isCreator = event.creatorId === userId;
      const isAdmin = userRole === 'ADMIN';
      const isClanLeader = userRole === 'CLAN_LEADER' && req.user!.clanId === event.creator?.clanId;

      if (!isCreator && !isAdmin && !isClanLeader) {
        return errorResponse(res, 'No tienes permisos para modificar este evento', 403);
      }

      if (!req.file) {
        return errorResponse(res, 'No se proporcionó ningún archivo', 400);
      }

      // Validar que sea HTML válido
      const filePath = path.join(process.cwd(), 'public', 'uploads', 'events', req.file.filename);
      const isValidHtml = await validateHtmlFile(filePath);

      if (!isValidHtml) {
        deleteFile(filePath);
        return errorResponse(res, 'El archivo no es un HTML válido', 400);
      }

      // Eliminar archivo anterior si existe
      if (event.modsetFileUrl) {
        const oldFilePath = path.join(process.cwd(), 'public', event.modsetFileUrl);
        deleteFile(oldFilePath);
      }

      // Actualizar evento con la URL del archivo
      const modsetFileUrl = `/uploads/events/${req.file.filename}`;
      const updatedEvent = await prisma.event.update({
        where: { id },
        data: { modsetFileUrl },
      });

      logger.info('Modset file uploaded', { eventId: id, userId });

      return successResponse(res, {
        event: updatedEvent,
        modsetFileUrl
      }, 'Archivo de modset subido correctamente');
    } catch (error: any) {
      logger.error('Error in uploadModsetFile', error);
      return errorResponse(res, error.message || 'Error al subir archivo de modset', 500);
    }
  }

  // DELETE /api/events/:id/briefing-file
  async deleteBriefingFile(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      const userId = req.user!.id;
      const userRole = req.user!.role;

      const event = await prisma.event.findUnique({
        where: { id },
        include: {
          creator: {
            select: { id: true, clanId: true },
          },
        },
      });

      if (!event) {
        return errorResponse(res, 'Evento no encontrado', 404);
      }

      if (event.status === 'FINISHED') {
        return errorResponse(res, 'No se puede modificar un evento finalizado', 403);
      }

      // Verificar permisos
      const isCreator = event.creatorId === userId;
      const isAdmin = userRole === 'ADMIN';
      const isClanLeader = userRole === 'CLAN_LEADER' && req.user!.clanId === event.creator?.clanId;

      if (!isCreator && !isAdmin && !isClanLeader) {
        return errorResponse(res, 'No tienes permisos para modificar este evento', 403);
      }

      if (event.briefingFileUrl) {
        const filePath = path.join(process.cwd(), 'public', event.briefingFileUrl);
        deleteFile(filePath);
      }

      await prisma.event.update({
        where: { id },
        data: { briefingFileUrl: null },
      });

      logger.info('Briefing file deleted', { eventId: id, userId });

      return successResponse(res, {}, 'Archivo de briefing eliminado');
    } catch (error: any) {
      logger.error('Error in deleteBriefingFile', error);
      return errorResponse(res, error.message || 'Error al eliminar archivo', 500);
    }
  }

  // DELETE /api/events/:id/modset-file
  async deleteModsetFile(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      const userId = req.user!.id;
      const userRole = req.user!.role;

      const event = await prisma.event.findUnique({
        where: { id },
        include: {
          creator: {
            select: { id: true, clanId: true },
          },
        },
      });

      if (!event) {
        return errorResponse(res, 'Evento no encontrado', 404);
      }

      if (event.status === 'FINISHED') {
        return errorResponse(res, 'No se puede modificar un evento finalizado', 403);
      }

      // Verificar permisos
      const isCreator = event.creatorId === userId;
      const isAdmin = userRole === 'ADMIN';
      const isClanLeader = userRole === 'CLAN_LEADER' && req.user!.clanId === event.creator?.clanId;

      if (!isCreator && !isAdmin && !isClanLeader) {
        return errorResponse(res, 'No tienes permisos para modificar este evento', 403);
      }

      if (event.modsetFileUrl) {
        const filePath = path.join(process.cwd(), 'public', event.modsetFileUrl);
        deleteFile(filePath);
      }

      await prisma.event.update({
        where: { id },
        data: { modsetFileUrl: null },
      });

      logger.info('Modset file deleted', { eventId: id, userId });

      return successResponse(res, {}, 'Archivo de modset eliminado');
    } catch (error: any) {
      logger.error('Error in deleteModsetFile', error);
      return errorResponse(res, error.message || 'Error al eliminar archivo', 500);
    }
  }
}

export const eventController = new EventController();