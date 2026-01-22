import { Router } from 'express';
import { discordController } from '../controllers/discord.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

// User endpoints (requieren OAuth2 user access token almacenado)
router.get('/me', discordController.getMe.bind(discordController));
router.get('/me/connections', discordController.getConnections.bind(discordController));
router.get('/me/guilds', discordController.getGuilds.bind(discordController));

export { router as discordRoutes };
