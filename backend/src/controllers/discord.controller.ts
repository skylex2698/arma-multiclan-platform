import { Request, Response } from 'express';
import { discordService } from '../services/discord.service';
import { successResponse, errorResponse } from '../utils/responses';
import { logger } from '../utils/logger';

export class DiscordController {
  // GET /api/discord/me - Obtener info del usuario de Discord
  async getMe(req: Request, res: Response) {
    try {
      if (!req.user) {
        return errorResponse(res, 'No autenticado', 401);
      }

      const accessToken = await discordService.getValidAccessToken(req.user.id);

      if (!accessToken) {
        return errorResponse(
          res,
          'No hay cuenta de Discord vinculada o el token ha expirado. Por favor, vuelve a vincular tu cuenta.',
          403
        );
      }

      const discordUser = await discordService.fetchDiscordUser(accessToken);

      return successResponse(res, { discordUser }, 'Información de Discord obtenida');
    } catch (error: any) {
      logger.error('Error in getMe (Discord)', error);
      return errorResponse(res, error.message || 'Error al obtener información de Discord', 500);
    }
  }

  // GET /api/discord/me/connections - Obtener conexiones del usuario
  async getConnections(req: Request, res: Response) {
    try {
      if (!req.user) {
        return errorResponse(res, 'No autenticado', 401);
      }

      const accessToken = await discordService.getValidAccessToken(req.user.id);

      if (!accessToken) {
        return errorResponse(
          res,
          'No hay cuenta de Discord vinculada. Scope requerido: connections',
          403
        );
      }

      const connections = await discordService.fetchUserConnections(accessToken);

      return successResponse(res, { connections }, 'Conexiones obtenidas');
    } catch (error: any) {
      logger.error('Error in getConnections (Discord)', error);

      if (error.message.includes('403')) {
        return errorResponse(
          res,
          'Permisos insuficientes. Necesitas re-consentir con el scope "connections". Visita /api/auth/discord/link/start',
          403
        );
      }

      return errorResponse(res, error.message || 'Error al obtener conexiones', 500);
    }
  }

  // GET /api/discord/me/guilds - Obtener guilds del usuario
  async getGuilds(req: Request, res: Response) {
    try {
      if (!req.user) {
        return errorResponse(res, 'No autenticado', 401);
      }

      const accessToken = await discordService.getValidAccessToken(req.user.id);

      if (!accessToken) {
        return errorResponse(
          res,
          'No hay cuenta de Discord vinculada. Scope requerido: guilds',
          403
        );
      }

      const guilds = await discordService.fetchUserGuilds(accessToken);

      return successResponse(res, { guilds }, 'Guilds obtenidos');
    } catch (error: any) {
      logger.error('Error in getGuilds (Discord)', error);

      if (error.message.includes('403')) {
        return errorResponse(
          res,
          'Permisos insuficientes. Necesitas re-consentir con el scope "guilds". Visita /api/auth/discord/link/start',
          403
        );
      }

      return errorResponse(res, error.message || 'Error al obtener guilds', 500);
    }
  }
}

export const discordController = new DiscordController();
