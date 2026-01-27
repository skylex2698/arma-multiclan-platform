import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { eventController } from '../controllers/event.controller';
import { slotController } from '../controllers/slot.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { UserRole } from '@prisma/client';
import { uploadEventBriefing, uploadEventModset } from '../config/multer.config';

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

// ==========================================
// RUTAS DE ARCHIVOS DE EVENTOS
// ==========================================

// Subir archivo de briefing (PDF) - máx 10MB
router.post(
  '/:id/briefing-file',
  authorize(UserRole.ADMIN, UserRole.CLAN_LEADER),
  (req: Request, res: Response, next: NextFunction) => {
    uploadEventBriefing.single('briefingFile')(req, res, (err: unknown) => {
      if (err) {
        if (err instanceof multer.MulterError) {
          return res.status(400).json({
            success: false,
            message: err.code === 'LIMIT_FILE_SIZE'
              ? 'El archivo es demasiado grande. Máximo 10MB.'
              : `Error de subida: ${err.message}`,
          });
        } else if (err instanceof Error) {
          return res.status(400).json({
            success: false,
            message: err.message,
          });
        }
        return res.status(500).json({
          success: false,
          message: 'Error al procesar el archivo',
        });
      }
      next();
    });
  },
  eventController.uploadBriefingFile.bind(eventController)
);

// Subir archivo de modset (HTML) - máx 10MB
router.post(
  '/:id/modset-file',
  authorize(UserRole.ADMIN, UserRole.CLAN_LEADER),
  (req: Request, res: Response, next: NextFunction) => {
    uploadEventModset.single('modsetFile')(req, res, (err: unknown) => {
      if (err) {
        if (err instanceof multer.MulterError) {
          return res.status(400).json({
            success: false,
            message: err.code === 'LIMIT_FILE_SIZE'
              ? 'El archivo es demasiado grande. Máximo 10MB.'
              : `Error de subida: ${err.message}`,
          });
        } else if (err instanceof Error) {
          return res.status(400).json({
            success: false,
            message: err.message,
          });
        }
        return res.status(500).json({
          success: false,
          message: 'Error al procesar el archivo',
        });
      }
      next();
    });
  },
  eventController.uploadModsetFile.bind(eventController)
);

// Eliminar archivo de briefing
router.delete(
  '/:id/briefing-file',
  authorize(UserRole.ADMIN, UserRole.CLAN_LEADER),
  eventController.deleteBriefingFile.bind(eventController)
);

// Eliminar archivo de modset
router.delete(
  '/:id/modset-file',
  authorize(UserRole.ADMIN, UserRole.CLAN_LEADER),
  eventController.deleteModsetFile.bind(eventController)
);

export default router;