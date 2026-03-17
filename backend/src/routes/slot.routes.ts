import { Router } from 'express';
import { slotController } from '../controllers/slot.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { requirePermission } from '../middlewares/permissions';
import { PERMISSIONS } from '../auth/rbac';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

// Rutas de slots
router.post('/:id/assign', slotController.assignSlot.bind(slotController));
router.post('/:id/unassign', slotController.unassignSlot.bind(slotController));

router.put(
  '/:id',
  requirePermission(PERMISSIONS.SLOT_MANAGE),
  slotController.updateSlot.bind(slotController)
);

router.delete(
  '/:id',
  requirePermission(PERMISSIONS.SLOT_MANAGE),
  slotController.deleteSlot.bind(slotController)
);

// Rutas de escuadras (prefijo /squads)
const squadRouter = Router();

squadRouter.put(
  '/:id',
  authenticate,
  requirePermission(PERMISSIONS.SLOT_MANAGE),
  slotController.updateSquad.bind(slotController)
);

squadRouter.delete(
  '/:id',
  authenticate,
  requirePermission(PERMISSIONS.SLOT_MANAGE),
  slotController.deleteSquad.bind(slotController)
);

squadRouter.post(
  '/:id/slots',
  authenticate,
  requirePermission(PERMISSIONS.SLOT_MANAGE),
  slotController.createSlot.bind(slotController)
);

squadRouter.patch(
  '/:id/reserve',
  authenticate,
  requirePermission(PERMISSIONS.SLOT_MANAGE),
  slotController.reserveSquad.bind(slotController)
);

// SEGURIDAD: Rutas admin requieren autorización explícita
router.post(
  '/:id/admin-assign',
  requirePermission(PERMISSIONS.SLOT_MANAGE),
  slotController.adminAssignSlot.bind(slotController)
);
router.post(
  '/:id/admin-unassign',
  requirePermission(PERMISSIONS.SLOT_MANAGE),
  slotController.adminUnassignSlot.bind(slotController)
);

export { router as slotRoutes, squadRouter };
