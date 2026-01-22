import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

// Rutas públicas - Local auth
router.post('/register/local', authController.registerLocal.bind(authController));
router.post('/login/local', authController.loginLocal.bind(authController));

// Rutas públicas - Discord OAuth2 (login)
router.get('/discord/start', authController.discordStart.bind(authController));
router.get('/discord/callback', authController.discordCallback.bind(authController));

// Rutas protegidas - Discord OAuth2 (account linking)
router.get('/discord/link/start', authenticate, authController.discordLinkStart.bind(authController));
router.get('/discord/link/callback', authenticate, authController.discordLinkCallback.bind(authController));

// Rutas protegidas
router.get('/me', authenticate, authController.getMe.bind(authController));
router.post('/logout', authenticate, authController.logout.bind(authController));

export { router as authRoutes };