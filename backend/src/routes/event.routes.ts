import { Router } from 'express';
import { eventController } from '../controllers/event.controller';
import { slotController } from '../controllers/slot.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { UserRole } from '@prisma/client';

const router = Router();

// Rutas públicas de eventos (sin autenticación)
router.get('/', eventController.getAllEvents.bind(eventController));
router.get('/:id', eventController.getEventById.bind(eventController));

// Todas las demás rutas requieren autenticación
router.use(authenticate);

// Crear evento (ADMIN, CLAN_LEADER)
router.post(
  '/',
  authorize(UserRole.ADMIN, UserRole.CLAN_LEADER),
  eventController.createEvent.bind(eventController)
);

// Crear evento desde plantilla (ADMIN, CLAN_LEADER)
router.post(
  '/from-template',
  authorize(UserRole.ADMIN, UserRole.CLAN_LEADER),
  eventController.createEventFromTemplate.bind(eventController)
);

// Editar evento (ADMIN, CLAN_LEADER)
router.put(
  '/:id',
  authorize(UserRole.ADMIN, UserRole.CLAN_LEADER),
  eventController.updateEvent.bind(eventController)
);

// Cambiar estado del evento (ADMIN, CLAN_LEADER)
router.put(
  '/:id/status',
  authorize(UserRole.ADMIN, UserRole.CLAN_LEADER),
  eventController.changeEventStatus.bind(eventController)
);

// Eliminar evento (ADMIN)
router.delete(
  '/:id',
  authorize(UserRole.ADMIN),
  eventController.deleteEvent.bind(eventController)
);

// Marcar ausencia (cualquier usuario autenticado)
router.post('/:id/absence', slotController.markAbsence.bind(slotController));

// Crear escuadra en un evento (ADMIN, CLAN_LEADER)
router.post(
  '/:id/squads',
  authorize(UserRole.ADMIN, UserRole.CLAN_LEADER),
  slotController.createSquad.bind(slotController)
);

export default router;