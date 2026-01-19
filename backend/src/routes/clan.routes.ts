import { Router } from 'express';
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

// Nueva ruta para subir avatar
router.post(
  '/:id/avatar',
  authenticate,
  uploadClanAvatar.single('avatar'),
  clanController.uploadAvatar
);

export { router as clanRoutes };