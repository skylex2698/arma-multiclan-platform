import { Request, Response, NextFunction } from 'express';
import { prisma } from '../index';
import {
  canManageClanScope,
  canManageEventScope,
  canManageUserScope,
  hasPermission,
  Permission,
  PERMISSIONS,
} from '../auth/rbac';

// Verificar si el usuario puede editar el árbol de comunicaciones del evento
export const canManageEventCommunication = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const eventId = req.params.eventId as string;

    const event = await prisma.event.findFirst({
      where: { id: eventId },
      include: {
        creator: {
          select: {
            clanId: true,
          },
        },
      },
    });

    if (!event) {
      return res.status(404).json({ message: 'Evento no encontrado' });
    }

    if (canManageEventScope(req.user, event.creator.clanId, PERMISSIONS.COMMUNICATIONS_MANAGE)) {
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

export const requirePermission = (permission: Permission) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'No autenticado',
      });
    }

    if (!hasPermission(req.user, permission)) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para esta acción',
      });
    }

    return next();
  };
};

export const requireClanScopedPermission = (
  permission: Permission,
  clanIdParam = 'id'
) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'No autenticado',
      });
    }

    const clanId = req.params[clanIdParam];
    if (!clanId || Array.isArray(clanId)) {
      return res.status(400).json({
        success: false,
        message: 'Falta el clan objetivo',
      });
    }

    if (canManageClanScope(req.user, clanId, permission)) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: 'No tienes permisos para administrar este clan',
    });
  };
};

export const requireEventScopedPermission = (
  permission: Permission,
  eventIdParam = 'id'
) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'No autenticado',
      });
    }

    const eventId = req.params[eventIdParam];
    if (!eventId || Array.isArray(eventId)) {
      return res.status(400).json({
        success: false,
        message: 'Falta el evento objetivo',
      });
    }

    const event = await prisma.event.findFirst({
      where: { id: eventId },
      include: {
        creator: {
          select: {
            clanId: true,
          },
        },
      },
    });

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Evento no encontrado',
      });
    }

    if (canManageEventScope(req.user, event.creator.clanId, permission)) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: 'No tienes permisos para administrar este evento',
    });
  };
};

export const requireTargetUserPermission = (
  permission: Permission,
  userIdParam = 'userId'
) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'No autenticado',
      });
    }

    const targetUserId = req.params[userIdParam];

    if (!targetUserId || Array.isArray(targetUserId)) {
      return res.status(400).json({
        success: false,
        message: 'ID de usuario inválido',
      });
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: {
        clanId: true,
      },
    });

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado',
      });
    }

    if (canManageUserScope(req.user, targetUser.clanId, permission)) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: 'No tienes permisos para administrar este usuario',
    });
  };
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

  if (hasPermission(req.user, PERMISSIONS.USER_VIEW)) {
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

  if (hasPermission(req.user, PERMISSIONS.USER_ROLE_MANAGE)) {
    return next();
  }

  if (req.user.role === 'CLAN_LEADER') {
    return next();
  }

  return res.status(403).json({
    success: false,
    message: 'No tienes permisos para cambiar roles',
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

    if (canManageUserScope(req.user, targetUser.clanId, PERMISSIONS.USER_STATUS_MANAGE)) {
      return next();
    }
  } catch (error) {
    console.error('Error in canChangeUserStatus middleware:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al verificar permisos',
    });
  }

  return res.status(403).json({
    success: false,
    message: 'No tienes permisos para cambiar el estado de usuarios',
  });
};
