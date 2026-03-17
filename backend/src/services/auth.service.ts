import { prisma } from '../index';
import { hashPassword, comparePassword } from '../utils/password';
import { generateToken } from '../utils/jwt';
import { encrypt } from '../utils/encryption';
import { logger } from '../utils/logger';
import crypto from 'crypto';
import { ClanCreationRequestStatus, UserStatus, UserRole } from '@prisma/client';
import { getEffectivePermissions } from '../auth/rbac';
import { mailService } from './mail.service';
import { normalizeEmail } from '../utils/validators';

export class AuthService {
  private getPasswordResetExpiryMinutes() {
    const raw = Number(process.env.PASSWORD_RESET_TOKEN_TTL_MINUTES || 30);
    return Number.isFinite(raw) && raw > 0 ? raw : 30;
  }

  private buildPasswordResetUrl(token: string) {
    const baseUrl =
      process.env.PASSWORD_RESET_URL ||
      `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password`;

    const url = new URL(baseUrl);
    url.searchParams.set('token', token);
    return url.toString();
  }

  private hashResetToken(token: string) {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  // Registro local (email + password)
  async registerLocal(data: {
    email: string;
    password: string;
    nickname: string;
    clanId?: string;
    clanCreationRequest?: {
      requestedName: string;
      requestedTag?: string;
      requestedDescription?: string;
      primaryGameId: string;
    };
  }) {
    const normalizedEmail = normalizeEmail(data.email);

    // Verificar si el email ya existe
    const existingUser = await prisma.user.findFirst({
      where: {
        email: {
          equals: normalizedEmail,
          mode: 'insensitive',
        },
      },
    });

    if (existingUser) {
      throw new Error('Solo se permite una cuenta por correo electrónico. Ese email ya está registrado.');
    }

    if (!data.clanId && !data.clanCreationRequest) {
      throw new Error('Debes seleccionar un clan o solicitar uno nuevo');
    }

    if (data.clanId && data.clanCreationRequest) {
      throw new Error('No puedes registrarte con un clan existente y solicitar uno nuevo a la vez');
    }

    if (data.clanId) {
      const clan = await prisma.clan.findUnique({
        where: { id: data.clanId }
      });

      if (!clan) {
        throw new Error('Clan no encontrado');
      }
    }

    if (data.clanCreationRequest) {
      const game = await prisma.game.findUnique({
        where: { id: data.clanCreationRequest.primaryGameId },
        select: { id: true },
      });

      if (!game) {
        throw new Error('Juego principal no encontrado');
      }
    }

    // Hash de la contraseña
    const hashedPassword = await hashPassword(data.password);

    // Crear usuario
    const user = await prisma.$transaction(async (tx) => {
      const createdUser = await tx.user.create({
        data: {
          email: normalizedEmail,
          password: hashedPassword,
          nickname: data.nickname,
          clanId: data.clanId || null,
          status: UserStatus.PENDING,
          role: UserRole.USER
        },
      });

      if (data.clanCreationRequest) {
        await tx.clanCreationRequest.create({
          data: {
            userId: createdUser.id,
            requestedName: data.clanCreationRequest.requestedName,
            requestedTag: data.clanCreationRequest.requestedTag || null,
            requestedDescription: data.clanCreationRequest.requestedDescription || null,
            primaryGameId: data.clanCreationRequest.primaryGameId,
            status: ClanCreationRequestStatus.PENDING,
          },
        });
      }

      return tx.user.findUnique({
        where: { id: createdUser.id },
        select: {
          id: true,
          email: true,
          nickname: true,
          timezone: true,
          mustCreateClanOnboarding: true,
          role: true,
          status: true,
          clanId: true,
          clan: {
            select: {
              id: true,
              name: true,
              tag: true,
              avatarUrl: true,
              primaryGameId: true,
              primaryGame: true,
            }
          },
          gameIdentities: {
            include: {
              game: true,
            },
          },
          permissionOverrides: {
            select: {
              permission: true,
              enabled: true,
            },
          },
        }
      });
    });

    if (!user) {
      throw new Error('No se pudo completar el registro');
    }

    logger.info('User registered (local)', { userId: user.id });

    return user;
  }

  // Login local
  async loginLocal(email: string, password: string) {
    const normalizedEmail = normalizeEmail(email);

    // Buscar usuario
    const user = await prisma.user.findFirst({
      where: {
        email: {
          equals: normalizedEmail,
          mode: 'insensitive',
        },
      },
      select: {
        id: true,
        email: true,
        password: true,
        nickname: true,
        timezone: true,
        mustCreateClanOnboarding: true,
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
            primaryGameId: true,
            primaryGame: true,
          },
        },
        gameIdentities: {
          include: {
            game: true,
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
    const { password: _, permissionOverrides, ...userWithoutPassword } = user;

    // Generar token
    const token = generateToken({
      userId: user.id,
      role: user.role,
      clanId: user.clanId || undefined
    });

    return {
      user: {
        ...userWithoutPassword,
        permissions: getEffectivePermissions(user.role, permissionOverrides),
      },
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
    const normalizedEmail = data.email ? normalizeEmail(data.email) : null;

    // Verificar si el clan existe
    const clan = await prisma.clan.findUnique({
      where: { id: data.clanId }
    });

    if (!clan) {
      throw new Error('Clan no encontrado');
    }

    const existingDiscordUser = await prisma.user.findUnique({
      where: { discordId: data.discordId },
      select: {
        id: true,
        status: true,
        clanId: true,
        email: true,
      },
    });

    const user = await prisma.user.upsert({
      where: { discordId: data.discordId },
      update: {
        discordUsername: data.discordUsername,
        email: normalizedEmail || existingDiscordUser?.email || null,
        nickname: data.nickname,
        clanId: data.clanId,
        status: UserStatus.PENDING,
        role: UserRole.USER,
      },
      create: {
        discordId: data.discordId,
        discordUsername: data.discordUsername,
        email: normalizedEmail,
        nickname: data.nickname,
        clanId: data.clanId,
        status: UserStatus.PENDING,
        role: UserRole.USER
      },
      select: {
        id: true,
        email: true,
        nickname: true,
        timezone: true,
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
            primaryGameId: true,
            primaryGame: true,
          }
        },
        gameIdentities: {
          include: {
            game: true,
          },
        },
        permissionOverrides: {
          select: {
            permission: true,
            enabled: true,
          },
        },
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
            primaryGameId: true,
            primaryGame: true,
          }
        },
        gameIdentities: {
          include: {
            game: true,
          },
        },
        permissionOverrides: {
          select: {
            permission: true,
            enabled: true,
          },
        },
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
        timezone: user.timezone,
        role: user.role,
        permissions: getEffectivePermissions(user.role, user.permissionOverrides),
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
    const normalizedEmail = data.email ? normalizeEmail(data.email) : null;

    // Buscar usuario existente por Discord ID
    const existingUser = await prisma.user.findUnique({
      where: { discordId: data.discordId },
      include: {
        clan: {
          select: {
            id: true,
            name: true,
            tag: true,
            avatarUrl: true,
            primaryGameId: true,
            primaryGame: true,
          }
        },
        gameIdentities: {
          include: {
            game: true,
          },
        },
      }
    });

    if (existingUser) {
      // Usuario existe: actualizar info Discord
      const updatedUser = await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          discordUsername: data.discordUsername,
          email: data.email || existingUser.email,
        },
        include: {
          clan: {
            select: {
              id: true,
              name: true,
              tag: true,
              avatarUrl: true,
              primaryGameId: true,
              primaryGame: true,
            }
          },
          gameIdentities: {
            include: {
              game: true,
            },
          },
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
          userId: updatedUser.id,
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

      logger.info('User logged in via Discord OAuth2', { userId: updatedUser.id });

      return {
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          nickname: updatedUser.nickname,
          timezone: updatedUser.timezone,
          role: updatedUser.role,
          status: updatedUser.status,
          clanId: updatedUser.clanId,
          avatarUrl: updatedUser.avatarUrl,
          clan: updatedUser.clan,
          gameIdentities: updatedUser.gameIdentities,
          discordId: updatedUser.discordId,
          discordUsername: updatedUser.discordUsername,
        },
        isNewUser: false,
      };
    }

    const existingUserByEmail = normalizedEmail
      ? await prisma.user.findFirst({
          where: {
            email: {
              equals: normalizedEmail,
              mode: 'insensitive',
            },
          },
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
            },
          },
        })
      : null;

    if (existingUserByEmail) {
      if (existingUserByEmail.discordId && existingUserByEmail.discordId !== data.discordId) {
        throw new Error('Ya existe una cuenta con ese email vinculada a otro Discord');
      }

      const linkedUser = await prisma.user.update({
        where: { id: existingUserByEmail.id },
        data: {
          discordId: data.discordId,
          discordUsername: data.discordUsername,
          email: normalizedEmail,
        },
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
          },
        },
      });

      await prisma.oAuthAccount.upsert({
        where: {
          provider_providerAccountId: {
            provider: 'discord',
            providerAccountId: data.discordId,
          },
        },
        create: {
          userId: linkedUser.id,
          provider: 'discord',
          providerAccountId: data.discordId,
          accessToken: encrypt(data.accessToken),
          refreshToken: data.refreshToken ? encrypt(data.refreshToken) : null,
          tokenType: 'Bearer',
          scope: data.scope,
          expiresAt,
        },
        update: {
          userId: linkedUser.id,
          accessToken: encrypt(data.accessToken),
          refreshToken: data.refreshToken ? encrypt(data.refreshToken) : null,
          tokenType: 'Bearer',
          scope: data.scope,
          expiresAt,
        },
      });

      logger.info('Existing user linked and logged in via Discord OAuth2', {
        userId: linkedUser.id,
        discordId: data.discordId,
      });

      return {
        user: {
          id: linkedUser.id,
          email: linkedUser.email,
          nickname: linkedUser.nickname,
          timezone: linkedUser.timezone,
          role: linkedUser.role,
          status: linkedUser.status,
          clanId: linkedUser.clanId,
          avatarUrl: linkedUser.avatarUrl,
          clan: linkedUser.clan,
          gameIdentities: linkedUser.gameIdentities,
          discordId: linkedUser.discordId,
          discordUsername: linkedUser.discordUsername,
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
        email: normalizedEmail,
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
            primaryGameId: true,
            primaryGame: true,
          }
        },
        gameIdentities: {
          include: {
            game: true,
          },
        },
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
        timezone: newUser.timezone,
        role: newUser.role,
        status: newUser.status,
        clanId: newUser.clanId,
        avatarUrl: newUser.avatarUrl,
        clan: newUser.clan,
        gameIdentities: newUser.gameIdentities,
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
            primaryGameId: true,
            primaryGame: true,
          }
        },
        gameIdentities: {
          include: {
            game: true,
          },
        },
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
        timezone: updatedUser.timezone,
        role: updatedUser.role,
        status: updatedUser.status,
        clanId: updatedUser.clanId,
        avatarUrl: updatedUser.avatarUrl,
        clan: updatedUser.clan,
        gameIdentities: updatedUser.gameIdentities,
        discordId: updatedUser.discordId,
        discordUsername: updatedUser.discordUsername,
      }
    };
  }

  async requestPasswordReset(email: string) {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await prisma.user.findFirst({
      where: {
        email: {
          equals: normalizedEmail,
          mode: 'insensitive',
        },
        deletedAt: null,
      },
      select: {
        id: true,
        email: true,
        nickname: true,
        password: true,
        status: true,
      },
    });

    if (!user || !user.email || user.status === UserStatus.BANNED) {
      logger.info('Password reset requested for non-eligible account', { email: normalizedEmail });
      return;
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + this.getPasswordResetExpiryMinutes() * 60 * 1000);
    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = this.hashResetToken(token);

    await prisma.$transaction(async (tx) => {
      await tx.passwordResetToken.updateMany({
        where: {
          userId: user.id,
          usedAt: null,
        },
        data: {
          usedAt: now,
        },
      });

      await tx.passwordResetToken.create({
        data: {
          userId: user.id,
          tokenHash,
          expiresAt,
        },
      });
    });

    const resetUrl = this.buildPasswordResetUrl(token);
    await mailService.sendPasswordResetEmail({
      email: user.email,
      nickname: user.nickname,
      resetUrl,
      expiresAt,
    });

    logger.info('Password reset token issued', {
      userId: user.id,
      expiresAt: expiresAt.toISOString(),
    });
  }

  async resetPasswordWithToken(token: string, newPassword: string) {
    const tokenHash = this.hashResetToken(token);
    const now = new Date();

    const resetToken = await prisma.passwordResetToken.findFirst({
      where: {
        tokenHash,
        usedAt: null,
        expiresAt: {
          gt: now,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            status: true,
            deletedAt: true,
          },
        },
      },
    });

    if (!resetToken || !resetToken.user || resetToken.user.deletedAt) {
      throw new Error('Token de restablecimiento inválido o expirado');
    }

    const hashedPassword = await hashPassword(newPassword);

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: resetToken.userId },
        data: {
          password: hashedPassword,
        },
      });

      await tx.passwordResetToken.updateMany({
        where: {
          userId: resetToken.userId,
          usedAt: null,
        },
        data: {
          usedAt: now,
        },
      });

      await tx.auditLog.create({
        data: {
          action: 'USER_PASSWORD_RESET_BY_TOKEN',
          entity: 'User',
          entityId: resetToken.userId,
          userId: resetToken.userId,
          details: JSON.stringify({
            resetTokenId: resetToken.id,
          }),
        },
      });
    });

    logger.info('Password reset completed via token', { userId: resetToken.userId });
  }
}

export const authService = new AuthService();
