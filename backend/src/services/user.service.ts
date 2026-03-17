import { prisma } from '../index';
import { logger } from '../utils/logger';
import { ClanCreationRequestStatus, UserRole, UserStatus } from '@prisma/client';
import { hashPassword, comparePassword } from '../utils/password';
import { normalizeEmail } from '../utils/validators';
import {
  getDelegablePermissionsForRole,
  getEffectivePermissions,
  isClanBoundRole,
  Permission,
} from '../auth/rbac';

export class UserService {
  private normalizeClanTag(tag?: string | null) {
    if (!tag) {
      return null;
    }

    const sanitized = tag.replace(/[\[\]\(\)\{\}]/g, '').trim().toUpperCase();
    return sanitized || null;
  }

  private withEffectivePermissions<
    T extends { role: UserRole; permissionOverrides?: Array<{ permission: string; enabled: boolean }> }
  >(user: T) {
    const permissionOverrides = user.permissionOverrides || [];
    return {
      ...user,
      permissions: getEffectivePermissions(user.role, permissionOverrides),
    };
  }

  private generateTemporaryPassword(length = 14) {
    const alphabet =
      'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%';
    let password = '';

    for (let i = 0; i < length; i += 1) {
      password += alphabet[Math.floor(Math.random() * alphabet.length)];
    }

    return password;
  }

