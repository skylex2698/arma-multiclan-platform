import { Router } from 'express';
import { userController } from '../controllers/user.controller';
import { authenticate, requireAdmin } from '../middlewares/auth.middleware';

const router = Router();

// Rutas protegidas
router.use(authenticate);

// Obtener todos los usuarios (solo admin)
router.get('/', requireAdmin, (req, res) => userController.getAllUsers(req, res));

// Actualizar rol de usuario (solo admin)
router.put('/:userId/role', requireAdmin, (req, res) => userController.updateRole(req, res));

// Actualizar estado de usuario (solo admin)
router.put('/:userId/status', requireAdmin, (req, res) => userController.updateStatus(req, res));

// Perfil del usuario actual
router.put('/profile', (req, res) => userController.updateProfile(req, res));
router.put('/change-password', (req, res) => userController.changePassword(req, res));

export { router as userRoutes };