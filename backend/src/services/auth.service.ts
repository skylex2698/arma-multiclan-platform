import { prisma } from '../config/database';
import { hashPassword, comparePassword } from '../utils/password';
import { generateToken } from '../utils/jwt';
import { encrypt } from '../utils/encryption';
import { logger } from '../utils/logger';
import { UserStatus, UserRole } from '@prisma/client';

export class AuthService {
  // Registro local (email + password)
  async registerLocal(data: {
    email: string;
    password: string;
    nickname: string;
    clanId: string;
  }) {
    // Verificar si el email ya existe
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email }
    });

    if (existingUser) {
      throw new Error('El email ya está registrado');
    }

    // Verificar si el clan existe
    const clan = await prisma.clan.findUnique({
      where: { id: data.clanId }
    });

    if (!clan) {
      throw new Error('Clan no encontrado');
    }

    // Hash de la contraseña
    const hashedPassword = await hashPassword(data.password);

    // Crear usuario
    const user = await prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        nickname: data.nickname,
        clanId: data.clanId,
        status: UserStatus.PENDING,
        role: UserRole.USER
      },
      select: {
        id: true,
        email: true,
        nickname: true,
        role: true,
        status: true,
        clanId: true,
        clan: {
          select: {
            id: true,
            name: true,
            tag: true,
            avatarUrl: true,
          }
        }
      }
    });

    logger.info('User registered (local)', { userId: user.id });

    return user;
  }

  // Login local
  async loginLocal(email: string, password: string) {
    // Buscar usuario
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        password: true,
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
            description: true,
            avatarUrl: true,
          },
        },
      },
    });

    if (!user) {
      throw new Error('Credenciales inválidas');
    }

    // Verificar que el usuario tenga password
    if (!user.password) {
      throw new Error('Credenciales inválidas');
    }

    // Verificar contraseña
    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      throw new Error('Credenciales inválidas');
    }

    // Verificar estado del usuario
    if (user.status === UserStatus.BANNED) {
      throw new Error('Tu cuenta ha sido baneada');
    }

    if (user.status === UserStatus.BLOCKED) {
      throw new Error('Tu cuenta está bloqueada');
    }

    if (user.status === UserStatus.PENDING) {
      throw new Error('Tu cuenta está pendiente de validación');
    }

    // Remover password antes de devolver
    const { password: _, ...userWithoutPassword } = user;

    // Generar token
    const token = generateToken({
      userId: user.id,
      role: user.role,
      clanId: user.clanId || undefined
    });

    return {
      user: userWithoutPassword,
      token,
    };
  }

  // Completar registro de Discord
  async completeDiscordRegistration(data: {
    discordId: string;
    discordUsername: string;
    email?: string;
    nickname: string;
    clanId: string;
  }) {
    // Verificar si el clan existe
    const clan = await prisma.clan.findUnique({
      where: { id: data.clanId }
    });

    if (!clan) {
      throw new Error('Clan no encontrado');
    }

    // Crear usuario
    const user = await prisma.user.create({
      data: {
        discordId: data.discordId,
        discordUsername: data.discordUsername,
        email: data.email,
        nickname: data.nickname,
        clanId: data.clanId,
        status: UserStatus.PENDING,
        role: UserRole.USER
      },
      select: {
        id: true,
        email: true,
        nickname: true,
        role: true,
        status: true,
        clanId: true,
        discordId: true,
        clan: {
          select: {
            id: true,
            name: true,
            tag: true,
            avatarUrl: true,
          }
        }
      }
    });

    logger.info('User registered (Discord)', { userId: user.id });

    return user;
  }

  // Login con Discord (usuario existente)
  async loginDiscord(discordId: string) {
    const user = await prisma.user.findUnique({
      where: { discordId },
      include: {
        clan: {
          select: {
            id: true,
            name: true,
            tag: true,
            avatarUrl: true,
          }
        }
      }
    });

    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    if (user.status === UserStatus.BANNED) {
      throw new Error('Usuario baneado');
    }

    // Generar token
    const token = generateToken({
      userId: user.id,
      role: user.role,
      clanId: user.clanId || undefined
    });

    logger.info('User logged in (Discord)', { userId: user.id });

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        nickname: user.nickname,
        role: user.role,
        status: user.status,
        clanId: user.clanId,
        avatarUrl: user.avatarUrl,
        clan: user.clan
      }
    };
  }

  /**
   * Upsert user from Discord OAuth2
   * Crea un nuevo usuario o actualiza uno existente basándose en Discord ID
   * También crea/actualiza el OAuthAccount para almacenar tokens
   */
  async upsertUserFromDiscord(data: {
    discordId: string;
    discordUsername: string;
    email?: string;
    accessToken: string;
    refreshToken?: string;
    expiresIn: number;
    scope: string;
  }) {
    const expiresAt = Math.floor(Date.now() / 1000) + data.expiresIn;

    // Buscar usuario existente por Discord ID
    let user = await prisma.user.findUnique({
      where: { discordId: data.discordId },
      include: {
        clan: {
          select: {
            id: true,
            name: true,
            tag: true,
            avatarUrl: true,
          }
        }
      }
    });

    if (user) {
      // Usuario existe: actualizar info Discord
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          discordUsername: data.discordUsername,
          email: data.email || user.email,
        },
        include: {
          clan: {
            select: {
              id: true,
              name: true,
              tag: true,
              avatarUrl: true,
            }
          }
        }
      });

      // Upsert OAuthAccount con tokens cifrados
      await prisma.oAuthAccount.upsert({
        where: {
          provider_providerAccountId: {
            provider: 'discord',
            providerAccountId: data.discordId,
          }
        },
        create: {
          userId: user.id,
          provider: 'discord',
          providerAccountId: data.discordId,
          // SEGURIDAD: Cifrar tokens antes de almacenar
          accessToken: encrypt(data.accessToken),
          refreshToken: data.refreshToken ? encrypt(data.refreshToken) : null,
          tokenType: 'Bearer',
          scope: data.scope,
          expiresAt,
        },
        update: {
          // SEGURIDAD: Cifrar tokens antes de almacenar
          accessToken: encrypt(data.accessToken),
          refreshToken: data.refreshToken ? encrypt(data.refreshToken) : null,
          tokenType: 'Bearer',
          scope: data.scope,
          expiresAt,
        }
      });

      logger.info('User logged in via Discord OAuth2', { userId: user.id });

      return {
        user: {
          id: user.id,
          email: user.email,
          nickname: user.nickname,
          role: user.role,
          status: user.status,
          clanId: user.clanId,
          avatarUrl: user.avatarUrl,
          clan: user.clan,
          discordId: user.discordId,
          discordUsername: user.discordUsername,
        },
        isNewUser: false,
      };
    }

    // Usuario no existe: crear nuevo en estado PENDING
    // Se requiere que el usuario complete su registro (nickname + clan)
    // Por ahora, creamos un usuario temporal con nickname = discordUsername
    const newUser = await prisma.user.create({
      data: {
        discordId: data.discordId,
        discordUsername: data.discordUsername,
        email: data.email,
        nickname: data.discordUsername, // Temporal
        status: UserStatus.PENDING,
        role: UserRole.USER,
      },
      include: {
        clan: {
          select: {
            id: true,
            name: true,
            tag: true,
            avatarUrl: true,
          }
        }
      }
    });

    // Crear OAuthAccount con tokens cifrados
    await prisma.oAuthAccount.create({
      data: {
        userId: newUser.id,
        provider: 'discord',
        providerAccountId: data.discordId,
        // SEGURIDAD: Cifrar tokens antes de almacenar
        accessToken: encrypt(data.accessToken),
        refreshToken: data.refreshToken ? encrypt(data.refreshToken) : null,
        tokenType: 'Bearer',
        scope: data.scope,
        expiresAt,
      }
    });

    logger.info('New user created via Discord OAuth2', { userId: newUser.id });

    return {
      user: {
        id: newUser.id,
        email: newUser.email,
        nickname: newUser.nickname,
        role: newUser.role,
        status: newUser.status,
        clanId: newUser.clanId,
        avatarUrl: newUser.avatarUrl,
        clan: newUser.clan,
        discordId: newUser.discordId,
        discordUsername: newUser.discordUsername,
      },
      isNewUser: true,
    };
  }

  /**
   * Link Discord account to existing user (account linking)
   * Requiere que el usuario esté autenticado
   */
  async linkDiscordAccount(data: {
    userId: string;
    discordId: string;
    discordUsername: string;
    email?: string;
    accessToken: string;
    refreshToken?: string;
    expiresIn: number;
    scope: string;
  }) {
    const expiresAt = Math.floor(Date.now() / 1000) + data.expiresIn;

    // Verificar que el usuario existe
    const user = await prisma.user.findUnique({
      where: { id: data.userId }
    });

    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    // Verificar que el Discord ID no esté ya vinculado a otro usuario
    const existingDiscordUser = await prisma.user.findUnique({
      where: { discordId: data.discordId }
    });

    if (existingDiscordUser && existingDiscordUser.id !== data.userId) {
      throw new Error('Esta cuenta de Discord ya está vinculada a otro usuario');
    }

    // Actualizar usuario con info de Discord
    const updatedUser = await prisma.user.update({
      where: { id: data.userId },
      data: {
        discordId: data.discordId,
        discordUsername: data.discordUsername,
        email: data.email || user.email,
      },
      include: {
        clan: {
          select: {
            id: true,
            name: true,
            tag: true,
            avatarUrl: true,
          }
        }
      }
    });

    // Upsert OAuthAccount con tokens cifrados
    await prisma.oAuthAccount.upsert({
      where: {
        provider_providerAccountId: {
          provider: 'discord',
          providerAccountId: data.discordId,
        }
      },
      create: {
        userId: data.userId,
        provider: 'discord',
        providerAccountId: data.discordId,
        // SEGURIDAD: Cifrar tokens antes de almacenar
        accessToken: encrypt(data.accessToken),
        refreshToken: data.refreshToken ? encrypt(data.refreshToken) : null,
        tokenType: 'Bearer',
        scope: data.scope,
        expiresAt,
      },
      update: {
        userId: data.userId, // Actualizar userId en caso de que existiera con otro user
        // SEGURIDAD: Cifrar tokens antes de almacenar
        accessToken: encrypt(data.accessToken),
        refreshToken: data.refreshToken ? encrypt(data.refreshToken) : null,
        tokenType: 'Bearer',
        scope: data.scope,
        expiresAt,
      }
    });

    logger.info('Discord account linked to user', { userId: data.userId, discordId: data.discordId });

    return {
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        nickname: updatedUser.nickname,
        role: updatedUser.role,
        status: updatedUser.status,
        clanId: updatedUser.clanId,
        avatarUrl: updatedUser.avatarUrl,
        clan: updatedUser.clan,
        discordId: updatedUser.discordId,
        discordUsername: updatedUser.discordUsername,
      }
    };
  }
}

export const authService = new AuthService();