import {
  GameIdentityMode,
  GameIdentityProviderKind,
  GameIdentityStatus,
  Prisma,
  PrismaClient,
  UserRole,
  UserStatus,
} from '@prisma/client';
import { prisma } from '../index';

type DBClient = PrismaClient | Prisma.TransactionClient;

const normalizeIdentityValue = (
  providerKind: GameIdentityProviderKind,
  value: string
) => {
  const trimmed = value.trim();
  if (providerKind === GameIdentityProviderKind.STEAM) {
    return trimmed.replace(/\s+/g, '');
  }
  return trimmed;
};

export class GameIdentityService {
  async listUserIdentities(userId: string) {
    return prisma.gameIdentity.findMany({
      where: { userId },
      include: {
        game: true,
      },
      orderBy: [{ game: { sortOrder: 'asc' } }, { game: { name: 'asc' } }],
    });
  }

  async upsertIdentity(
    userId: string,
    gameId: string,
    data: {
      providerKind?: GameIdentityProviderKind;
      value?: string;
    }
  ) {
    const game = await prisma.game.findUnique({ where: { id: gameId } });
    if (!game) {
      throw new Error('Juego no encontrado');
    }

    const providerKind =
      data.providerKind ??
      (game.identityMode === GameIdentityMode.STEAM64
        ? GameIdentityProviderKind.STEAM
        : game.identityMode === GameIdentityMode.MANUAL
          ? GameIdentityProviderKind.MANUAL
          : GameIdentityProviderKind.NONE);

    const rawValue = data.value?.trim() || '';
    const normalizedValue = rawValue
      ? normalizeIdentityValue(providerKind, rawValue)
      : null;

    if (game.identityMode === GameIdentityMode.STEAM64) {
      if (!/^\d{17}$/.test(normalizedValue || '')) {
        throw new Error('El Steam64 debe tener 17 dígitos');
      }
    }

    if (game.identityMode === GameIdentityMode.MANUAL && !rawValue) {
      throw new Error(game.identityLabel || 'Debes indicar la identidad requerida');
    }

    if (game.identityMode === GameIdentityMode.NONE) {
      throw new Error('Este juego no requiere identidad específica');
    }

    return prisma.gameIdentity.upsert({
      where: {
        userId_gameId: { userId, gameId },
      },
      create: {
        userId,
        gameId,
        providerKind,
        value: rawValue,
        normalizedValue,
        status:
          game.identityMode === GameIdentityMode.STEAM64
            ? GameIdentityStatus.VERIFIED
            : GameIdentityStatus.PENDING,
        verifiedAt:
          game.identityMode === GameIdentityMode.STEAM64 ? new Date() : null,
      },
      update: {
        providerKind,
        value: rawValue,
        normalizedValue,
        status:
          game.identityMode === GameIdentityMode.STEAM64
            ? GameIdentityStatus.VERIFIED
            : GameIdentityStatus.PENDING,
        verifiedAt:
          game.identityMode === GameIdentityMode.STEAM64 ? new Date() : null,
        verifiedBy: null,
      },
      include: {
        game: true,
      },
    });
  }

  async setIdentityStatus(
    identityId: string,
    reviewerId: string,
    reviewerRole: UserRole,
    reviewerClanId: string | null,
    status: GameIdentityStatus
  ) {
    const identity = await prisma.gameIdentity.findUnique({
      where: { id: identityId },
      include: {
        user: {
          select: {
            clanId: true,
          },
        },
        game: true,
      },
    });

    if (!identity) {
      throw new Error('Identidad no encontrada');
    }

    if (reviewerRole !== UserRole.ADMIN) {
      if (!reviewerClanId || identity.user.clanId !== reviewerClanId) {
        throw new Error('Solo puedes revisar identidades de tu clan');
      }
    }

    return prisma.gameIdentity.update({
      where: { id: identityId },
      data: {
        status,
        verifiedBy: reviewerId,
        verifiedAt: status === GameIdentityStatus.VERIFIED ? new Date() : null,
      },
      include: {
        game: true,
      },
    });
  }

  async ensureUserCanParticipateInGame(
    db: DBClient,
    userId: string,
    gameId: string
  ) {
    const [user, game] = await Promise.all([
      db.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          status: true,
          deletedAt: true,
        },
      }),
      db.game.findUnique({
        where: { id: gameId },
        select: {
          id: true,
          name: true,
          identityMode: true,
          identityLabel: true,
        },
      }),
    ]);

    if (!user || user.deletedAt) {
      throw new Error('Usuario no encontrado');
    }

    if (!game) {
      throw new Error('Juego no encontrado');
    }

    if (user.status === UserStatus.BANNED) {
      throw new Error('El usuario está baneado y no puede participar');
    }
  }

  async ensureUserCanBeActivated(
    _db: DBClient,
    _userId: string,
    _clanId: string | null,
    _nextStatus: string
  ) {
    return;
  }
}

export const gameIdentityService = new GameIdentityService();
