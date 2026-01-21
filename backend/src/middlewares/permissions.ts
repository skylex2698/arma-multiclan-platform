import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { UserRole } from '@prisma/client';

// Verificar si el usuario puede editar el árbol de comunicaciones del evento
export const canManageEventCommunication = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const eventId = req.params.eventId as string;
    const userId = (req as any).user.id;
    const userRole = (req as any).user.role;

    // Admin puede editar cualquier evento
    if (userRole === 'ADMIN') {
      return next();
    }

    // Obtener evento y usuario
    const [event, user] = await Promise.all([
      prisma.event.findUnique({
        where: { id: eventId },
        include: {
          creator: {
            select: {
              clanId: true
            }
          }
        }
      }),
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          role: true,
          clanId: true
        }
      })
    ]);

    if (!event) {
      return res.status(404).json({ message: 'Evento no encontrado' });
    }

    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    // Líder del clan que creó el evento puede editar
    if (
      user.role === 'CLAN_LEADER' &&
      user.clanId === event.creator.clanId
    ) {
      return next();
    }

    return res.status(403).json({
      message: 'No tienes permisos para editar el árbol de comunicaciones de este evento'
    });
  } catch (error) {
    console.error('Error in canManageEventCommunication middleware:', error);
    res.status(500).json({ message: 'Error al verificar permisos' });
  }
};

// Nuevo middleware: Verificar si el usuario puede ver la gestión de usuarios
export const canViewUsers = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'No autenticado',
    });
  }

  // Admin y Líder de clan pueden ver usuarios
  if (req.user.role === UserRole.ADMIN || req.user.role === UserRole.CLAN_LEADER) {
    return next();
  }

  return res.status(403).json({
    success: false,
    message: 'No tienes permisos para ver la gestión de usuarios',
  });
};

// Nuevo middleware: Verificar si el usuario puede cambiar el rol de otros usuarios
export const canChangeUserRole = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'No autenticado',
    });
  }

  // Solo Admin puede cambiar roles
  if (req.user.role === UserRole.ADMIN) {
    return next();
  }

  return res.status(403).json({
    success: false,
    message: 'Solo los administradores pueden cambiar roles',
  });
};

// Nuevo middleware: Verificar si el usuario puede cambiar el estado de otro usuario
export const canChangeUserStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'No autenticado',
    });
  }

  const targetUserId = req.params.userId as string;

  // Validar que userId no sea un array
  if (Array.isArray(targetUserId)) {
    return res.status(400).json({
      success: false,
      message: 'ID de usuario inválido',
    });
  }

  // Admin puede cambiar el estado de cualquier usuario
  if (req.user.role === UserRole.ADMIN) {
    return next();
  }

  // Líder de clan solo puede cambiar el estado de usuarios de su clan
  if (req.user.role === UserRole.CLAN_LEADER) {
    try {
      const targetUser = await prisma.user.findUnique({
        where: { id: targetUserId },
        select: { clanId: true }
      });

      if (!targetUser) {
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado',
        });
      }

      // Verificar que el usuario pertenezca al mismo clan
      if (targetUser.clanId === req.user.clanId) {
        return next();
      }

      return res.status(403).json({
        success: false,
        message: 'Solo puedes cambiar el estado de usuarios de tu clan',
      });
    } catch (error) {
      console.error('Error in canChangeUserStatus middleware:', error);
      return res.status(500).json({
        success: false,
        message: 'Error al verificar permisos',
      });
    }
  }

  return res.status(403).json({
    success: false,
    message: 'No tienes permisos para cambiar el estado de usuarios',
  });
};