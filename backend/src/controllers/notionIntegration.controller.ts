import { Request, Response } from 'express';
import { notionIntegrationService } from '../services/notionIntegration.service';
import { errorResponse, successResponse } from '../utils/responses';
import { logger } from '../utils/logger';
import { NotionSyncMode } from '@prisma/client';

class NotionIntegrationController {
  async getClanIntegration(req: Request, res: Response) {
    try {
      const clanId = req.params.id as string;
      const integration = await notionIntegrationService.getClanIntegration(clanId);

      return successResponse(
        res,
        { integration },
        'Configuración de Notion obtenida correctamente'
      );
    } catch (error: any) {
      logger.error('Error in getClanIntegration', error);
      return errorResponse(
        res,
        error.message || 'Error al obtener la configuración de Notion',
        500
      );
    }
  }

  async saveClanIntegration(req: Request, res: Response) {
    try {
      if (!req.user) {
        return errorResponse(res, 'No autenticado', 401);
      }

      const clanId = req.params.id as string;
      const {
        enabled,
        token,
        parentPageId,
        syncMode,
      } = req.body;

      if (typeof enabled !== 'boolean') {
        return errorResponse(res, 'El flag enabled es requerido', 400);
      }

      if (
        syncMode !== undefined &&
        syncMode !== NotionSyncMode.MANUAL &&
        syncMode !== NotionSyncMode.AUTO
      ) {
        return errorResponse(res, 'Modo de sincronización inválido', 400);
      }

      const integration = await notionIntegrationService.saveClanIntegration(
        clanId,
        {
          enabled,
          token,
          parentPageId,
          syncMode,
        },
        req.user.id
      );

      return successResponse(
        res,
        { integration },
        'Configuración de Notion guardada correctamente'
      );
    } catch (error: any) {
      logger.error('Error in saveClanIntegration', error);
      return errorResponse(
        res,
        error.message || 'Error al guardar la configuración de Notion',
        500
      );
    }
  }

  async testConnection(req: Request, res: Response) {
    try {
      const clanId = req.params.id as string;
      const { token, parentPageId } = req.body as { token?: string; parentPageId?: string };
      const result = await notionIntegrationService.testConnection({
        clanId,
        token,
        parentPageId,
      });

      return successResponse(res, result, 'Conexión con Notion verificada correctamente');
    } catch (error: any) {
      logger.error('Error in testConnection', error);
      return errorResponse(
        res,
        error.message || 'No se pudo verificar la conexión con Notion',
        500
      );
    }
  }

  async syncEventParticipations(req: Request, res: Response) {
    try {
      if (!req.user) {
        return errorResponse(res, 'No autenticado', 401);
      }

      const eventId = req.params.id as string;
      const summary = await notionIntegrationService.syncEventParticipations(eventId, req.user.id);

      return successResponse(
        res,
        summary,
        'Sincronización con Notion ejecutada correctamente'
      );
    } catch (error: any) {
      logger.error('Error in syncEventParticipations', error);
      return errorResponse(
        res,
        error.message || 'Error al sincronizar participaciones con Notion',
        500
      );
    }
  }
}

export const notionIntegrationController = new NotionIntegrationController();
