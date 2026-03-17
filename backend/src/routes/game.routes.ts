import { Router } from 'express';
import { authenticate, requireAdmin } from '../middlewares/auth.middleware';
import { gameController } from '../controllers/game.controller';

const router = Router();

router.get('/', (req, res) => gameController.getGames(req, res));
router.post('/', authenticate, requireAdmin, (req, res) => gameController.createGame(req, res));
router.put('/:id', authenticate, requireAdmin, (req, res) => gameController.updateGame(req, res));
router.delete('/:id', authenticate, requireAdmin, (req, res) => gameController.deleteGame(req, res));

export const gameRoutes = router;
