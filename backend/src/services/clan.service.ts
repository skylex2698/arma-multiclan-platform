import { prisma } from '../index';
import { logger } from '../utils/logger';
import { UserRole } from '@prisma/client';

export class ClanService {
  // Listar todos los clanes
  async getAllClans() {
    const clans = await prisma.clan.findMany({
      include: {
        _count: {
          select: { users: true }
        }
      },
      orderBy: { name: 'asc' }
    });

    return clans.map(clan => ({
      id: clan.id,
      name: clan.name,
      tag: clan.tag,
      description: clan.description,
      memberCount: clan._count.users,
      createdAt: clan.createdAt
    }));
  }

  // Obtener clan por ID
  async getClanById(clanId: string) {
    const clan = await prisma.clan.findUnique({
      where: { id: clanId },
      include: {
        _count: {
          select: { users: true }
        }
      }
    });

    if (!clan) {
      throw new Error('Clan no encontrado');
    }

    return {
      id: clan.id,
      name: clan.name,
      tag: clan.tag,
      description: clan.description,
      memberCount: clan._count.users,
      createdAt: clan.createdAt,
      updatedAt: clan.updatedAt
    };
  }

  // Crear clan (solo ADMIN)
  async createClan(data: {
    name: string;
    tag?: string;
    description?: string;
  }) {
    // Verificar si ya existe un clan con ese nombre
    const existingClan = await prisma.clan.findUnique({
      where: { name: data.name }
    });

    if (existingClan) {
      throw new Error('Ya existe un clan con ese nombre');
    }

    const clan = await prisma.clan.create({
      data: {
        name: data.name,
        tag: data.tag,
        description: data.description
      }
    });

    logger.info('Clan created', { clanId: clan.id, name: clan.name });

    return clan;
  }

  // Editar clan (solo ADMIN)
  async updateClan(
    clanId: string,
    data: {
      name?: string;
      tag?: string;
      description?: string;
    }
  ) {
    // Verificar que el clan existe
    const existingClan = await prisma.clan.findUnique({
      where: { id: clanId }
    });

    if (!existingClan) {
      throw new Error('Clan no encontrado');
    }

    // Si cambia el nombre, verificar que no exista otro clan con ese nombre
    if (data.name && data.name !== existingClan.name) {
      const nameExists = await prisma.clan.findUnique({
        where: { name: data.name }
      });

      if (nameExists) {
        throw new Error('Ya existe un clan con ese nombre');
      }
    }

    const clan = await prisma.clan.update({
      where: { id: clanId },
      data
    });

    logger.info('Clan updated', { clanId: clan.id });

    return clan;
  }

  // Eliminar clan (solo ADMIN)
  async deleteClan(clanId: string) {
    // Verificar que el clan existe
    const clan = await prisma.clan.findUnique({
      where: { id: clanId },
      include: {
        users: true
      }
    });

    if (!clan) {
      throw new Error('Clan no encontrado');
    }

    // Actualizar usuarios del clan (quitarles el clan y el rol de líder si lo tienen)
    await prisma.user.updateMany({
      where: { clanId: clanId },
      data: {
        clanId: null,
        role: UserRole.USER // Si era líder, pasa a usuario normal
      }
    });

    // Eliminar el clan
    await prisma.clan.delete({
      where: { id: clanId }
    });

    logger.info('Clan deleted', { clanId, memberCount: clan.users.length });

    return {
      message: 'Clan eliminado correctamente',
      affectedUsers: clan.users.length
    };
  }

  // Listar usuarios de un clan
  async getClanMembers(clanId: string) {
    const clan = await prisma.clan.findUnique({
      where: { id: clanId }
    });

    if (!clan) {
      throw new Error('Clan no encontrado');
    }

    const members = await prisma.user.findMany({
      where: { clanId },
      select: {
        id: true,
        nickname: true,
        email: true,
        role: true,
        status: true,
        discordUsername: true,
        createdAt: true
      },
      orderBy: [
        { role: 'desc' }, // ADMINs primero, luego CLAN_LEADERs, luego USERs
        { nickname: 'asc' }
      ]
    });

    return members;
  }
}

export const clanService = new ClanService();