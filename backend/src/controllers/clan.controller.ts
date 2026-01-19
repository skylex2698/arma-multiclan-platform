import { Request, Response } from 'express';
import { clanService } from '../services/clan.service';
import { successResponse, errorResponse } from '../utils/responses';
import { logger } from '../utils/logger';

export class ClanController {
  // GET /api/clans
  async getAllClans(req: Request, res: Response) {
    try {
      const clans = await clanService.getAllClans();
      return successResponse(res, { clans }, 'Clanes obtenidos correctamente');
    } catch (error: any) {
      logger.error('Error in getAllClans', error);
      return errorResponse(res, error.message || 'Error al obtener clanes', 500);
    }
  }

  // GET /api/clans/:id
  async getClanById(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      const clan = await clanService.getClanById(id);
      return successResponse(res, { clan }, 'Clan obtenido correctamente');
    } catch (error: any) {
      logger.error('Error in getClanById', error);
      return errorResponse(res, error.message || 'Error al obtener clan', 404);
    }
  }

  // POST /api/clans
  async createClan(req: Request, res: Response) {
    try {
      const { name, tag, description } = req.body;

      if (!name) {
        return errorResponse(res, 'El nombre del clan es obligatorio', 400);
      }

      if (name.length < 3) {
        return errorResponse(res, 'El nombre debe tener al menos 3 caracteres', 400);
      }

      const clan = await clanService.createClan({
        name: name.trim(),
        tag: tag?.trim(),
        description: description?.trim()
      });

      return successResponse(res, { clan }, 'Clan creado correctamente', 201);
    } catch (error: any) {
      logger.error('Error in createClan', error);
      return errorResponse(res, error.message || 'Error al crear clan', 500);
    }
  }

  // PUT /api/clans/:id
  async updateClan(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      const { name, tag, description } = req.body;

      if (!name && !tag && !description) {
        return errorResponse(res, 'Debes proporcionar al menos un campo para actualizar', 400);
      }

      const clan = await clanService.updateClan(id, {
        name: name?.trim(),
        tag: tag?.trim(),
        description: description?.trim()
      });

      return successResponse(res, { clan }, 'Clan actualizado correctamente');
    } catch (error: any) {
      logger.error('Error in updateClan', error);
      return errorResponse(res, error.message || 'Error al actualizar clan', 500);
    }
  }

  // DELETE /api/clans/:id
  async deleteClan(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      const result = await clanService.deleteClan(id);
      return successResponse(res, result, 'Clan eliminado correctamente');
    } catch (error: any) {
      logger.error('Error in deleteClan', error);
      return errorResponse(res, error.message || 'Error al eliminar clan', 500);
    }
  }

  // GET /api/clans/:id/members
  async getClanMembers(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      const members = await clanService.getClanMembers(id);
      return successResponse(res, { members, count: members.length }, 'Miembros obtenidos correctamente');
    } catch (error: any) {
      logger.error('Error in getClanMembers', error);
      return errorResponse(res, error.message || 'Error al obtener miembros', 500);
    }
  }
}

export const clanController = new ClanController();