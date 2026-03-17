import { Request, Response } from 'express';
import { authService } from '../services/auth.service';
import { discordService } from '../services/discord.service';
import { successResponse, errorResponse } from '../utils/responses';
import { isValidEmail, isStrongPassword, normalizeEmail, sanitizeNickname } from '../utils/validators';
import { logger } from '../utils/logger';
import { prisma } from '../index';
import { generateState, validateState } from '../utils/crypto';
import { setJWTCookie, clearJWTCookie, getCookieOptions } from '../utils/jwt';
import { getEffectivePermissions } from '../auth/rbac';

const getFrontendBaseUrl = (): string => {
  const fallbackUrl = 'http://localhost:5173';
  const rawUrl = process.env.FRONTEND_URL || fallbackUrl;
  const frontendPort = process.env.FRONTEND_PORT;

  try {
    const url = new URL(rawUrl);
    const defaultPort = url.protocol === 'https:' ? '443' : '80';

    if (frontendPort && !url.port && frontendPort !== defaultPort) {
      url.port = frontendPort;
    }

    return url.origin;
  } catch {
    return fallbackUrl;
  }
};

export class AuthController {
  // POST /api/auth/register/local
  async registerLocal(req: Request, res: Response) {
    try {
      const {
        email,
        password,
        nickname,
        clanId,
        requestNewClan,
        newClanName,
        newClanTag,
        newClanDescription,
        newClanPrimaryGameId,
      } = req.body;

      // Validaciones
      if (!email || !password || !nickname) {
        return errorResponse(res, 'Email, contraseña y nickname son obligatorios', 400);
      }

      if (!isValidEmail(email)) {
        return errorResponse(res, 'Email inválido', 400);
      }

      const normalizedEmail = normalizeEmail(String(email));

      if (!isStrongPassword(password)) {
        return errorResponse(
          res,
          'La contraseña debe tener mínimo 8 caracteres, una mayúscula, una minúscula y un número',
          400
        );
      }

      const cleanNickname = sanitizeNickname(nickname);
      if (cleanNickname.length < 3) {
        return errorResponse(res, 'El nickname debe tener al menos 3 caracteres', 400);
      }

      const wantsNewClan = requestNewClan === true || requestNewClan === 'true';

      if (!wantsNewClan && !clanId) {
        return errorResponse(res, 'Debes seleccionar un clan o solicitar uno nuevo', 400);
      }

      if (wantsNewClan) {
        if (!newClanName || !newClanPrimaryGameId) {
          return errorResponse(
            res,
            'Para solicitar un nuevo clan debes indicar nombre y juego principal',
            400
          );
        }

        if (String(newClanName).trim().length < 3) {
          return errorResponse(res, 'El nombre del nuevo clan debe tener al menos 3 caracteres', 400);
        }
      }

      // Registrar usuario
      const user = await authService.registerLocal({
        email: normalizedEmail,
        password,
        nickname: cleanNickname,
        clanId: wantsNewClan ? undefined : clanId,
        clanCreationRequest: wantsNewClan
          ? {
              requestedName: String(newClanName).trim(),
              requestedTag: newClanTag ? String(newClanTag).trim() : undefined,
              requestedDescription: newClanDescription
                ? String(newClanDescription).trim()
                : undefined,
              primaryGameId: String(newClanPrimaryGameId),
            }
          : undefined,
      });

      return successResponse(
        res,
        { user },
        wantsNewClan
          ? 'Solicitud enviada. Un administrador debe aprobar la creación del nuevo clan antes de que puedas iniciar sesión.'
          : 'Usuario registrado correctamente. Pendiente de validación por administrador o líder de clan.',
        201
      );
    } catch (error: any) {
      logger.error('Error in registerLocal', error);
      return errorResponse(res, error.message || 'Error al registrar usuario', 500);
    }
  }

