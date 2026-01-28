import { Request, Response } from 'express';
import path from 'path';
import { clanService } from '../services/clan.service';
import { prisma } from '../index';
import { validateFileType, deleteFile } from '../config/multer.config';
import { logger } from '../utils/logger';

const handleError = (res: Response, error: unknown, context?: string) => {
  // Loguear el error para depuración
  logger.error(`Error in ClanController${context ? ` (${context})` : ''}`, {
    error: error instanceof Error ? error.message : error,
    stack: error instanceof Error ? error.stack : undefined
  });

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
      const { id } = req.params;
      const userId = req.user!.id;
      const userRole = req.user!.role;

      // Verificar permisos
      if (userRole !== 'ADMIN') {
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { clanId: true, role: true },
        });

        if (user?.role !== 'CLAN_LEADER' || user?.clanId !== (id as string)) {
          return res.status(403).json({
            success: false,
            message: 'No tienes permisos para modificar este clan',
          });
        }
      }

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No se proporcionó ningún archivo',
        });
      }

      // SEGURIDAD: Validar magic bytes del archivo
      const filePath = path.join(process.cwd(), 'public', 'uploads', 'clans', req.file.filename);
      const isValidFile = await validateFileType(filePath);

      if (!isValidFile) {
        // Eliminar archivo inválido
        deleteFile(filePath);
        return res.status(400).json({
          success: false,
          message: 'El archivo no es una imagen válida',
        });
      }

      // Obtener clan actual para eliminar avatar anterior si existe
      const currentClan = await clanService.getClanById(id as string);
      if (currentClan.avatarUrl) {
        const oldFilePath = path.join(process.cwd(), 'public', currentClan.avatarUrl);
        deleteFile(oldFilePath);
      }

      // Construir URL del archivo
      const avatarUrl = `/uploads/clans/${req.file.filename}`;

      // Actualizar clan con nueva URL
      const clan = await clanService.updateClan(id as string, { avatarUrl });

      return res.status(200).json({
        success: true,
        message: 'Avatar actualizado exitosamente',
        data: { clan, avatarUrl },
      });
    } catch (error) {
      handleError(res, error, 'uploadAvatar');
    }
  }

  async deleteAvatar(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user!.id;
      const userRole = req.user!.role;

      // Verificar permisos
      if (userRole !== 'ADMIN') {
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { clanId: true, role: true },
        });

        if (user?.role !== 'CLAN_LEADER' || user?.clanId !== (id as string)) {
          return res.status(403).json({
            success: false,
            message: 'No tienes permisos para modificar este clan',
          });
        }
      }

      // Obtener clan actual
      const currentClan = await clanService.getClanById(id as string);

      if (!currentClan.avatarUrl) {
        return res.status(400).json({
          success: false,
          message: 'El clan no tiene avatar',
        });
      }

      // Eliminar archivo del servidor
      const filePath = path.join(process.cwd(), 'public', currentClan.avatarUrl);
      deleteFile(filePath);

      // Actualizar clan quitando la URL del avatar
      const clan = await clanService.updateClan(id as string, { avatarUrl: null });

      return res.status(200).json({
        success: true,
        message: 'Avatar eliminado exitosamente',
        data: { clan },
      });
    } catch (error) {
      handleError(res, error, 'deleteAvatar');
    }
  }
}

export const clanController = new ClanController();