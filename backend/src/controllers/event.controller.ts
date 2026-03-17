import { Request, Response } from 'express';
import path from 'path';
import { eventService } from '../services/event.service';
import { successResponse, errorResponse } from '../utils/responses';
import { logger } from '../utils/logger';
import { EventStatus, EventVisibility } from '@prisma/client';
import { prisma } from '../index';
import { validatePdfFile, sanitizeAndValidateModsetHtml, deleteFile } from '../config/multer.config';
import { canManageEventScope, PERMISSIONS } from '../auth/rbac';

const isValidTimezone = (value: string) => {
  try {
    Intl.DateTimeFormat('es-ES', { timeZone: value });
    return true;
  } catch {
    return false;
  }
};

const parseAndValidateScheduledDate = (value: unknown) => {
  const parsedDate = new Date(String(value));

  if (Number.isNaN(parsedDate.getTime())) {
    return { error: 'Fecha del evento inválida' as const };
  }

  if (parsedDate.getTime() < Date.now()) {
    return { error: 'No se puede programar un evento en una fecha pasada' as const };
  }

  return { parsedDate };
};

export class EventController {
  // GET /api/events
  async getAllEvents(req: Request, res: Response) {
    try {
      const { status, gameId, upcoming, includeAll, deleted, search, page, limit } = req.query;

      if (deleted === 'true') {
        const userRole = req.user?.role;
        if (userRole !== 'ADMIN' && userRole !== 'CLAN_LEADER') {
          return errorResponse(res, 'No tienes permisos para ver eventos eliminados', 403);
        }
      }

      const result = await eventService.getAllEvents({
        status: status as EventStatus,
        gameId: gameId as string | undefined,
        upcoming: upcoming === 'true',
        includeAll: includeAll === 'true',
        deleted: deleted === 'true',
        search: search as string,
        page: page ? parseInt(page as string, 10) : 1,
        limit: limit ? parseInt(limit as string, 10) : 12,
        requesterRole: req.user?.role,
        requesterClanId: req.user?.clanId,
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
      const includeDeleted = req.query.deleted === 'true';

      if (includeDeleted) {
        const userRole = req.user?.role;
        if (userRole !== 'ADMIN' && userRole !== 'CLAN_LEADER') {
          return errorResponse(res, 'No tienes permisos para ver eventos eliminados', 403);
        }
      }

      const event = await eventService.getEventById(id, {
        deleted: includeDeleted,
        requesterRole: req.user?.role,
        requesterClanId: req.user?.clanId,
      });
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

      const {
        name,
        description,
        briefing,
        gameId,
        scheduledDate,
        timezone,
        visibility,
        invitedClanIds,
        squads,
        serverName,
        serverIp,
        serverPort,
        serverPassword,
      } = req.body;

      // Validaciones
      if (!name || !gameId || !scheduledDate || !squads || !Array.isArray(squads)) {
        return errorResponse(res, 'Datos incompletos o inválidos', 400);
      }

      if (squads.length === 0) {
        return errorResponse(res, 'Debes crear al menos una escuadra', 400);
      }

      if (timezone && !isValidTimezone(String(timezone))) {
        return errorResponse(res, 'Timezone inválido', 400);
      }

      if (
        visibility !== undefined &&
        visibility !== EventVisibility.PUBLIC &&
        visibility !== EventVisibility.PRIVATE
      ) {
        return errorResponse(res, 'Visibilidad inválida', 400);
      }

      if (
        invitedClanIds !== undefined &&
        (!Array.isArray(invitedClanIds) || invitedClanIds.some((clanId) => typeof clanId !== 'string'))
      ) {
        return errorResponse(res, 'Invitaciones de clan inválidas', 400);
      }

      const scheduledDateValidation = parseAndValidateScheduledDate(scheduledDate);
      if (scheduledDateValidation.error) {
        return errorResponse(res, scheduledDateValidation.error, 400);
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
        gameId,
        scheduledDate: scheduledDateValidation.parsedDate,
        timezone: timezone ? String(timezone) : 'UTC',
        creatorId: req.user.id,
        visibility: visibility as EventVisibility | undefined,
        invitedClanIds: invitedClanIds as string[] | undefined,
        serverName,
        serverIp,
        serverPort,
        serverPassword,
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

      const { templateEventId, name, description, briefing, scheduledDate, timezone } = req.body;

      if (!templateEventId || !name || !scheduledDate) {
        return errorResponse(res, 'Datos incompletos', 400);
      }

      if (timezone && !isValidTimezone(String(timezone))) {
        return errorResponse(res, 'Timezone inválido', 400);
      }

      const scheduledDateValidation = parseAndValidateScheduledDate(scheduledDate);
      if (scheduledDateValidation.error) {
        return errorResponse(res, scheduledDateValidation.error, 400);
      }

      const event = await eventService.createEventFromTemplate({
        templateEventId,
        name,
        description,
        briefing,
        scheduledDate: scheduledDateValidation.parsedDate,
        timezone: timezone ? String(timezone) : undefined,
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

      const isCreator = event.creatorId === userId;
      const isAdmin = userRole === 'ADMIN';
      const canManageByClan = canManageEventScope(
        req.user,
        event.creator?.clanId,
        PERMISSIONS.EVENT_EDIT
      );

      if (!isCreator && !isAdmin && !canManageByClan) {
        return errorResponse(res, 'No tienes permisos para editar este evento', 403);
      }

      if (data.timezone !== undefined && !isValidTimezone(String(data.timezone))) {
        return errorResponse(res, 'Timezone inválido', 400);
      }

      if (
        data.visibility !== undefined &&
        data.visibility !== EventVisibility.PUBLIC &&
        data.visibility !== EventVisibility.PRIVATE
      ) {
        return errorResponse(res, 'Visibilidad inválida', 400);
      }

      if (
        data.invitedClanIds !== undefined &&
        (!Array.isArray(data.invitedClanIds) ||
          data.invitedClanIds.some((clanId: unknown) => typeof clanId !== 'string'))
      ) {
        return errorResponse(res, 'Invitaciones de clan inválidas', 400);
      }

      if (data.scheduledDate !== undefined) {
        const scheduledDateValidation = parseAndValidateScheduledDate(data.scheduledDate);
        if (scheduledDateValidation.error) {
          return errorResponse(res, scheduledDateValidation.error, 400);
        }

        data.scheduledDate = scheduledDateValidation.parsedDate;
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

  // PATCH /api/events/:id/restore
  async restoreEvent(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      const userId = req.user!.id;
      const userRole = req.user!.role;
      const userClanId = req.user!.clanId;

      // Buscar el evento eliminado (escape hatch del middleware)
      const event = await prisma.event.findFirst({
        where: { id, deletedAt: { not: null } },
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
        return errorResponse(res, 'Evento eliminado no encontrado', 404);
      }

      // Verificar permisos (mismo patrón que deleteEvent):
      // - Admin puede restaurar cualquier evento
      // - Creador puede restaurar su propio evento
      // - Líder de clan puede restaurar eventos de su clan
      const isAdmin = userRole === 'ADMIN';
      const isCreator = event.creatorId === userId;
      const isClanLeader =
        userRole === 'CLAN_LEADER' &&
        userClanId === event.creator?.clanId;

      if (!isAdmin && !isCreator && !isClanLeader) {
        return errorResponse(
          res,
          'No tienes permisos para restaurar este evento',
          403
        );
      }

      const restoredEvent = await eventService.restoreEvent(id);

      return successResponse(res, { event: restoredEvent }, 'Evento restaurado correctamente');
    } catch (error: any) {
      logger.error('Error in restoreEvent', error);
      return errorResponse(
        res,
        error.message || 'Error al restaurar evento',
        500
      );
    }
  }

  // PUT /api/events/:id/status
  async changeEventStatus(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      const { status } = req.body;
      const userId = req.user!.id;
      const userRole = req.user!.role;
      const userClanId = req.user!.clanId;

      if (!status) {
        return errorResponse(res, 'El estado es requerido', 400);
      }

      // Validar que sea un estado válido
      if (!['ACTIVE', 'INACTIVE'].includes(status)) {
        return errorResponse(res, 'Estado no válido', 400);
      }

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

      // Verificar que no esté finalizado
      if (event.status === 'FINISHED') {
        return errorResponse(res, 'No se puede modificar el estado de un evento finalizado', 403);
      }

      const isAdmin = userRole === 'ADMIN';
      const canManageByClan = canManageEventScope(
        req.user,
        event.creator?.clanId,
        PERMISSIONS.EVENT_STATUS_MANAGE
      );

      if (!isAdmin && !canManageByClan) {
        return errorResponse(
          res,
          'No tienes permisos para cambiar el estado de este evento',
          403
        );
      }

      const updatedEvent = await eventService.changeEventStatus(id, status as EventStatus);

      return successResponse(
        res,
        { event: updatedEvent },
        `Evento ${status === 'ACTIVE' ? 'activado' : 'desactivado'} correctamente`
      );
    } catch (error: any) {
      logger.error('Error in changeEventStatus', error);
      return errorResponse(
        res,
        error.message || 'Error al cambiar estado del evento',
        500
      );
    }
  }

  async getEventSlotlist(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      const slotlist = await eventService.getEventSlotlist(id);
      return successResponse(res, slotlist, 'Slotlist obtenida correctamente');
    } catch (error: any) {
      logger.error('Error in getEventSlotlist', error);
      return errorResponse(res, error.message || 'Error al obtener slotlist', 500);
    }
  }

  async getEventWhitelist(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      const format = String(req.query.format || 'json').toLowerCase();
      const whitelist = await eventService.getEventWhitelist(id);

      if (format === 'txt') {
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        return res.status(200).send(whitelist.content);
      }

      return successResponse(res, whitelist, 'Whitelist obtenida correctamente');
    } catch (error: any) {
      logger.error('Error in getEventWhitelist', error);
      return errorResponse(res, error.message || 'Error al obtener whitelist', 500);
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
      const canManageByClan = canManageEventScope(
        req.user,
        event.creator?.clanId,
        PERMISSIONS.EVENT_FILES_MANAGE
      );

      if (!isCreator && !isAdmin && !canManageByClan) {
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
      const canManageByClan = canManageEventScope(
        req.user,
        event.creator?.clanId,
        PERMISSIONS.EVENT_FILES_MANAGE
      );

      if (!isCreator && !isAdmin && !canManageByClan) {
        return errorResponse(res, 'No tienes permisos para modificar este evento', 403);
      }

      if (!req.file) {
        return errorResponse(res, 'No se proporcionó ningún archivo', 400);
      }

      // Sanitizar y validar que sea un preset HTML de Arma 3
      const filePath = path.join(process.cwd(), 'public', 'uploads', 'events', req.file.filename);
      const htmlResult = await sanitizeAndValidateModsetHtml(filePath);

      if (!htmlResult.valid) {
        deleteFile(filePath);
        return errorResponse(
          res,
          htmlResult.reason || 'El archivo no es un HTML válido de preset de Arma 3',
          400
        );
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
      const canManageByClan = canManageEventScope(
        req.user,
        event.creator?.clanId,
        PERMISSIONS.EVENT_FILES_MANAGE
      );

      if (!isCreator && !isAdmin && !canManageByClan) {
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
      const canManageByClan = canManageEventScope(
        req.user,
        event.creator?.clanId,
        PERMISSIONS.EVENT_FILES_MANAGE
      );

      if (!isCreator && !isAdmin && !canManageByClan) {
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
  // GET /api/events/public/:token
  async getPublicEvent(req: Request, res: Response) {
    try {
      const token = req.params.token as string;
      const event = await eventService.getEventByShareToken(token);
      return successResponse(res, { event }, 'Evento público obtenido correctamente');
    } catch (error: any) {
      logger.error('Error in getPublicEvent', error);
      return errorResponse(res, error.message || 'Error al obtener evento público', 404);
    }
  }

  // POST /api/events/:id/share-token (cualquier usuario autenticado)
  async generateShareToken(req: Request, res: Response) {
    try {
      if (!req.user) {
        return errorResponse(res, 'No autenticado', 401);
      }

      const eventId = req.params.id as string;

      const token = await eventService.generateShareToken(eventId);

      return successResponse(res, { token }, 'Token de compartir generado correctamente');
    } catch (error: any) {
      logger.error('Error in generateShareToken', error);
      return errorResponse(res, error.message || 'Error al generar token de compartir', 500);
    }
  }
}

export const eventController = new EventController();