  // POST /api/auth/login/local
  async loginLocal(req: Request, res: Response) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return errorResponse(res, 'Email y contraseña son obligatorios', 400);
      }

      const result = await authService.loginLocal(normalizeEmail(String(email)), password);

      // Establecer JWT en cookie httpOnly (además de devolverlo en el body por compatibilidad)
      setJWTCookie(res, {
        userId: result.user.id,
        role: result.user.role,
        clanId: result.user.clanId || undefined,
      });

      logger.audit('USER_LOGIN', result.user.id, { method: 'local', ip: req.ip });

      return successResponse(res, result, 'Login exitoso');
    } catch (error: any) {
      logger.error('Error in loginLocal', error);
      return errorResponse(res, error.message || 'Error al iniciar sesión', 401);
    }
  }

  // POST /api/auth/forgot-password
  async forgotPassword(req: Request, res: Response) {
    try {
      const { email } = req.body;

      if (!email || !isValidEmail(String(email))) {
        return errorResponse(res, 'Email inválido', 400);
      }

      await authService.requestPasswordReset(String(email));

      return successResponse(
        res,
        {},
        'Si el email existe, recibirás instrucciones para restablecer la contraseña'
      );
    } catch (error: any) {
      logger.error('Error in forgotPassword', error);
      return errorResponse(
        res,
        'No se pudo procesar la solicitud de restablecimiento',
        500
      );
    }
  }

  // POST /api/auth/reset-password
  async resetPassword(req: Request, res: Response) {
    try {
      const { token, newPassword } = req.body;

      if (!token || typeof token !== 'string') {
        return errorResponse(res, 'Token inválido', 400);
      }

      if (!newPassword || !isStrongPassword(String(newPassword))) {
        return errorResponse(
          res,
          'La contraseña debe tener mínimo 8 caracteres, una mayúscula, una minúscula y un número',
          400
        );
      }

      await authService.resetPasswordWithToken(token, String(newPassword));

      return successResponse(res, {}, 'Contraseña restablecida correctamente');
    } catch (error: any) {
      logger.error('Error in resetPassword', error);
      return errorResponse(
        res,
        error.message || 'No se pudo restablecer la contraseña',
        400
      );
    }
  }

  // POST /api/auth/register/discord
  async completeDiscordRegistration(req: Request, res: Response) {
    try {
      const { discordId, discordUsername, email, nickname, clanId } = req.body;

      // Validaciones
      if (!discordId || !nickname || !clanId) {
        return errorResponse(res, 'Datos incompletos', 400);
      }

      const cleanNickname = sanitizeNickname(nickname);
      if (cleanNickname.length < 3) {
        return errorResponse(res, 'El nickname debe tener al menos 3 caracteres', 400);
      }

      // Completar registro
      const user = await authService.completeDiscordRegistration({
        discordId,
        discordUsername,
        email,
        nickname: cleanNickname,
        clanId
      });

      return successResponse(
        res,
        { user },
        'Registro completado. Pendiente de validación por administrador o líder de clan.',
        201
      );
    } catch (error: any) {
      logger.error('Error in completeDiscordRegistration', error);
      return errorResponse(res, error.message || 'Error al completar registro', 500);
    }
  }

  // GET /api/auth/me - Obtener usuario actual
  async getMe(req: Request, res: Response) {
    try {
      const userId = req.user!.id;

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          nickname: true,
          timezone: true,
          mustCreateClanOnboarding: true,
          role: true,
          status: true,
          clanId: true,
          avatarUrl: true,
          createdAt: true,
          updatedAt: true,
          discordId: true,
          discordUsername: true,
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
          permissionOverrides: {
            select: {
              permission: true,
              enabled: true,
            },
          },
        },
      });

      if (!user) {
        return errorResponse(res, 'Usuario no encontrado', 404);
      }

      const { permissionOverrides, ...userWithoutOverrides } = user;

      return successResponse(
        res,
        {
          user: {
            ...userWithoutOverrides,
            permissions: getEffectivePermissions(user.role, permissionOverrides),
          },
        },
        'Usuario obtenido exitosamente'
      );
    } catch (error: any) {
      logger.error('Error in getMe', error);
      return errorResponse(res, error.message || 'Error al obtener usuario', 500);
    }
  }

  // GET /api/auth/discord/start - Iniciar OAuth2 flow con Discord
  async discordStart(req: Request, res: Response) {
    try {
      const state = generateState();
      const scope = 'identify email';

      // Guardar state en cookie httpOnly temporal (5 min)
      res.cookie('discord_oauth_state', state, {
        httpOnly: true,
        secure: process.env.COOKIE_SECURE === 'true',
        sameSite: (process.env.COOKIE_SAMESITE || 'lax') as 'strict' | 'lax' | 'none',
        path: '/',
        maxAge: 5 * 60 * 1000, // 5 minutos
      });

      const authUrl = discordService.getAuthorizationUrl(state, scope);

      // Redirigir al usuario a Discord
      return res.redirect(authUrl);
    } catch (error: any) {
      logger.error('Error in discordStart', error);
      return errorResponse(res, 'Error al iniciar OAuth2 con Discord', 500);
    }
  }

  // GET /api/auth/discord/callback - Callback OAuth2 de Discord
  async discordCallback(req: Request, res: Response) {
    try {
      const { code, state } = req.query;
      const savedState = req.cookies.discord_oauth_state;

      // Validar state anti-CSRF
      if (!validateState(state as string, savedState)) {
        logger.warn('Discord OAuth2 state mismatch');
        return res.redirect(`${getFrontendBaseUrl()}/login?error=invalid_state`);
      }

      // Limpiar cookie de state (con las mismas opciones para que el navegador la elimine)
      const cookieOpts = getCookieOptions();
      res.clearCookie('discord_oauth_state', {
        httpOnly: cookieOpts.httpOnly,
        secure: cookieOpts.secure,
        sameSite: cookieOpts.sameSite,
        path: cookieOpts.path,
      });

      if (!code || typeof code !== 'string') {
        logger.warn('Discord OAuth2 missing code');
        return res.redirect(`${getFrontendBaseUrl()}/login?error=missing_code`);
      }

      // Intercambiar code por tokens
      const tokenResponse = await discordService.exchangeCodeForTokens(code);

      // Obtener info del usuario de Discord
      const discordUser = await discordService.fetchDiscordUser(tokenResponse.access_token);

      // Upsert user en nuestra DB
      const { user, isNewUser } = await authService.upsertUserFromDiscord({
        discordId: discordUser.id,
        discordUsername: discordUser.username,
        email: discordUser.email,
        accessToken: tokenResponse.access_token,
        refreshToken: tokenResponse.refresh_token,
        expiresIn: tokenResponse.expires_in,
        scope: tokenResponse.scope,
      });

      const frontendUrl = getFrontendBaseUrl();

      const buildDiscordCompletionUrl = () => {
        const url = new URL('/auth/discord/complete', frontendUrl);
        url.searchParams.set('discordId', user.discordId || discordUser.id);
        url.searchParams.set('discordUsername', user.discordUsername || discordUser.username);
        if (user.email) {
          url.searchParams.set('email', user.email);
        }
        return url.toString();
      };

      // Usuario nuevo o pendiente sin clan: completar datos mínimos antes de enviarlo a validación.
      if (isNewUser || (user.status === 'PENDING' && !user.clanId)) {
        logger.info('Discord user requires registration completion', {
          userId: user.id,
          isNewUser,
          hasClan: Boolean(user.clanId),
        });
        return res.redirect(buildDiscordCompletionUrl());
      }

      // Usuario existente: verificar estado antes de establecer sesión
      if (user.status === 'PENDING') {
        logger.info('Existing Discord user still pending approval', { userId: user.id });
        return res.redirect(`${frontendUrl}/auth/pending`);
      }

      if (user.status === 'BANNED') {
        logger.warn('Banned user attempted login via Discord', { userId: user.id });
        return res.redirect(`${frontendUrl}/login?error=banned`);
      }

      // Usuario activo: establecer JWT en cookie httpOnly
      setJWTCookie(res, {
        userId: user.id,
        role: user.role,
        clanId: user.clanId || undefined,
      });

      // Redirigir al frontend (ruta de éxito)
      return res.redirect(`${frontendUrl}/auth/discord/success`);
    } catch (error: any) {
      logger.error('Error in discordCallback', error);
      const frontendUrl = getFrontendBaseUrl();
      return res.redirect(`${frontendUrl}/login?error=discord_auth_failed`);
    }
  }

  // POST /api/auth/logout - Logout (clear JWT cookie and blacklist token)
  async logout(req: Request, res: Response) {
    try {
      // Obtener el token actual para añadirlo a la blacklist
      const token = req.cookies?.token;

      // Limpiar cookie y revocar token
      clearJWTCookie(res, token);

      logger.audit('USER_LOGOUT', req.user?.id, { ip: req.ip });

      return successResponse(res, null, 'Logout exitoso');
    } catch (error: any) {
      logger.error('Error in logout', error);
      return errorResponse(res, 'Error al cerrar sesión', 500);
    }
  }

  // GET /api/auth/discord/link/start - Iniciar OAuth2 flow para vincular cuenta
  async discordLinkStart(req: Request, res: Response) {
    try {
      if (!req.user) {
        return errorResponse(res, 'No autenticado', 401);
      }

      const state = generateState();
      const scope = 'identify email';

      // Guardar state en cookie httpOnly temporal (5 min)
      res.cookie('discord_link_state', state, {
        httpOnly: true,
        secure: process.env.COOKIE_SECURE === 'true',
        sameSite: (process.env.COOKIE_SAMESITE || 'lax') as 'strict' | 'lax' | 'none',
        path: '/',
        maxAge: 5 * 60 * 1000, // 5 minutos
      });

      const authUrl = discordService.getAuthorizationUrl(state, scope);

      // Redirigir al usuario a Discord
      return res.redirect(authUrl);
    } catch (error: any) {
      logger.error('Error in discordLinkStart', error);
      return errorResponse(res, 'Error al iniciar vinculación con Discord', 500);
    }
  }

  // GET /api/auth/discord/link/callback - Callback OAuth2 para vincular cuenta
  async discordLinkCallback(req: Request, res: Response) {
    try {
      if (!req.user) {
        logger.warn('Discord link callback without authenticated user');
        return res.redirect(`${getFrontendBaseUrl()}/login?error=not_authenticated`);
      }

      const { code, state } = req.query;
      const savedState = req.cookies.discord_link_state;

      // Validar state anti-CSRF
      if (!validateState(state as string, savedState)) {
        logger.warn('Discord link state mismatch');
        return res.redirect(`${getFrontendBaseUrl()}/profile?error=invalid_state`);
      }

      // Limpiar cookie de state (con las mismas opciones para que el navegador la elimine)
      const linkCookieOpts = getCookieOptions();
      res.clearCookie('discord_link_state', {
        httpOnly: linkCookieOpts.httpOnly,
        secure: linkCookieOpts.secure,
        sameSite: linkCookieOpts.sameSite,
        path: linkCookieOpts.path,
      });

      if (!code || typeof code !== 'string') {
        logger.warn('Discord link missing code');
        return res.redirect(`${getFrontendBaseUrl()}/profile?error=missing_code`);
      }

      // Intercambiar code por tokens
      const tokenResponse = await discordService.exchangeCodeForTokens(code);

      // Obtener info del usuario de Discord
      const discordUser = await discordService.fetchDiscordUser(tokenResponse.access_token);

      // Vincular cuenta Discord al usuario actual
      const { user } = await authService.linkDiscordAccount({
        userId: req.user.id,
        discordId: discordUser.id,
        discordUsername: discordUser.username,
        email: discordUser.email,
        accessToken: tokenResponse.access_token,
        refreshToken: tokenResponse.refresh_token,
        expiresIn: tokenResponse.expires_in,
        scope: tokenResponse.scope,
      });

      // Actualizar JWT cookie con info actualizada
      setJWTCookie(res, {
        userId: user.id,
        role: user.role,
        clanId: user.clanId || undefined,
      });

      // Redirigir al perfil con mensaje de éxito
      const frontendUrl = getFrontendBaseUrl();
      return res.redirect(`${frontendUrl}/profile?discord_linked=true`);
    } catch (error: any) {
      logger.error('Error in discordLinkCallback', error);
      const frontendUrl = getFrontendBaseUrl();
      return res.redirect(`${frontendUrl}/profile?error=discord_link_failed&message=${encodeURIComponent(error.message)}`);
    }
  }
}

export const authController = new AuthController();
