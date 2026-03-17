import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { eventController } from '../controllers/event.controller';
import { notionIntegrationController } from '../controllers/notionIntegration.controller';
import { slotController } from '../controllers/slot.controller';
import { attendanceController } from '../controllers/attendance.controller';
import { authenticate, authenticateOptional } from '../middlewares/auth.middleware';
import {
  requireEventScopedPermission,
  requirePermission,
} from '../middlewares/permissions';
import { uploadEventBriefing, uploadEventModset } from '../config/multer.config';
import { PERMISSIONS } from '../auth/rbac';

const router = Router();

// Rutas públicas de eventos (sin autenticación)
router.use(authenticateOptional);
router.get('/', eventController.getAllEvents.bind(eventController));
router.get('/public/:token', eventController.getPublicEvent.bind(eventController));
router.get('/:id', eventController.getEventById.bind(eventController));

// Todas las demás rutas requieren autenticación
router.use(authenticate);

// Crear evento (ADMIN, CLAN_LEADER)
router.post(
  '/',
  requirePermission(PERMISSIONS.EVENT_CREATE),
  eventController.createEvent.bind(eventController)
);

// Crear evento desde plantilla (ADMIN, CLAN_LEADER)
router.post(
  '/from-template',
  requirePermission(PERMISSIONS.EVENT_CREATE),
  eventController.createEventFromTemplate.bind(eventController)
);

// Editar evento (ADMIN, CLAN_LEADER)
router.put(
  '/:id',
  requireEventScopedPermission(PERMISSIONS.EVENT_EDIT),
  eventController.updateEvent.bind(eventController)
);

// Cambiar estado del evento (ADMIN, CLAN_LEADER)
router.put(
  '/:id/status',
  requireEventScopedPermission(PERMISSIONS.EVENT_STATUS_MANAGE),
  eventController.changeEventStatus.bind(eventController)
);

// Eliminar evento (ADMIN, CLAN_LEADER)
router.delete(
  '/:id',
  requireEventScopedPermission(PERMISSIONS.EVENT_DELETE),
  eventController.deleteEvent.bind(eventController)
);

// Restaurar evento eliminado (ADMIN, CLAN_LEADER)
router.patch(
  '/:id/restore',
  requireEventScopedPermission(PERMISSIONS.EVENT_RESTORE),
  eventController.restoreEvent.bind(eventController)
);

// Marcar ausencia (cualquier usuario autenticado)
router.post('/:id/absence', slotController.markAbsence.bind(slotController));

// Asistencia post-evento (ADMIN, CLAN_LEADER)
router.get(
  '/:id/attendance',
  requireEventScopedPermission(PERMISSIONS.EVENT_ATTENDANCE_MANAGE),
  attendanceController.getEventAttendance.bind(attendanceController)
);
router.post(
  '/:id/attendance',
  requireEventScopedPermission(PERMISSIONS.EVENT_ATTENDANCE_MANAGE),
  attendanceController.saveEventAttendance.bind(attendanceController)
);
router.post(
  '/:id/notion/sync',
  requireEventScopedPermission(PERMISSIONS.EVENT_ATTENDANCE_MANAGE),
  notionIntegrationController.syncEventParticipations.bind(notionIntegrationController)
);

// Generar token de link público (cualquier usuario autenticado)
router.post(
  '/:id/share-token',
  eventController.generateShareToken.bind(eventController)
);

router.get(
  '/:id/slotlist',
  requireEventScopedPermission(PERMISSIONS.SLOT_MANAGE),
  eventController.getEventSlotlist.bind(eventController)
);

router.get(
  '/:id/whitelist',
  requireEventScopedPermission(PERMISSIONS.SLOT_MANAGE),
  eventController.getEventWhitelist.bind(eventController)
);

// Crear escuadra en un evento (ADMIN, CLAN_LEADER)
router.post(
  '/:id/squads',
  requireEventScopedPermission(PERMISSIONS.SLOT_MANAGE),
  slotController.createSquad.bind(slotController)
);

// ==========================================
// RUTAS DE ARCHIVOS DE EVENTOS
// ==========================================

// Subir archivo de briefing (PDF) - máx 10MB
router.post(
  '/:id/briefing-file',
  requireEventScopedPermission(PERMISSIONS.EVENT_FILES_MANAGE),
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
  requireEventScopedPermission(PERMISSIONS.EVENT_FILES_MANAGE),
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
  requireEventScopedPermission(PERMISSIONS.EVENT_FILES_MANAGE),
  eventController.deleteBriefingFile.bind(eventController)
);

// Eliminar archivo de modset
router.delete(
  '/:id/modset-file',
  requireEventScopedPermission(PERMISSIONS.EVENT_FILES_MANAGE),
  eventController.deleteModsetFile.bind(eventController)
);

export default router;