  // Listar usuarios con filtros y paginación
  async getAllUsers(filters?: {
    clanId?: string;
    role?: UserRole;
    status?: string;
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
    };

    // Soporte multi-status (e.g., "ACTIVE,EXTERNAL")
    if (filters?.status) {
      const statuses = filters.status.split(',').map(s => s.trim());
      where.status = statuses.length > 1 ? { in: statuses } : statuses[0];
    }

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
          timezone: true,
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
              primaryGameId: true,
              primaryGame: true,
            }
          },
          gameIdentities: {
            include: {
              game: true,
            },
            orderBy: {
              createdAt: 'asc',
            },
          },
          permissionOverrides: {
            select: {
              permission: true,
              enabled: true,
            },
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
      users: users.map((user) => this.withEffectivePermissions(user)),
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
        timezone: true,
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
            description: true,
            primaryGameId: true,
            primaryGame: true,
          }
        },
        gameIdentities: {
          include: {
            game: true,
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
        permissionOverrides: {
          select: {
            permission: true,
            enabled: true,
          },
        },
        createdAt: true,
        updatedAt: true
      }
    });

    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    return this.withEffectivePermissions(user);
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

    // Cualquier rol de clan no-admin solo puede validar usuarios de su mismo clan.
    if (validatorRole !== UserRole.ADMIN) {
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

    if (isClanBoundRole(newRole) && !user.clanId) {
      throw new Error('El usuario debe pertenecer a un clan para tener un rol de clan');
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { role: newRole }
    });

    await prisma.userPermissionOverride.deleteMany({
      where: { userId },
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

    // Si tenía un rol de clan y se le quita el clan, volver a USER.
    let newRole = user.role;
    if (isClanBoundRole(user.role) && !newClanId) {
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
    // Lecturas de validación fuera de la transacción
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

    if (reviewerRole !== UserRole.ADMIN) {
      if (reviewerRole !== UserRole.CLAN_LEADER) {
        throw new Error('Solo el líder del clan o un administrador pueden revisar solicitudes');
      }

      if (!reviewerClanId || request.targetClanId !== reviewerClanId) {
        throw new Error('Solo puedes aprobar solicitudes para tu clan');
      }
    }

    const newStatus = approved ? 'APPROVED' : 'REJECTED';

    // Escrituras atómicas dentro de la transacción
    const updatedRequest = await prisma.$transaction(async (tx) => {
      // Actualizar la solicitud
      const updated = await tx.clanChangeRequest.update({
        where: { id: requestId },
        data: {
          status: newStatus,
          reviewedBy: reviewerId,
          reviewedAt: new Date()
        }
      });

      // Si fue aprobada, cambiar el clan del usuario
      if (approved) {
        // Lecturas consistentes dentro de la transacción
        const previousClanName = request.user.clanId
          ? (await tx.clan.findUnique({ where: { id: request.user.clanId } }))?.name
          : null;

        const newClanName = (await tx.clan.findUnique({ where: { id: request.targetClanId } }))?.name;

        await tx.user.update({
          where: { id: request.userId },
          data: { clanId: request.targetClanId }
        });

        // Registrar en historial
        await tx.clanHistory.create({
          data: {
            userId: request.userId,
            previousClan: previousClanName,
            newClan: newClanName || null,
            reason: request.reason || 'Solicitud aprobada'
          }
        });

        // Audit log
        await tx.auditLog.create({
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
      }

      return updated;
    });

    if (approved) {
      logger.info('Clan change request approved', { requestId, userId: request.userId, reviewerId });
    } else {
      logger.info('Clan change request rejected', { requestId, userId: request.userId, reviewerId });
    }

    return updatedRequest;
  }

  async getClanCreationRequests(filters?: {
    status?: ClanCreationRequestStatus;
  }) {
    return prisma.clanCreationRequest.findMany({
      where: {
        ...(filters?.status ? { status: filters.status } : {}),
      },
      include: {
        user: {
          select: {
            id: true,
            nickname: true,
            email: true,
            status: true,
          },
        },
        primaryGame: {
          select: {
            id: true,
            name: true,
          },
        },
        createdClan: {
          select: {
            id: true,
            name: true,
            tag: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async reviewClanCreationRequest(
    requestId: string,
    reviewerId: string,
    approved: boolean,
    reviewNote?: string
  ) {
    const request = await prisma.clanCreationRequest.findUnique({
      where: { id: requestId },
      include: {
        user: {
          select: {
            id: true,
            status: true,
          },
        },
        primaryGame: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!request) {
      throw new Error('Solicitud no encontrada');
    }

    if (request.status !== ClanCreationRequestStatus.PENDING) {
      throw new Error('Esta solicitud ya fue revisada');
    }

    return prisma.$transaction(async (tx) => {
      let createdClanId: string | null = null;

      if (approved) {
        const clan = await tx.clan.create({
          data: {
            name: request.requestedName,
            tag: this.normalizeClanTag(request.requestedTag),
            description: request.requestedDescription || null,
            primaryGameId: request.primaryGameId,
          },
        });

        createdClanId = clan.id;
      }

      const updatedRequest = await tx.clanCreationRequest.update({
        where: { id: requestId },
        data: {
          status: approved
            ? ClanCreationRequestStatus.FULFILLED
            : ClanCreationRequestStatus.REJECTED,
          reviewedBy: reviewerId,
          reviewedAt: new Date(),
          reviewNote: reviewNote || null,
          ...(approved
            ? {
                createdClanId,
                fulfilledAt: new Date(),
              }
            : {}),
        },
        include: {
          user: {
            select: {
              id: true,
              nickname: true,
              email: true,
              status: true,
            },
          },
          primaryGame: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      await tx.user.update({
        where: { id: request.userId },
        data: approved
          ? {
              status: UserStatus.ACTIVE,
              mustCreateClanOnboarding: false,
              clanId: createdClanId,
              role: UserRole.CLAN_LEADER,
            }
          : {
              status: UserStatus.BLOCKED,
              mustCreateClanOnboarding: false,
            },
      });

      await tx.auditLog.create({
        data: {
          action: approved
            ? 'CLAN_CREATION_REQUEST_APPROVED'
            : 'CLAN_CREATION_REQUEST_REJECTED',
          entity: 'ClanCreationRequest',
          entityId: requestId,
          userId: reviewerId,
          details: JSON.stringify({
            requestUserId: request.userId,
            requestedName: request.requestedName,
            createdClanId,
          }),
        },
      });

      return updatedRequest;
    });
  }

  async getCurrentUserApprovedClanCreationRequest(userId: string) {
    const request = await prisma.clanCreationRequest.findFirst({
      where: {
        userId,
        status: ClanCreationRequestStatus.APPROVED,
        createdClanId: null,
      },
      include: {
        primaryGame: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (!request) {
      throw new Error('No hay una solicitud aprobada pendiente de crear clan');
    }

    return request;
  }

  async updateProfile(
    userId: string,
    data: {
      nickname?: string;
      email?: string;
      timezone?: string;
    }
  ) {
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(data.nickname && { nickname: data.nickname }),
        ...(data.email && { email: normalizeEmail(data.email) }),
        ...(data.timezone && { timezone: data.timezone }),
      },
      select: {
        id: true,
        email: true,
        nickname: true,
        timezone: true,
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
            primaryGameId: true,
            primaryGame: true,
          },
        },
        gameIdentities: {
          include: {
            game: true,
          },
          orderBy: {
            createdAt: 'asc',
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

  async selfResetPassword(userId: string, newPassword: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
      },
    });

    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    const hashedPassword = await hashPassword(newPassword);

    await prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
      },
    });

    await prisma.auditLog.create({
      data: {
        action: 'USER_SELF_PASSWORD_RESET',
        entity: 'User',
        entityId: userId,
        userId,
        details: JSON.stringify({
          method: 'authenticated_self_reset',
        }),
      },
    });

    logger.info('User password self-reset', { userId });
  }

  async adminUpdateUserProfile(
    userId: string,
    data: {
      nickname?: string;
      email?: string | null;
      timezone?: string;
    },
    adminId: string
  ) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        nickname: true,
        email: true,
        timezone: true,
      },
    });

    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    const updateData: Record<string, string | null> = {};

    if (data.nickname !== undefined) {
      const nickname = data.nickname.trim();
      if (nickname.length < 3) {
        throw new Error('El nickname debe tener al menos 3 caracteres');
      }
      updateData.nickname = nickname;
    }

    if (data.email !== undefined) {
      const email = data.email ? normalizeEmail(data.email) : null;

      if (email) {
        const existingUser = await prisma.user.findFirst({
          where: {
            email: {
              equals: email,
              mode: 'insensitive',
            },
            id: { not: userId },
          },
          select: { id: true },
        });

        if (existingUser) {
          throw new Error('Solo se permite una cuenta por correo electrónico. Ese email ya está en uso por otro usuario.');
        }
      }

      updateData.email = email;
    }

    if (data.timezone !== undefined) {
      updateData.timezone = data.timezone.trim() || 'Europe/Madrid';
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      include: {
        clan: {
          select: {
            id: true,
            name: true,
            tag: true,
            avatarUrl: true,
            primaryGameId: true,
            primaryGame: true,
          },
        },
        gameIdentities: {
          include: {
            game: true,
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
        permissionOverrides: {
          select: {
            permission: true,
            enabled: true,
          },
        },
      },
    });

    await prisma.auditLog.create({
      data: {
        action: 'USER_ADMIN_UPDATED',
        entity: 'User',
        entityId: userId,
        userId: adminId,
        details: JSON.stringify({
          previous: {
            nickname: user.nickname,
            email: user.email,
          },
          next: {
            nickname: updatedUser.nickname,
            email: updatedUser.email,
            timezone: updatedUser.timezone,
          },
        }),
      },
    });

    logger.info('User admin profile updated', { userId, adminId });

    return this.withEffectivePermissions(updatedUser);
  }

  async adminResetUserPassword(userId: string, adminId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        nickname: true,
      },
    });

    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    const temporaryPassword = this.generateTemporaryPassword();
    const hashedPassword = await hashPassword(temporaryPassword);

    await prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
      },
    });

    await prisma.auditLog.create({
      data: {
        action: 'USER_PASSWORD_RESET',
        entity: 'User',
        entityId: userId,
        userId: adminId,
        details: JSON.stringify({
          nickname: user.nickname,
        }),
      },
    });

    logger.info('User password reset by admin', { userId, adminId });

    return {
      temporaryPassword,
    };
  }

  async adminUpdateUserPermissions(
    userId: string,
    requestedPermissions: string[],
    adminId: string
  ) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        role: true,
        permissionOverrides: {
          select: {
            permission: true,
            enabled: true,
          },
        },
      },
    });

    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    if (user.role === UserRole.ADMIN) {
      throw new Error('Los permisos del administrador de plataforma no se editan desde overrides');
    }

    const delegablePermissions = getDelegablePermissionsForRole(user.role);
    const defaultPermissions = new Set(
      getEffectivePermissions(user.role, []).filter((permission) =>
        delegablePermissions.includes(permission)
      )
    );
    const nextPermissions = new Set(
      requestedPermissions.filter((permission): permission is Permission =>
        delegablePermissions.includes(permission as Permission)
      )
    );

    await prisma.$transaction(async (tx) => {
      for (const permission of delegablePermissions) {
        const defaultHas = defaultPermissions.has(permission);
        const requestedHas = nextPermissions.has(permission);

        if (defaultHas === requestedHas) {
          await tx.userPermissionOverride.deleteMany({
            where: {
              userId,
              permission,
            },
          });
          continue;
        }

        await tx.userPermissionOverride.upsert({
          where: {
            userId_permission: {
              userId,
              permission,
            },
          },
          create: {
            userId,
            permission,
            enabled: requestedHas,
          },
          update: {
            enabled: requestedHas,
          },
        });
      }

      await tx.auditLog.create({
        data: {
          action: 'USER_PERMISSIONS_UPDATED',
          entity: 'User',
          entityId: userId,
          userId: adminId,
          details: JSON.stringify({
            permissions: Array.from(nextPermissions),
          }),
        },
      });
    });

    const updatedUser = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        clan: {
          select: {
            id: true,
            name: true,
            tag: true,
            avatarUrl: true,
            primaryGameId: true,
            primaryGame: true,
          },
        },
        gameIdentities: {
          include: {
            game: true,
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
        permissionOverrides: {
          select: {
            permission: true,
            enabled: true,
          },
        },
      },
    });

    if (!updatedUser) {
      throw new Error('Usuario no encontrado');
    }

    logger.info('User permission overrides updated', { userId, adminId });

    return this.withEffectivePermissions(updatedUser);
  }

  async updateRole(
    userId: string,
    role: UserRole,
    actor: {
      id: string;
      role: UserRole;
      clanId?: string | null;
    }
  ) {
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        role: true,
        clanId: true,
        status: true,
      },
    });

    if (!targetUser) {
      throw new Error('Usuario no encontrado');
    }

    if (targetUser.role === UserRole.ADMIN && actor.role !== UserRole.ADMIN) {
      throw new Error('No puedes modificar a un administrador de plataforma');
    }

    if (isClanBoundRole(role) && !targetUser.clanId) {
      throw new Error('El usuario debe pertenecer a un clan para recibir un rol de clan');
    }

    if (actor.role === UserRole.CLAN_LEADER) {
      if (!actor.clanId) {
        throw new Error('No perteneces a ningún clan');
      }

      if (role === UserRole.ADMIN) {
        throw new Error('Como líder no puedes asignar el rol de administrador');
      }

      if (targetUser.clanId !== actor.clanId) {
        throw new Error('Solo puedes gestionar roles de miembros de tu propio clan');
      }

      if (isClanBoundRole(role) && targetUser.status !== UserStatus.ACTIVE) {
        throw new Error('El miembro debe estar activo para recibir un rol de clan');
      }
    }

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: targetUser.id },
        data: { role },
      });

      await tx.userPermissionOverride.deleteMany({
        where: { userId: targetUser.id },
      });

      await tx.auditLog.create({
        data: {
          action: 'USER_ROLE_UPDATED',
          entity: 'User',
          entityId: targetUser.id,
          userId: actor.id,
          details: JSON.stringify({
            previousRole: targetUser.role,
            newRole: role,
          }),
        },
      });
    });

    const user = await prisma.user.findUnique({
      where: { id: targetUser.id },
      include: {
        clan: {
          select: {
            id: true,
            name: true,
            tag: true,
            avatarUrl: true,
          },
        },
        permissionOverrides: {
          select: {
            permission: true,
            enabled: true,
          },
        },
      },
    });

    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    return this.withEffectivePermissions(user);
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

  async deleteUser(userId: string, actorId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        nickname: true,
        role: true,
      },
    });

    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    if (user.id === actorId) {
      throw new Error('No puedes eliminar tu propia cuenta desde esta pantalla');
    }

    await prisma.$transaction(async (tx) => {
      await tx.user.delete({
        where: { id: userId },
      });

      await tx.auditLog.create({
        data: {
          action: 'USER_DELETED',
          entity: 'User',
          entityId: userId,
          userId: actorId,
          details: JSON.stringify({
            nickname: user.nickname,
            previousRole: user.role,
          }),
        },
      });
    });
  }

  async createExternalUser(nickname: string, clanId: string, createdById: string) {
    const trimmed = nickname.trim();
    if (!trimmed || trimmed.length < 2) {
      throw new Error('El nombre debe tener al menos 2 caracteres');
    }

    const clan = await prisma.clan.findUnique({ where: { id: clanId } });
    if (!clan) {
      throw new Error('Clan no encontrado');
    }

    const user = await prisma.user.create({
      data: {
        nickname: trimmed,
        clanId,
        status: UserStatus.EXTERNAL,
        role: UserRole.USER,
      },
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

    await prisma.auditLog.create({
      data: {
        action: 'EXTERNAL_USER_CREATED',
        entity: 'User',
        entityId: user.id,
        userId: createdById,
        details: JSON.stringify({ nickname: trimmed, clanId }),
      },
    });

    logger.info('External user created', { userId: user.id, nickname: trimmed, clanId, createdById });

    return user;
  }
}

export const userService = new UserService();
