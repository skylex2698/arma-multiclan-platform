import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

// Rutas públicas
router.post('/register/local', authController.registerLocal.bind(authController));
router.post('/login/local', authController.loginLocal.bind(authController));
router.post('/register/discord', authController.completeDiscordRegistration.bind(authController));

// Rutas protegidas
router.get('/me', authenticate, authController.getMe.bind(authController));

export default router;