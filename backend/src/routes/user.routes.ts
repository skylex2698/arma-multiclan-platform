import { Router } from 'express';
import { userController } from '../controllers/user.controller';
import { attendanceController } from '../controllers/attendance.controller';
import { authenticate } from '../middlewares/auth.middleware';
import {
  canViewUsers,
  canChangeUserRole,
  canChangeUserStatus,
  requirePermission,
} from '../middlewares/permissions';
import { PERMISSIONS } from '../auth/rbac';

const router = Router();

// Rutas protegidas
router.use(authenticate);

// Obtener todos los usuarios (Admin y Líder de Clan)
router.get('/', canViewUsers, (req, res) => userController.getAllUsers(req, res));

// Validar usuario (PENDING -> ACTIVE con comprobación de identidad)
router.post('/:userId/validate', canChangeUserStatus, (req, res) => userController.validateUser(req, res));

// Actualizar rol de usuario (solo Admin)
router.put('/:userId/role', canChangeUserRole, (req, res) => userController.updateRole(req, res));

// Actualizar estado de usuario (Admin y Líder de Clan para su propio clan)
router.put('/:userId/status', canChangeUserStatus, (req, res) => userController.updateStatus(req, res));

// Cambiar clan de usuario (solo Admin)
router.put(
  '/:userId/clan',
  requirePermission(PERMISSIONS.USER_CLAN_MANAGE),
  (req, res) => userController.changeUserClan(req, res)
);
router.put(
  '/:userId/admin-profile',
  requirePermission(PERMISSIONS.USER_PROFILE_ADMIN_EDIT),
  (req, res) => userController.adminUpdateUserProfile(req, res)
);
router.put(
  '/:userId/permissions',
  requirePermission(PERMISSIONS.USER_ROLE_MANAGE),
  (req, res) => userController.adminUpdateUserPermissions(req, res)
);
router.post(
  '/:userId/reset-password',
  requirePermission(PERMISSIONS.USER_PASSWORD_RESET),
  (req, res) => userController.adminResetUserPassword(req, res)
);
router.delete(
  '/:userId',
  requirePermission(PERMISSIONS.USER_DELETE),
  (req, res) => userController.deleteUser(req, res)
);

// Solicitudes de cambio de clan
router.post('/clan-change-request', (req, res) => userController.requestClanChange(req, res));
router.get('/clan-change-requests', canViewUsers, (req, res) => userController.getClanChangeRequests(req, res));
router.post('/clan-change-requests/:id/review', canViewUsers, (req, res) => userController.reviewClanChangeRequest(req, res));
router.get('/clan-creation-requests', (req, res) => userController.getClanCreationRequests(req, res));
router.post('/clan-creation-requests/:id/review', (req, res) => userController.reviewClanCreationRequest(req, res));
router.get('/profile/clan-creation-request', (req, res) => userController.getCurrentApprovedClanCreationRequest(req, res));

// Perfil del usuario actual
router.put('/profile', (req, res) => userController.updateProfile(req, res));
router.get('/profile/game-identities', (req, res) => userController.getCurrentUserGameIdentities(req, res));
router.put('/profile/game-identities/:gameId', (req, res) => userController.upsertCurrentUserGameIdentity(req, res));
router.put('/change-password', (req, res) => userController.changePassword(req, res));
router.put('/reset-password/self', (req, res) => userController.selfResetPassword(req, res));
router.patch(
  '/game-identities/:identityId/status',
  requirePermission(PERMISSIONS.USER_IDENTITY_REVIEW),
  (req, res) => userController.updateGameIdentityStatus(req, res)
);

// Crear miembro externo (Admin y Líder de Clan)
router.post(
  '/external',
  requirePermission(PERMISSIONS.USER_EXTERNAL_CREATE),
  (req, res) => userController.createExternalUser(req, res)
);

// Fiabilidad de usuario (cualquier autenticado)
// IMPORTANTE: después de rutas estáticas para evitar que :userId capture "profile", "change-password", etc.
router.get('/:userId/reliability', (req, res) => attendanceController.getUserReliability(req, res));

export const userRoutes = router;
