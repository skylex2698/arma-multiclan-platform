import { Router } from 'express';
import {
  getEventTree,
  createNode,
  updateNode,
  deleteNode,
  autoGenerateTree,
  updateNodePositions
} from '../controllers/communicationTree.controller';
import { authenticate, requireAdmin } from '../middlewares/auth.middleware';
import { canManageEventCommunication } from '../middlewares/permissions';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

// GET - Obtener árbol (todos pueden ver)
router.get('/:eventId/communication-tree', getEventTree);

// POST - Crear nodo (admin o líder del clan creador)
router.post(
  '/:eventId/communication-tree',
  canManageEventCommunication,
  createNode
);

// PUT - Actualizar nodo
router.put(
  '/:eventId/communication-tree/:nodeId',
  canManageEventCommunication,
  updateNode
);

// DELETE - Eliminar nodo
router.delete(
  '/:eventId/communication-tree/:nodeId',
  canManageEventCommunication,
  deleteNode
);

// POST - Auto-generar árbol
router.post(
  '/:eventId/communication-tree/auto-generate',
  canManageEventCommunication,
  autoGenerateTree
);

// PATCH - Actualizar posiciones
router.patch(
  '/:eventId/communication-tree/positions',
  canManageEventCommunication,
  updateNodePositions
);

export default router;