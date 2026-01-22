import { Router } from 'express';
import { userController } from '../controllers/user.controller';
import { authenticate, requireAdmin } from '../middlewares/auth.middleware';
import { canViewUsers, canChangeUserRole, canChangeUserStatus } from '../middlewares/permissions';

const router = Router();

// Rutas protegidas
router.use(authenticate);

// Obtener todos los usuarios (Admin y Líder de Clan)
router.get('/', canViewUsers, (req, res) => userController.getAllUsers(req, res));

// Actualizar rol de usuario (solo Admin)
router.put('/:userId/role', canChangeUserRole, (req, res) => userController.updateRole(req, res));

// Actualizar estado de usuario (Admin y Líder de Clan para su propio clan)
router.put('/:userId/status', canChangeUserStatus, (req, res) => userController.updateStatus(req, res));

// Cambiar clan de usuario (solo Admin)
router.put('/:userId/clan', requireAdmin, (req, res) => userController.changeUserClan(req, res));

// Solicitudes de cambio de clan
router.post('/clan-change-request', (req, res) => userController.requestClanChange(req, res));
router.get('/clan-change-requests', canViewUsers, (req, res) => userController.getClanChangeRequests(req, res));
router.post('/clan-change-requests/:id/review', canViewUsers, (req, res) => userController.reviewClanChangeRequest(req, res));

// Perfil del usuario actual
router.put('/profile', (req, res) => userController.updateProfile(req, res));
router.put('/change-password', (req, res) => userController.changePassword(req, res));

export const userRoutes = router;