import { Request, Response } from 'express';
import { communicationTreeService } from '../services/communicationTree.service';
import { logger } from '../utils/logger';

// GET /events/:eventId/communication-tree
export const getEventTree = async (req: Request, res: Response) => {
  try {
    const eventId = req.params.eventId as string; // Asegurar que es string
    const nodes = await communicationTreeService.getEventTree(eventId);
    res.json(nodes);
  } catch (error: any) {
    logger.error('Error fetching communication tree', { error: error.message });
    res.status(500).json({ message: 'Error al obtener el árbol de comunicaciones' });
  }
};

// POST /events/:eventId/communication-tree
export const createNode = async (req: Request, res: Response) => {
  try {
    const eventId = req.params.eventId as string; // Asegurar que es string
    const userId = (req as any).user.id;
    
    const node = await communicationTreeService.createNode(eventId, req.body, userId);
    res.status(201).json(node);
  } catch (error: any) {
    logger.error('Error creating communication node', { error: error.message });
    res.status(400).json({ message: error.message });
  }
};

// PUT /events/:eventId/communication-tree/:nodeId
export const updateNode = async (req: Request, res: Response) => {
  try {
    const nodeId = req.params.nodeId as string; // Asegurar que es string
    const userId = (req as any).user.id;
    
    const node = await communicationTreeService.updateNode(nodeId, req.body, userId);
    res.json(node);
  } catch (error: any) {
    logger.error('Error updating communication node', { error: error.message });
    res.status(400).json({ message: error.message });
  }
};

// DELETE /events/:eventId/communication-tree/:nodeId
export const deleteNode = async (req: Request, res: Response) => {
  try {
    const nodeId = req.params.nodeId as string; // Asegurar que es string
    const userId = (req as any).user.id;
    
    const result = await communicationTreeService.deleteNode(nodeId, userId);
    res.json(result);
  } catch (error: any) {
    logger.error('Error deleting communication node', { error: error.message });
    res.status(400).json({ message: error.message });
  }
};

// POST /events/:eventId/communication-tree/auto-generate
export const autoGenerateTree = async (req: Request, res: Response) => {
  try {
    const eventId = req.params.eventId as string; // Asegurar que es string
    const userId = (req as any).user.id;
    
    const nodes = await communicationTreeService.autoGenerateTree(eventId, userId);
    res.json(nodes);
  } catch (error: any) {
    logger.error('Error auto-generating communication tree', { error: error.message });
    res.status(400).json({ message: error.message });
  }
};

// PATCH /events/:eventId/communication-tree/positions
export const updateNodePositions = async (req: Request, res: Response) => {
  try {
    const eventId = req.params.eventId as string; // Asegurar que es string
    const userId = (req as any).user.id;
    const { positions } = req.body;
    
    const result = await communicationTreeService.updateNodePositions(
      eventId,
      positions,
      userId
    );
    res.json(result);
  } catch (error: any) {
    logger.error('Error updating node positions', { error: error.message });
    res.status(400).json({ message: error.message });
  }
};