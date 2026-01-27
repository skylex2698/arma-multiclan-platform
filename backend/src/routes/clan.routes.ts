import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { clanController } from '../controllers/clan.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { uploadClanAvatar } from '../config/multer.config';

const router = Router();

router.get('/', clanController.getAll);
router.get('/:id', clanController.getById);
router.get('/:id/members', clanController.getMembers);

router.post('/', authenticate, clanController.create);
router.put('/:id', authenticate, clanController.updateClan);
router.delete('/:id', authenticate, clanController.deleteClan);

// Nueva ruta para subir avatar con manejo de errores de multer
router.post(
  '/:id/avatar',
  authenticate,
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

export { router as clanRoutes };