import { Router } from 'express';
import { slotController } from '../controllers/slot.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { UserRole } from '@prisma/client';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

// Rutas de slots
router.post('/:id/assign', slotController.assignSlot.bind(slotController));
router.post('/:id/unassign', slotController.unassignSlot.bind(slotController));

router.put(
  '/:id',
  authorize(UserRole.ADMIN, UserRole.CLAN_LEADER),
  slotController.updateSlot.bind(slotController)
);

router.delete(
  '/:id',
  authorize(UserRole.ADMIN, UserRole.CLAN_LEADER),
  slotController.deleteSlot.bind(slotController)
);

// Rutas de escuadras (prefijo /squads)
const squadRouter = Router();

squadRouter.put(
  '/:id',
  authenticate,
  authorize(UserRole.ADMIN, UserRole.CLAN_LEADER),
  slotController.updateSquad.bind(slotController)
);

squadRouter.delete(
  '/:id',
  authenticate,
  authorize(UserRole.ADMIN, UserRole.CLAN_LEADER),
  slotController.deleteSquad.bind(slotController)
);

squadRouter.post(
  '/:id/slots',
  authenticate,
  authorize(UserRole.ADMIN, UserRole.CLAN_LEADER),
  slotController.createSlot.bind(slotController)
);

router.post('/:id/admin-assign', slotController.adminAssignSlot.bind(slotController)); // <-- AGREGAR

export { router as slotRoutes, squadRouter };