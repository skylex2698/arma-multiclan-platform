import { prisma } from '../index';

class ClanService {
  async getAllClans(filters?: { deleted?: boolean }) {
    const whereClause: Record<string, unknown> = {};

    // Si deleted=true, buscar solo clanes soft-deleted (escape hatch del middleware)
    if (filters?.deleted) {
      whereClause.deletedAt = { not: null };
    }

    const clans = await prisma.clan.findMany({
      where: whereClause,
      include: {
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
            email: true,
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
  }) {
    const clan = await prisma.clan.create({
      data: {
        name: data.name,
        tag: data.tag,
        description: data.description,
        avatarUrl: data.avatarUrl,
      },
    });

    return clan;
  }

  async updateClan(
    id: string,
    data: {
      name?: string;
      tag?: string;
      description?: string;
      avatarUrl?: string | null;
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
      data,
    });

    return updatedClan;
  }

  async deleteClan(id: string) {
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

      // Soft-delete el clan (middleware convierte delete → update con deletedAt)
      await tx.clan.delete({
        where: { id },
      });
    });
  }

  async restoreClan(id: string) {
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
        data: { deletedAt: null },
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
          _count: {
            select: { users: true },
          },
        },
      });
    });
  }
}

export const clanService = new ClanService();