import { Request, Response } from 'express';
import { clanService } from '../services/clan.service';
import { prisma } from '../config/database';
import path from 'path';
import fs from 'fs';

const handleError = (res: Response, error: unknown) => {
  if (error instanceof Error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
  return res.status(500).json({
    success: false,
    message: 'Error interno del servidor',
  });
};

class ClanController {
  async getAll(req: Request, res: Response) {
    try {
      const clans = await clanService.getAllClans();
      return res.status(200).json({
        success: true,
        data: clans,
      });
    } catch (error) {
      handleError(res, error);
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const clan = await clanService.getClanById(id as string);

      return res.status(200).json({
        success: true,
        data: { clan },
      });
    } catch (error) {
      handleError(res, error);
    }
  }

  async getMembers(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const members = await clanService.getClanMembers(id as string);

      return res.status(200).json({
        success: true,
        data: members,
      });
    } catch (error) {
      handleError(res, error);
    }
  }

  async create(req: Request, res: Response) {
    try {
      const data = req.body;
      const clan = await clanService.createClan(data);

      return res.status(201).json({
        success: true,
        message: 'Clan creado exitosamente',
        data: { clan },
      });
    } catch (error) {
      handleError(res, error);
    }
  }

  async updateClan(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const data = req.body;
      const userId = req.user!.id;
      const userRole = req.user!.role;

      // Verificar permisos: Admin o Líder del clan
      if (userRole !== 'ADMIN') {
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { clanId: true, role: true },
        });

        if (user?.role !== 'CLAN_LEADER' || user?.clanId !== (id as string)) {
          return res.status(403).json({
            success: false,
            message: 'No tienes permisos para editar este clan',
          });
        }
      }

      const clan = await clanService.updateClan(id as string, data);

      return res.status(200).json({
        success: true,
        message: 'Clan actualizado exitosamente',
        data: { clan },
      });
    } catch (error) {
      handleError(res, error);
    }
  }

  async deleteClan(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userRole = req.user!.role;

      // Solo admins pueden eliminar clanes
      if (userRole !== 'ADMIN') {
        return res.status(403).json({
          success: false,
          message: 'No tienes permisos para eliminar clanes',
        });
      }

      await clanService.deleteClan(id as string);

      return res.status(200).json({
        success: true,
        message: 'Clan eliminado exitosamente',
      });
    } catch (error) {
      handleError(res, error);
    }
  }

  async uploadAvatar(req: Request, res: Response) {
    try {
      // Obtener ID y asegurar que es string
      const idParam = req.params.id;
      const id = Array.isArray(idParam) ? idParam[0] : idParam;

      if (!req.file) {
        return res.status(400).json({ error: 'No se proporcionó ninguna imagen' });
      }

      // Nueva URL centralizada
      const avatarUrl = `/uploads/clans/${req.file.filename}`;

      // Obtener el clan actual para eliminar avatar anterior
      const currentClan = await prisma.clan.findUnique({
        where: { id },
        select: { avatarUrl: true }
      });

      // Eliminar avatar anterior si existe
      if (currentClan?.avatarUrl) {
        const oldFilename = path.basename(currentClan.avatarUrl);
        const oldPath = path.join(__dirname, '../../uploads/clans', oldFilename);
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      }

      // Actualizar clan con nueva URL
      const updatedClan = await prisma.clan.update({
        where: { id },
        data: { avatarUrl }
      });

      // Audit log
      await prisma.auditLog.create({
        data: {
          action: 'CLAN_AVATAR_UPDATED',
          entity: 'Clan',
          entityId: id,
          userId: (req as any).user?.id,
          details: JSON.stringify({
            avatarUrl,
            filename: req.file.filename
          })
        }
      });

      res.json(updatedClan);
    } catch (error: any) {
      console.error('Error uploading clan avatar:', error);
      res.status(500).json({ error: error.message || 'Error al subir el avatar' });
    }
  }
}

export const clanController = new ClanController();