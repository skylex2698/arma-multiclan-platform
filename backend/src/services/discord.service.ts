import { logger } from '../utils/logger';
import { prisma } from '../config/database';

// ========== TYPES ==========

interface DiscordTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  scope: string;
}

interface DiscordUser {
  id: string;
  username: string;
  global_name: string | null;
  avatar: string | null;
  email?: string;
}

// ========== DISCORD OAUTH2 SERVICE ==========

export class DiscordService {
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly redirectUri: string;

  constructor() {
    this.clientId = process.env.DISCORD_CLIENT_ID || '';
    this.clientSecret = process.env.DISCORD_CLIENT_SECRET || '';
    this.redirectUri = process.env.DISCORD_REDIRECT_URI || 'http://localhost:3000/api/auth/discord/callback';

    if (!this.clientId || !this.clientSecret) {
      logger.warn('Discord OAuth2 credentials not configured');
    }
  }

  /**
   * Genera la URL de autorización de Discord
   * @param state - String anti-CSRF
   * @param scope - Scopes OAuth2 separados por espacio
   * @returns URL de autorización
   */
  getAuthorizationUrl(state: string, scope: string = 'identify email'): string {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      response_type: 'code',
      scope,
      state,
    });

    return `https://discord.com/oauth2/authorize?${params.toString()}`;
  }

  /**
   * Intercambia el código de autorización por tokens OAuth2
   * @param code - Código de autorización recibido del callback
   * @returns Respuesta con access_token, refresh_token, etc.
   */
  async exchangeCodeForTokens(code: string): Promise<DiscordTokenResponse> {
    try {
      const params = new URLSearchParams({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        grant_type: 'authorization_code',
        code,
        redirect_uri: this.redirectUri,
      });

      const response = await fetch('https://discord.com/api/oauth2/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      });

      if (!response.ok) {
        const errorText = await response.text();
        logger.error('Discord token exchange failed', { status: response.status, error: errorText });
        throw new Error(`Discord token exchange failed: ${response.status}`);
      }

      const data = await response.json() as DiscordTokenResponse;
      return data;
    } catch (error) {
      logger.error('Error exchanging Discord code for tokens', error);
      throw error;
    }
  }

  /**
   * Refresca el access token usando refresh_token
   * @param refreshToken - Refresh token previo
   * @returns Nueva respuesta de tokens
   */
  async refreshAccessToken(refreshToken: string): Promise<DiscordTokenResponse> {
    try {
      const params = new URLSearchParams({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      });

      const response = await fetch('https://discord.com/api/oauth2/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      });

      if (!response.ok) {
        const errorText = await response.text();
        logger.error('Discord token refresh failed', { status: response.status, error: errorText });
        throw new Error(`Discord token refresh failed: ${response.status}`);
      }

      const data = await response.json() as DiscordTokenResponse;
      return data;
    } catch (error) {
      logger.error('Error refreshing Discord access token', error);
      throw error;
    }
  }

  /**
   * Obtiene la información del usuario de Discord (/users/@me)
   * @param accessToken - Access token OAuth2
   * @returns Información del usuario
   */
  async fetchDiscordUser(accessToken: string): Promise<DiscordUser> {
    try {
      const response = await fetch('https://discord.com/api/users/@me', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        logger.error('Discord /users/@me failed', { status: response.status, error: errorText });

        // Propagate rate limit info
        if (response.status === 429) {
          const retryAfter = response.headers.get('Retry-After');
          throw new Error(`Discord rate limit. Retry after: ${retryAfter || 'unknown'}`);
        }

        throw new Error(`Discord API error: ${response.status}`);
      }

      const data = await response.json() as DiscordUser;
      return data;
    } catch (error) {
      logger.error('Error fetching Discord user', error);
      throw error;
    }
  }

  /**
   * Obtiene las conexiones del usuario (/users/@me/connections)
   * Requiere scope: connections
   * @param accessToken - Access token OAuth2
   * @returns Array de conexiones
   */
  async fetchUserConnections(accessToken: string): Promise<any[]> {
    try {
      const response = await fetch('https://discord.com/api/users/@me/connections', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        logger.error('Discord /users/@me/connections failed', { status: response.status, error: errorText });

        if (response.status === 429) {
          const retryAfter = response.headers.get('Retry-After');
          throw new Error(`Discord rate limit. Retry after: ${retryAfter || 'unknown'}`);
        }

        throw new Error(`Discord API error: ${response.status}`);
      }

      const data = await response.json() as any[];
      return data;
    } catch (error) {
      logger.error('Error fetching Discord user connections', error);
      throw error;
    }
  }

  /**
   * Obtiene los guilds del usuario (/users/@me/guilds)
   * Requiere scope: guilds
   * @param accessToken - Access token OAuth2
   * @returns Array de guilds
   */
  async fetchUserGuilds(accessToken: string): Promise<any[]> {
    try {
      const response = await fetch('https://discord.com/api/users/@me/guilds', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        logger.error('Discord /users/@me/guilds failed', { status: response.status, error: errorText });

        if (response.status === 429) {
          const retryAfter = response.headers.get('Retry-After');
          throw new Error(`Discord rate limit. Retry after: ${retryAfter || 'unknown'}`);
        }

        throw new Error(`Discord API error: ${response.status}`);
      }

      const data = await response.json() as any[];
      return data;
    } catch (error) {
      logger.error('Error fetching Discord user guilds', error);
      throw error;
    }
  }

  /**
   * Obtiene el OAuthAccount de un usuario para Discord
   * @param userId - ID del usuario
   * @returns OAuthAccount o null si no existe
   */
  async getOAuthAccount(userId: string) {
    try {
      const account = await prisma.oAuthAccount.findUnique({
        where: {
          provider_providerAccountId: {
            provider: 'discord',
            providerAccountId: userId,
          }
        }
      });

      // También buscar por userId directamente (más común)
      if (!account) {
        const accountByUserId = await prisma.oAuthAccount.findFirst({
          where: {
            userId,
            provider: 'discord',
          }
        });
        return accountByUserId;
      }

      return account;
    } catch (error) {
      logger.error('Error fetching OAuth account', error);
      return null;
    }
  }

  /**
   * Obtiene un access token válido para un usuario
   * Si el token ha expirado, lo refresca automáticamente
   * @param userId - ID del usuario
   * @returns Access token válido o null si no hay cuenta vinculada
   */
  async getValidAccessToken(userId: string): Promise<string | null> {
    try {
      const account = await this.getOAuthAccount(userId);

      if (!account) {
        logger.warn('No Discord OAuth account found', { userId });
        return null;
      }

      if (!account.accessToken) {
        logger.warn('No access token stored', { userId });
        return null;
      }

      // Verificar si el token ha expirado
      const now = Math.floor(Date.now() / 1000);
      const isExpired = account.expiresAt && account.expiresAt < now;

      if (!isExpired) {
        return account.accessToken;
      }

      // Token expirado: intentar refrescar
      if (!account.refreshToken) {
        logger.warn('Access token expired and no refresh token available', { userId });
        return null;
      }

      logger.info('Refreshing expired Discord access token', { userId });

      const tokenResponse = await this.refreshAccessToken(account.refreshToken);

      // Actualizar tokens en DB
      const newExpiresAt = Math.floor(Date.now() / 1000) + tokenResponse.expires_in;

      await prisma.oAuthAccount.update({
        where: { id: account.id },
        data: {
          accessToken: tokenResponse.access_token,
          refreshToken: tokenResponse.refresh_token || account.refreshToken,
          expiresAt: newExpiresAt,
          scope: tokenResponse.scope,
        }
      });

      logger.info('Discord access token refreshed successfully', { userId });

      return tokenResponse.access_token;
    } catch (error) {
      logger.error('Error getting valid access token', error);
      return null;
    }
  }
}

export const discordService = new DiscordService();
