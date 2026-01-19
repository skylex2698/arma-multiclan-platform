import { Router } from 'express';
import { userController } from '../controllers/user.controller';
import { authenticate, requireAdmin } from '../middlewares/auth.middleware';

const router = Router();

// Rutas protegidas (requieren autenticación)
router.use(authenticate);

router.put('/profile', (req, res) => userController.updateProfile(req, res));
router.put('/change-password', (req, res) => userController.changePassword(req, res));

// Rutas de admin
router.get('/', requireAdmin, (req, res) => userController.getAllUsers(req, res));

export { router as userRoutes };