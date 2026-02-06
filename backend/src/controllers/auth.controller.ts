import { Request, Response } from 'express';
import { authService } from '../services/auth.service';
import { discordService } from '../services/discord.service';
import { successResponse, errorResponse } from '../utils/responses';
import { isValidEmail, isStrongPassword, sanitizeNickname } from '../utils/validators';
import { logger } from '../utils/logger';
import { prisma } from '../index';
import { generateState, validateState } from '../utils/crypto';
import { setJWTCookie, clearJWTCookie, getCookieOptions } from '../utils/jwt';

export class AuthController {
  // POST /api/auth/register/local
  async registerLocal(req: Request, res: Response) {
    try {
      const { email, password, nickname, clanId } = req.body;

      // Validaciones
      if (!email || !password || !nickname || !clanId) {
        return errorResponse(res, 'Todos los campos son obligatorios', 400);
      }

      if (!isValidEmail(email)) {
        return errorResponse(res, 'Email inválido', 400);
      }

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

      // Registrar usuario
      const user = await authService.registerLocal({
        email,
        password,
        nickname: cleanNickname,
        clanId
      });

      return successResponse(
        res,
        { user },
        'Usuario registrado correctamente. Pendiente de validación por administrador o líder de clan.',
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

      const result = await authService.loginLocal(email, password);

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
            },
          },
        },
      });

      if (!user) {
        return errorResponse(res, 'Usuario no encontrado', 404);
      }

      return successResponse(res, { user }, 'Usuario obtenido exitosamente');
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
        return res.redirect(`${process.env.FRONTEND_URL}/login?error=invalid_state`);
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
        return res.redirect(`${process.env.FRONTEND_URL}/login?error=missing_code`);
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

      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

      // Si es nuevo usuario, redirigir a página de registro pendiente (sin establecer sesión)
      if (isNewUser) {
        logger.info('New Discord user pending approval', { userId: user.id });
        const emailParam = user.email ? encodeURIComponent(user.email) : '';
        return res.redirect(`${frontendUrl}/auth/pending?email=${emailParam}`);
      }

      // Usuario existente: verificar estado antes de establecer sesión
      if (user.status === 'PENDING') {
        logger.info('Existing Discord user still pending approval', { userId: user.id });
        const emailParam = user.email ? encodeURIComponent(user.email) : '';
        return res.redirect(`${frontendUrl}/auth/pending?email=${emailParam}`);
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
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
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
        return res.redirect(`${process.env.FRONTEND_URL}/login?error=not_authenticated`);
      }

      const { code, state } = req.query;
      const savedState = req.cookies.discord_link_state;

      // Validar state anti-CSRF
      if (!validateState(state as string, savedState)) {
        logger.warn('Discord link state mismatch');
        return res.redirect(`${process.env.FRONTEND_URL}/profile?error=invalid_state`);
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
        return res.redirect(`${process.env.FRONTEND_URL}/profile?error=missing_code`);
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
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      return res.redirect(`${frontendUrl}/profile?discord_linked=true`);
    } catch (error: any) {
      logger.error('Error in discordLinkCallback', error);
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      return res.redirect(`${frontendUrl}/profile?error=discord_link_failed&message=${encodeURIComponent(error.message)}`);
    }
  }
}

export const authController = new AuthController();