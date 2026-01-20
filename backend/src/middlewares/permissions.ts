import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';

// Verificar si el usuario puede editar el árbol de comunicaciones del evento
export const canManageEventCommunication = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const eventId = req.params.eventId as string; // Asegurar que es string
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