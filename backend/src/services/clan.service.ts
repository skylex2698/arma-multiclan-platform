import { prisma } from '../config/database';

class ClanService {
  async getAllClans() {
    const clans = await prisma.clan.findMany({
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
      avatarUrl?: string;
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

    if (clan.users.length > 0) {
      throw new Error(
        'No se puede eliminar un clan con miembros. Primero remueve a todos los miembros.'
      );
    }

    await prisma.clan.delete({
      where: { id },
    });
  }
}

export const clanService = new ClanService();