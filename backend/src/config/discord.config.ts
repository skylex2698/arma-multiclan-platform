import { Strategy as DiscordStrategy } from 'passport-discord';
import passport from 'passport';
import { prisma } from '../index';
import { logger } from '../utils/logger';

export const configureDiscordAuth = () => {
  const clientID = process.env.DISCORD_CLIENT_ID;
  const clientSecret = process.env.DISCORD_CLIENT_SECRET;
  const callbackURL = process.env.DISCORD_CALLBACK_URL;

  if (!clientID || !clientSecret) {
    logger.warn('Discord OAuth credentials not configured');
    return;
  }

  passport.use(
    new DiscordStrategy(
      {
        clientID,
        clientSecret,
        callbackURL,
        scope: ['identify', 'email', 'guilds', 'guilds.members.read']
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          logger.info('Discord OAuth callback', { discordId: profile.id });

          // Buscar usuario existente por Discord ID
          let user = await prisma.user.findUnique({
            where: { discordId: profile.id }
          });

          if (user) {
            // Usuario existe, actualizar info de Discord
            user = await prisma.user.update({
              where: { id: user.id },
              data: {
                discordUsername: `${profile.username}#${profile.discriminator}`
              }
            });
            return done(null, user);
          }

          // Usuario nuevo - guardamos info temporal en la sesión
          // El usuario deberá completar registro (nickname + clan)
          const tempUser = {
            discordId: profile.id,
            discordUsername: `${profile.username}#${profile.discriminator}`,
            email: profile.email,
            needsRegistration: true
          };

          return done(null, tempUser);
        } catch (error) {
          logger.error('Error in Discord OAuth', error);
          return done(error as Error, undefined);
        }
      }
    )
  );
};