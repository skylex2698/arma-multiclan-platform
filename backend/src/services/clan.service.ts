import { prisma } from '../index';
import { ClanCreationRequestStatus, UserRole } from '@prisma/client';

class ClanService {
  private normalizeClanTag(tag?: string | null) {
    if (!tag) {
      return null;
    }

    const sanitized = tag.replace(/[\[\]\(\)\{\}]/g, '').trim().toUpperCase();
    return sanitized || null;
  }

  async getAllClans(filters?: { deleted?: boolean }) {
    const whereClause: Record<string, unknown> = {};

    // Si deleted=true, buscar solo clanes soft-deleted (escape hatch del middleware)
    if (filters?.deleted) {
      whereClause.deletedAt = { not: null };
    }

    const clans = await prisma.clan.findMany({
      where: whereClause,
      include: {
        primaryGame: true,
        _count: {
          select: { users: true },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    return {
      clans: clans.map((clan) => ({
        ...clan,
        memberCount: clan._count.users,
      })),
      count: clans.length,
    };
  }

  async getClanById(id: string) {
    const clan = await prisma.clan.findUnique({
      where: { id },
      include: {
        primaryGame: true,
        _count: {
          select: { users: true },
        },
      },
    });

    if (!clan) {
      throw new Error('Clan no encontrado');
    }

    return clan;
  }

  async getClanMembers(id: string) {
    const clan = await prisma.clan.findUnique({
      where: { id },
      include: {
        users: {
          select: {
            id: true,
            nickname: true,
            role: true,
            status: true,
            clanId: true,
            avatarUrl: true,
            createdAt: true,
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
          },
          orderBy: {
            role: 'desc',
          },
        },
      },
    });

    if (!clan) {
      throw new Error('Clan no encontrado');
    }

    return {
      members: clan.users,
      count: clan.users.length,
    };
  }

  async createClan(data: {
    name: string;
    tag?: string;
    description?: string;
    avatarUrl?: string;
    primaryGameId: string;
  }) {
    const clan = await prisma.clan.create({
      data: {
        name: data.name,
        tag: this.normalizeClanTag(data.tag),
        description: data.description,
        avatarUrl: data.avatarUrl,
        primaryGameId: data.primaryGameId,
      },
      include: {
        primaryGame: true,
      },
    });

    return clan;
  }

  async createClanFromApprovedRequest(
    requestId: string,
    userId: string,
    data: {
      name: string;
      tag?: string;
      description?: string;
      avatarUrl?: string;
      primaryGameId: string;
    }
  ) {
    return prisma.$transaction(async (tx) => {
      const request = await tx.clanCreationRequest.findUnique({
        where: { id: requestId },
        select: {
          id: true,
          userId: true,
          status: true,
          createdClanId: true,
        },
      });

      if (!request || request.userId !== userId) {
        throw new Error('Solicitud aprobada no encontrada');
      }

      if (request.status !== ClanCreationRequestStatus.APPROVED || request.createdClanId) {
        throw new Error('La solicitud ya no está disponible para crear el clan');
      }

      const clan = await tx.clan.create({
        data: {
          name: data.name,
          tag: this.normalizeClanTag(data.tag),
          description: data.description,
          avatarUrl: data.avatarUrl,
          primaryGameId: data.primaryGameId,
        },
        include: {
          primaryGame: true,
        },
      });

      await tx.user.update({
        where: { id: userId },
        data: {
          clanId: clan.id,
          role: UserRole.CLAN_LEADER,
          mustCreateClanOnboarding: false,
          status: 'ACTIVE',
        },
      });

      await tx.clanCreationRequest.update({
        where: { id: requestId },
        data: {
          status: ClanCreationRequestStatus.FULFILLED,
          createdClanId: clan.id,
          fulfilledAt: new Date(),
        },
      });

      await tx.auditLog.create({
        data: {
          action: 'CLAN_CREATED_FROM_APPROVED_REQUEST',
          entity: 'Clan',
          entityId: clan.id,
          userId,
          details: JSON.stringify({
            requestId,
            clanName: clan.name,
          }),
        },
      });

      return clan;
    });
  }

  async updateClan(
    id: string,
    data: {
      name?: string;
      tag?: string;
      description?: string;
      avatarUrl?: string | null;
      avatarArchivedPath?: string | null;
      avatarArchivedAt?: Date | null;
      primaryGameId?: string;
    }
  ) {
    const clan = await prisma.clan.findUnique({
      where: { id },
    });

    if (!clan) {
      throw new Error('Clan no encontrado');
    }

    const updatedClan = await prisma.clan.update({
      where: { id },
      data: {
        ...data,
        ...(data.tag !== undefined ? { tag: this.normalizeClanTag(data.tag) } : {}),
      },
      include: {
        primaryGame: true,
      },
    });

    return updatedClan;
  }

  async deleteClan(
    id: string,
    archiveData?: { avatarArchivedPath: string | null; avatarArchivedAt: Date | null }
  ) {
    const clan = await prisma.clan.findUnique({
      where: { id },
      include: {
        users: true,
      },
    });

    if (!clan) {
      throw new Error('Clan no encontrado');
    }

    // Bloquear miembros + soft-delete del clan atómicamente
    await prisma.$transaction(async (tx) => {
      if (clan.users.length > 0) {
        await tx.user.updateMany({
          where: {
            clanId: id,
            status: { in: ['ACTIVE', 'PENDING'] },
          },
          data: {
            status: 'BLOCKED',
          },
        });
      }

      await tx.clan.update({
        where: { id },
        data: {
          deletedAt: new Date(),
          avatarUrl: null,
          avatarArchivedPath: archiveData?.avatarArchivedPath || null,
          avatarArchivedAt: archiveData?.avatarArchivedAt || null,
        },
      });
    });
  }

  async restoreClan(
    id: string,
    restoreData?: {
      avatarUrl?: string | null;
      avatarArchivedPath?: string | null;
      avatarArchivedAt?: Date | null;
    }
  ) {
    // Buscar clan soft-deleted (escape hatch del middleware)
    const clan = await prisma.clan.findFirst({
      where: { id, deletedAt: { not: null } },
    });

    if (!clan) {
      throw new Error('Clan eliminado no encontrado');
    }

    // Restaurar clan + desbloquear miembros atómicamente
    return prisma.$transaction(async (tx) => {
      await tx.clan.update({
        where: { id },
        data: {
          deletedAt: null,
          avatarUrl: restoreData?.avatarUrl ?? clan.avatarUrl,
          avatarArchivedPath: restoreData?.avatarArchivedPath ?? null,
          avatarArchivedAt: restoreData?.avatarArchivedAt ?? null,
        },
      });

      await tx.user.updateMany({
        where: {
          clanId: id,
          status: 'BLOCKED',
        },
        data: {
          status: 'ACTIVE',
        },
      });

      return tx.clan.findUnique({
        where: { id },
        include: {
          primaryGame: true,
          _count: {
            select: { users: true },
          },
        },
      });
    });
  }
}

export const clanService = new ClanService();
