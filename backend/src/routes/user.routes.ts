import { Router } from 'express';
import { userController } from '../controllers/user.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { UserRole } from '@prisma/client';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

// IMPORTANTE: Rutas específicas ANTES de rutas con parámetros dinámicos

// Solicitudes de cambio de clan (ANTES de /:id)
router.post(
  '/clan-change-request',
  userController.requestClanChange.bind(userController)
);

router.get(
  '/clan-change-requests',
  authorize(UserRole.ADMIN, UserRole.CLAN_LEADER),
  userController.getClanChangeRequests.bind(userController)
);

router.post(
  '/clan-change-requests/:id/review',
  authorize(UserRole.ADMIN, UserRole.CLAN_LEADER),
  userController.reviewClanChangeRequest.bind(userController)
);

// Rutas básicas de usuarios
router.get('/', userController.getAllUsers.bind(userController));
router.get('/:id', userController.getUserById.bind(userController));

// Validar usuario (ADMIN o CLAN_LEADER)
router.post(
  '/:id/validate',
  authorize(UserRole.ADMIN, UserRole.CLAN_LEADER),
  userController.validateUser.bind(userController)
);

// Cambiar rol (solo ADMIN)
router.put(
  '/:id/role',
  authorize(UserRole.ADMIN),
  userController.changeUserRole.bind(userController)
);

// Cambiar estado (solo ADMIN)
router.put(
  '/:id/status',
  authorize(UserRole.ADMIN),
  userController.changeUserStatus.bind(userController)
);

// Cambiar clan directamente (solo ADMIN)
router.put(
  '/:id/clan',
  authorize(UserRole.ADMIN),
  userController.changeUserClan.bind(userController)
);

export default router;