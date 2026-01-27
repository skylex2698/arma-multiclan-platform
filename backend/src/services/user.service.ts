import { prisma } from '../index';
import { logger } from '../utils/logger';
import { UserRole, UserStatus } from '@prisma/client';
import { hashPassword, comparePassword } from '../utils/password';

export class UserService {
  // Listar usuarios con filtros y paginación
  async getAllUsers(filters?: {
    clanId?: string;
    role?: UserRole;
    status?: UserStatus;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const skip = (page - 1) * limit;

    // Construir condiciones de búsqueda
    const where: any = {
      ...(filters?.clanId && { clanId: filters.clanId }),
      ...(filters?.role && { role: filters.role }),
      ...(filters?.status && { status: filters.status }),
    };

    // Búsqueda por nombre o email
    if (filters?.search) {
      where.OR = [
        { nickname: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    // Obtener total y usuarios en paralelo
    const [total, users] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          nickname: true,
          role: true,
          status: true,
          clanId: true,
          discordId: true,
          discordUsername: true,
          clan: {
            select: {
              name: true,
              tag: true
            }
          },
          createdAt: true
        },
        orderBy: [
          { role: 'desc' },
          { nickname: 'asc' }
        ],
        skip,
        take: limit,
      }),
    ]);

    return {
      users,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // Obtener usuario por ID
  async getUserById(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        nickname: true,
        role: true,
        status: true,
        clanId: true,
        discordId: true,
        discordUsername: true,
        clan: {
          select: {
            id: true,
            name: true,
            tag: true,
            description: true
          }
        },
        createdAt: true,
        updatedAt: true
      }
    });

    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    return user;
  }

  // Validar usuario (PENDING -> ACTIVE)
  async validateUser(userId: string, validatorId: string, validatorRole: UserRole, validatorClanId?: string | null) {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    if (user.status !== UserStatus.PENDING) {
      throw new Error('El usuario no está pendiente de validación');
    }

    // Si es líder de clan, solo puede validar usuarios de su mismo clan
    if (validatorRole === UserRole.CLAN_LEADER) {
      if (!validatorClanId || user.clanId !== validatorClanId) {
        throw new Error('Solo puedes validar usuarios de tu propio clan');
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { status: UserStatus.ACTIVE }
    });

    // Registrar en audit log
    await prisma.auditLog.create({
      data: {
        action: 'USER_VALIDATED',
        entity: 'User',
        entityId: userId,
        userId: validatorId,
        details: JSON.stringify({ previousStatus: 'PENDING', newStatus: 'ACTIVE' })
      }
    });

    logger.info('User validated', { userId, validatorId });

    return updatedUser;
  }

  // Cambiar rol de usuario
  async changeUserRole(userId: string, newRole: UserRole, adminId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    if (user.role === newRole) {
      throw new Error('El usuario ya tiene ese rol');
    }

    // Si se cambia a CLAN_LEADER, verificar que tenga clan
    if (newRole === UserRole.CLAN_LEADER && !user.clanId) {
      throw new Error('El usuario debe pertenecer a un clan para ser líder');
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { role: newRole }
    });

    // Registrar en audit log
    await prisma.auditLog.create({
      data: {
        action: 'USER_ROLE_CHANGED',
        entity: 'User',
        entityId: userId,
        userId: adminId,
        details: JSON.stringify({ previousRole: user.role, newRole })
      }
    });

    logger.info('User role changed', { userId, previousRole: user.role, newRole, adminId });

    return updatedUser;
  }

  // Cambiar estado de usuario
  async changeUserStatus(userId: string, newStatus: UserStatus, adminId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    if (user.status === newStatus) {
      throw new Error('El usuario ya tiene ese estado');
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { status: newStatus }
    });

    // Registrar en audit log
    await prisma.auditLog.create({
      data: {
        action: 'USER_STATUS_CHANGED',
        entity: 'User',
        entityId: userId,
        userId: adminId,
        details: JSON.stringify({ previousStatus: user.status, newStatus })
      }
    });

    logger.info('User status changed', { userId, previousStatus: user.status, newStatus, adminId });

    return updatedUser;
  }

  // Cambiar clan directamente (solo ADMIN)
  async changeUserClan(userId: string, newClanId: string | null, adminId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { clan: true }
    });

    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    // Si se asigna a un nuevo clan, verificar que existe
    if (newClanId) {
      const clan = await prisma.clan.findUnique({
        where: { id: newClanId }
      });

      if (!clan) {
        throw new Error('Clan no encontrado');
      }
    }

    // Si era líder de clan y se le quita el clan, cambiar rol a USER
    let newRole = user.role;
    if (user.role === UserRole.CLAN_LEADER && !newClanId) {
      newRole = UserRole.USER;
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        clanId: newClanId,
        role: newRole
      },
      include: {
        clan: {
          select: {
            id: true,
            name: true,
            tag: true,
            avatarUrl: true
          }
        }
      }
    });

    // Registrar en historial de clanes (opcional, no bloquear si falla)
    try {
      await prisma.clanHistory.create({
        data: {
          userId,
          previousClan: user.clan?.name || null,
          newClan: newClanId ? (await prisma.clan.findUnique({ where: { id: newClanId } }))?.name || null : null,
          reason: 'Cambio realizado por administrador'
        }
      });
    } catch (error) {
      logger.warn('Failed to create clan history record', { error });
    }

    // Registrar en audit log (opcional, no bloquear si falla)
    try {
      await prisma.auditLog.create({
        data: {
          action: 'USER_CLAN_CHANGED',
          entity: 'User',
          entityId: userId,
          userId: adminId,
          details: JSON.stringify({
            previousClanId: user.clanId,
            newClanId,
            roleChanged: user.role !== newRole
          })
        }
      });
    } catch (error) {
      logger.warn('Failed to create audit log record', { error });
    }

    logger.info('User clan changed', { userId, previousClanId: user.clanId, newClanId, adminId });

    return updatedUser;
  }

  // Solicitar cambio de clan (por el usuario)
  async requestClanChange(userId: string, targetClanId: string, reason?: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    // Verificar que el clan destino existe
    const targetClan = await prisma.clan.findUnique({
      where: { id: targetClanId }
    });

    if (!targetClan) {
      throw new Error('Clan destino no encontrado');
    }

    // Verificar que no sea el mismo clan
    if (user.clanId === targetClanId) {
      throw new Error('Ya perteneces a ese clan');
    }

    // Verificar que no tenga una solicitud pendiente
    const existingRequest = await prisma.clanChangeRequest.findFirst({
      where: {
        userId,
        status: 'PENDING'
      }
    });

    if (existingRequest) {
      throw new Error('Ya tienes una solicitud de cambio de clan pendiente');
    }

    const request = await prisma.clanChangeRequest.create({
      data: {
        userId,
        currentClanId: user.clanId,
        targetClanId,
        reason
      },
      include: {
        user: {
          select: {
            nickname: true,
            email: true
          }
        },
        targetClan: {
          select: {
            name: true,
            tag: true
          }
        }
      }
    });

    logger.info('Clan change requested', { userId, targetClanId });

    return request;
  }

  // Listar solicitudes de cambio de clan
  async getClanChangeRequests(filters?: {
    status?: string;
    targetClanId?: string;
  }) {
    const requests = await prisma.clanChangeRequest.findMany({
      where: {
        ...(filters?.status && { status: filters.status }),
        ...(filters?.targetClanId && { targetClanId: filters.targetClanId })
      },
      include: {
        user: {
          select: {
            id: true,
            nickname: true,
            email: true,
            clanId: true,
            clan: {
              select: {
                name: true,
                tag: true
              }
            }
          }
        },
        targetClan: {
          select: {
            id: true,
            name: true,
            tag: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return requests;
  }

  // Aprobar/Rechazar solicitud de cambio de clan
  async reviewClanChangeRequest(
    requestId: string,
    reviewerId: string,
    reviewerRole: UserRole,
    reviewerClanId: string | null,
    approved: boolean
  ) {
    const request = await prisma.clanChangeRequest.findUnique({
      where: { id: requestId },
      include: { user: true }
    });

    if (!request) {
      throw new Error('Solicitud no encontrada');
    }

    if (request.status !== 'PENDING') {
      throw new Error('Esta solicitud ya fue revisada');
    }

    // Si es líder de clan, solo puede aprobar si es del clan destino
    if (reviewerRole === UserRole.CLAN_LEADER) {
      if (!reviewerClanId || request.targetClanId !== reviewerClanId) {
        throw new Error('Solo puedes aprobar solicitudes para tu clan');
      }
    }

    const newStatus = approved ? 'APPROVED' : 'REJECTED';

    // Actualizar la solicitud
    const updatedRequest = await prisma.clanChangeRequest.update({
      where: { id: requestId },
      data: {
        status: newStatus,
        reviewedBy: reviewerId,
        reviewedAt: new Date()
      }
    });

    // Si fue aprobada, cambiar el clan del usuario
    if (approved) {
      const previousClanName = request.user.clanId
        ? (await prisma.clan.findUnique({ where: { id: request.user.clanId } }))?.name
        : null;
      
      const newClanName = (await prisma.clan.findUnique({ where: { id: request.targetClanId } }))?.name;

      await prisma.user.update({
        where: { id: request.userId },
        data: { clanId: request.targetClanId }
      });

      // Registrar en historial
      await prisma.clanHistory.create({
        data: {
          userId: request.userId,
          previousClan: previousClanName,
          newClan: newClanName || null,
          reason: request.reason || 'Solicitud aprobada'
        }
      });

      // Audit log
      await prisma.auditLog.create({
        data: {
          action: 'CLAN_CHANGE_APPROVED',
          entity: 'ClanChangeRequest',
          entityId: requestId,
          userId: reviewerId,
          details: JSON.stringify({
            requestUserId: request.userId,
            targetClanId: request.targetClanId
          })
        }
      });

      logger.info('Clan change request approved', { requestId, userId: request.userId, reviewerId });
    } else {
      logger.info('Clan change request rejected', { requestId, userId: request.userId, reviewerId });
    }

    return updatedRequest;
  }

  async updateProfile(
    userId: string,
    data: {
      nickname?: string;
      email?: string;
    }
  ) {
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(data.nickname && { nickname: data.nickname }),
        ...(data.email && { email: data.email }),
      },
      select: {
        id: true,
        email: true,
        nickname: true,
        role: true,
        status: true,
        clanId: true,
        avatarUrl: true,
        createdAt: true,
        updatedAt: true,
        clan: {
          select: {
            id: true,
            name: true,
            tag: true,
            description: true,
            avatarUrl: true,
          },
        },
      },
    });

    logger.info('User profile updated', { userId });

    return updatedUser;
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ) {
    // Obtener usuario con password
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        password: true,
      },
    });

    if (!user || !user.password) {
      throw new Error('Usuario no encontrado');
    }

    // Verificar contraseña actual
    const isPasswordValid = await comparePassword(currentPassword, user.password);
    if (!isPasswordValid) {
      throw new Error('La contraseña actual es incorrecta');
    }

    // Hash de la nueva contraseña
    const hashedPassword = await hashPassword(newPassword);

    // Actualizar contraseña
    await prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
      },
    });

    logger.info('User password changed', { userId });
  }

  async updateRole(userId: string, role: UserRole) {
    const user = await prisma.user.update({
      where: { id: userId },
      data: { role },
      include: {
        clan: {
          select: {
            id: true,
            name: true,
            tag: true,
            avatarUrl: true,
          },
        },
      },
    });

    return user;
  }

  async updateStatus(userId: string, status: UserStatus) {
    const user = await prisma.user.update({
      where: { id: userId },
      data: { status },
      include: {
        clan: {
          select: {
            id: true,
            name: true,
            tag: true,
            avatarUrl: true,
          },
        },
      },
    });

    return user;
  }
}

export const userService = new UserService();