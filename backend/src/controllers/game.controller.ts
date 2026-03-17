import { Request, Response } from 'express';
import { GameIdentityMode, GameStatus } from '@prisma/client';
import { gameService } from '../services/game.service';
import { successResponse, errorResponse } from '../utils/responses';
import { logger } from '../utils/logger';

const normalizeSlug = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

export class GameController {
  async getGames(req: Request, res: Response) {
    try {
      const { status, includeInactive } = req.query;
      const games = await gameService.getGames({
        status: status as GameStatus | undefined,
        includeInactive: includeInactive === 'true',
      });

      return successResponse(res, { games }, 'Juegos obtenidos correctamente');
    } catch (error: any) {
      logger.error('Error in getGames', error);
      return errorResponse(res, error.message || 'Error al obtener juegos', 500);
    }
  }

  async createGame(req: Request, res: Response) {
    try {
      const { slug, name, status, supportsModsetHtml, identityMode, identityLabel, sortOrder } =
        req.body;

      if (!name) {
        return errorResponse(res, 'El nombre del juego es obligatorio', 400);
      }

      const game = await gameService.createGame({
        slug: normalizeSlug(slug || name),
        name: name.trim(),
        status,
        supportsModsetHtml,
        identityMode: identityMode as GameIdentityMode | undefined,
        identityLabel,
        sortOrder,
      });

      return successResponse(res, { game }, 'Juego creado correctamente', 201);
    } catch (error: any) {
      logger.error('Error in createGame', error);
      return errorResponse(res, error.message || 'Error al crear juego', 500);
    }
  }

  async updateGame(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      const { slug, name, status, supportsModsetHtml, identityMode, identityLabel, sortOrder } =
        req.body;

      const game = await gameService.updateGame(id, {
        ...(typeof slug === 'string' ? { slug: normalizeSlug(slug) } : {}),
        ...(name !== undefined ? { name: name.trim() } : {}),
        status,
        supportsModsetHtml,
        identityMode: identityMode as GameIdentityMode | undefined,
        identityLabel,
        sortOrder,
      });

      return successResponse(res, { game }, 'Juego actualizado correctamente');
    } catch (error: any) {
      logger.error('Error in updateGame', error);
      return errorResponse(res, error.message || 'Error al actualizar juego', 500);
    }
  }

  async deleteGame(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      const game = await gameService.deleteGame(id);

      return successResponse(res, { game }, 'Juego eliminado correctamente');
    } catch (error: any) {
      logger.error('Error in deleteGame', error);
      return errorResponse(res, error.message || 'Error al eliminar juego', 500);
    }
  }
}

export const gameController = new GameController();
