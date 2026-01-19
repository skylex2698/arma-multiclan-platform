import { Router } from 'express';
import { clanController } from '../controllers/clan.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { UserRole } from '@prisma/client';

const router = Router();

// Rutas públicas
router.get('/', clanController.getAllClans.bind(clanController));
router.get('/:id', clanController.getClanById.bind(clanController));

// Rutas protegidas (requieren autenticación)
router.get('/:id/members', authenticate, clanController.getClanMembers.bind(clanController));

// Rutas solo para ADMIN
router.post('/', authenticate, authorize(UserRole.ADMIN), clanController.createClan.bind(clanController));
router.put('/:id', authenticate, authorize(UserRole.ADMIN), clanController.updateClan.bind(clanController));
router.delete('/:id', authenticate, authorize(UserRole.ADMIN), clanController.deleteClan.bind(clanController));

export default router;