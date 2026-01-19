import { prisma } from '../index';
import { hashPassword, comparePassword } from '../utils/password';
import { generateToken } from '../utils/jwt';
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
            name: true,
            tag: true
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
      include: {
        clan: {
          select: {
            name: true,
            tag: true
          }
        }
      }
    });

    if (!user || !user.password) {
      throw new Error('Credenciales inválidas');
    }

    // Verificar contraseña
    const isValidPassword = await comparePassword(password, user.password);

    if (!isValidPassword) {
      throw new Error('Credenciales inválidas');
    }

    // Verificar estado ANTES de generar token
    if (user.status === UserStatus.BANNED) {
      throw new Error('Usuario baneado');
    }

    if (user.status === UserStatus.PENDING) {
      throw new Error('Usuario pendiente de validación');
    }

    if (user.status === UserStatus.BLOCKED) {
      throw new Error('Usuario bloqueado');
    }

    if (user.status === UserStatus.INACTIVE) {
      throw new Error('Usuario inactivo');
    }

    // Solo usuarios ACTIVE pueden hacer login
    if (user.status !== UserStatus.ACTIVE) {
      throw new Error('Usuario no puede iniciar sesión');
    }

    // Generar token
    const token = generateToken({
      userId: user.id,
      role: user.role,
      clanId: user.clanId || undefined
    });

    logger.info('User logged in', { userId: user.id });

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        nickname: user.nickname,
        role: user.role,
        status: user.status,
        clanId: user.clanId,
        clan: user.clan
      }
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
            name: true,
            tag: true
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
            name: true,
            tag: true
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
        clan: user.clan
      }
    };
  }
}

export const authService = new AuthService();