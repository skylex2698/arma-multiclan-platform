import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { clanController } from '../controllers/clan.controller';
import { notionIntegrationController } from '../controllers/notionIntegration.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { uploadClanAvatar } from '../config/multer.config';
import {
  requireClanScopedPermission,
  requirePermission,
} from '../middlewares/permissions';
import { PERMISSIONS } from '../auth/rbac';

const router = Router();

router.get('/', clanController.getAll);
router.get('/:id', clanController.getById);
router.get('/:id/members', clanController.getMembers);
router.get(
  '/:id/notion',
  authenticate,
  requireClanScopedPermission(PERMISSIONS.CLAN_EDIT),
  notionIntegrationController.getClanIntegration.bind(notionIntegrationController)
);
router.put(
  '/:id/notion',
  authenticate,
  requireClanScopedPermission(PERMISSIONS.CLAN_EDIT),
  notionIntegrationController.saveClanIntegration.bind(notionIntegrationController)
);
router.post(
  '/:id/notion/test',
  authenticate,
  requireClanScopedPermission(PERMISSIONS.CLAN_EDIT),
  notionIntegrationController.testConnection.bind(notionIntegrationController)
);

router.post(
  '/',
  authenticate,
  (req: Request, res: Response, next: NextFunction) => {
    if (req.user?.mustCreateClanOnboarding) {
      return next();
    }

    return requirePermission(PERMISSIONS.CLAN_CREATE)(req, res, next);
  },
  clanController.create
);
router.put(
  '/:id',
  authenticate,
  requireClanScopedPermission(PERMISSIONS.CLAN_EDIT),
  clanController.updateClan
);
router.delete(
  '/:id',
  authenticate,
  requirePermission(PERMISSIONS.CLAN_DELETE),
  clanController.deleteClan
);
router.patch(
  '/:id/restore',
  authenticate,
  requirePermission(PERMISSIONS.CLAN_RESTORE),
  clanController.restoreClan
);

// Nueva ruta para subir avatar con manejo de errores de multer
router.post(
  '/:id/avatar',
  authenticate,
  requireClanScopedPermission(PERMISSIONS.CLAN_AVATAR_MANAGE),
  (req: Request, res: Response, next: NextFunction) => {
    uploadClanAvatar.single('avatar')(req, res, (err: unknown) => {
      if (err) {
        if (err instanceof multer.MulterError) {
          // Error de Multer (límite de tamaño, etc.)
          return res.status(400).json({
            success: false,
            message: err.code === 'LIMIT_FILE_SIZE'
              ? 'El archivo es demasiado grande. Máximo 2MB.'
              : `Error de subida: ${err.message}`,
          });
        } else if (err instanceof Error) {
          // Error de validación de archivo
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
  clanController.uploadAvatar
);

// Ruta para eliminar avatar
router.delete(
  '/:id/avatar',
  authenticate,
  requireClanScopedPermission(PERMISSIONS.CLAN_AVATAR_MANAGE),
  clanController.deleteAvatar
);

export { router as clanRoutes };
