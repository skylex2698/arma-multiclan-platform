import { prisma } from '../index';
import { GameIdentityMode, GameStatus } from '@prisma/client';

export class GameService {
  async getGames(filters?: { status?: GameStatus; includeInactive?: boolean }) {
    const where = filters?.status
      ? { status: filters.status }
      : filters?.includeInactive
        ? {}
        : { status: GameStatus.ACTIVE };

    return prisma.game.findMany({
      where,
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
  }

  async getGameById(id: string) {
    const game = await prisma.game.findUnique({ where: { id } });
    if (!game) {
      throw new Error('Juego no encontrado');
    }
    return game;
  }

  async createGame(data: {
    slug: string;
    name: string;
    status?: GameStatus;
    supportsModsetHtml?: boolean;
    identityMode?: GameIdentityMode;
    identityLabel?: string | null;
    sortOrder?: number;
  }) {
    return prisma.game.create({
      data: {
        slug: data.slug,
        name: data.name,
        status: data.status ?? GameStatus.ACTIVE,
        supportsModsetHtml: data.supportsModsetHtml ?? false,
        identityMode: data.identityMode ?? GameIdentityMode.NONE,
        identityLabel: data.identityLabel || null,
        sortOrder: data.sortOrder ?? 0,
      },
    });
  }

  async updateGame(
    id: string,
    data: {
      slug?: string;
      name?: string;
      status?: GameStatus;
      supportsModsetHtml?: boolean;
      identityMode?: GameIdentityMode;
      identityLabel?: string | null;
      sortOrder?: number;
    }
  ) {
    await this.getGameById(id);

    return prisma.game.update({
      where: { id },
      data: {
        ...(data.slug !== undefined ? { slug: data.slug } : {}),
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.status !== undefined ? { status: data.status } : {}),
        ...(data.supportsModsetHtml !== undefined
          ? { supportsModsetHtml: data.supportsModsetHtml }
          : {}),
        ...(data.identityMode !== undefined ? { identityMode: data.identityMode } : {}),
        ...(data.identityLabel !== undefined ? { identityLabel: data.identityLabel } : {}),
        ...(data.sortOrder !== undefined ? { sortOrder: data.sortOrder } : {}),
      },
    });
  }

  async deleteGame(id: string) {
    const game = await this.getGameById(id);

    const [clansUsingGame, eventsUsingGame, identitiesUsingGame] = await Promise.all([
      prisma.clan.count({ where: { primaryGameId: id, deletedAt: null } }),
      prisma.event.count({ where: { gameId: id, deletedAt: null } }),
      prisma.gameIdentity.count({ where: { gameId: id } }),
    ]);

    if (clansUsingGame > 0 || eventsUsingGame > 0) {
      throw new Error(
        `No se puede eliminar "${game.name}" porque sigue asignado a clanes o eventos`
      );
    }

    await prisma.$transaction(async (tx) => {
      if (identitiesUsingGame > 0) {
        await tx.gameIdentity.deleteMany({
          where: { gameId: id },
        });
      }

      await tx.game.delete({
        where: { id },
      });
    });

    return { id: game.id, name: game.name, deletedIdentities: identitiesUsingGame };
  }
}

export const gameService = new GameService();
