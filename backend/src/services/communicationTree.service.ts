import { prisma } from '../config/database';
import { logger } from '../utils/logger';

interface CreateNodeDto {
  name: string;
  frequency?: string;
  type: 'COMMAND' | 'SQUAD' | 'ELEMENT' | 'SUPPORT';
  parentId?: string;
  positionX?: number;
  positionY?: number;
  order?: number;
}

interface UpdateNodeDto {
  name?: string;
  frequency?: string;
  type?: 'COMMAND' | 'SQUAD' | 'ELEMENT' | 'SUPPORT';
  parentId?: string;
  positionX?: number;
  positionY?: number;
  order?: number;
}

class CommunicationTreeService {
  // Obtener todo el árbol de un evento
  async getEventTree(eventId: string) {
    const nodes = await prisma.communicationNode.findMany({
      where: { eventId },
      orderBy: { order: 'asc' }
    });

    logger.info('Communication tree fetched', { eventId, nodeCount: nodes.length });
    return nodes;
  }

  // Crear un nodo
  async createNode(eventId: string, data: CreateNodeDto, userId: string) {
    // Verificar que el evento existe
    const event = await prisma.event.findUnique({
      where: { id: eventId }
    });

    if (!event) {
      throw new Error('Evento no encontrado');
    }

    // Si tiene padre, verificar que existe
    if (data.parentId) {
      const parent = await prisma.communicationNode.findUnique({
        where: { id: data.parentId }
      });

      if (!parent || parent.eventId !== eventId) {
        throw new Error('Nodo padre no válido');
      }
    }

    const node = await prisma.communicationNode.create({
      data: {
        eventId,
        name: data.name,
        frequency: data.frequency,
        type: data.type,
        parentId: data.parentId,
        positionX: data.positionX ?? 0,
        positionY: data.positionY ?? 0,
        order: data.order ?? 0
      }
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        action: 'COMM_NODE_CREATED',
        entity: 'CommunicationNode',
        entityId: node.id,
        userId,
        eventId,
        details: JSON.stringify({
          nodeName: node.name,
          nodeType: node.type
        })
      }
    });

    logger.info('Communication node created', { nodeId: node.id, eventId, userId });
    return node;
  }

  // Actualizar un nodo
  async updateNode(nodeId: string, data: UpdateNodeDto, userId: string) {
    const node = await prisma.communicationNode.findUnique({
      where: { id: nodeId }
    });

    if (!node) {
      throw new Error('Nodo no encontrado');
    }

    // Si se cambia el padre, verificar que existe y no crea ciclos
    if (data.parentId !== undefined) {
      if (data.parentId) {
        const newParent = await prisma.communicationNode.findUnique({
          where: { id: data.parentId }
        });

        if (!newParent || newParent.eventId !== node.eventId) {
          throw new Error('Nodo padre no válido');
        }

        // Verificar que no se crea un ciclo (no puede ser hijo de sí mismo ni de sus descendientes)
        if (data.parentId === nodeId) {
          throw new Error('Un nodo no puede ser su propio padre');
        }

        // Aquí podrías añadir lógica más compleja para detectar ciclos en descendientes
      }
    }

    const updatedNode = await prisma.communicationNode.update({
      where: { id: nodeId },
      data
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        action: 'COMM_NODE_UPDATED',
        entity: 'CommunicationNode',
        entityId: nodeId,
        userId,
        eventId: node.eventId,
        details: JSON.stringify(data)
      }
    });

    logger.info('Communication node updated', { nodeId, userId });
    return updatedNode;
  }

  // Eliminar un nodo (y sus hijos en cascada)
  async deleteNode(nodeId: string, userId: string) {
    const node = await prisma.communicationNode.findUnique({
      where: { id: nodeId },
      include: {
        children: true
      }
    });

    if (!node) {
      throw new Error('Nodo no encontrado');
    }

    await prisma.communicationNode.delete({
      where: { id: nodeId }
    });

    logger.info('Communication node deleted', { 
      nodeId, 
      userId, 
      deletedChildren: node.children.length 
    });

    return {
      message: 'Nodo eliminado correctamente',
      deletedChildren: node.children.length
    };
  }

  // Generar árbol automáticamente desde las escuadras del evento
  async autoGenerateTree(eventId: string, userId: string) {
    // Verificar que el evento existe
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        squads: {
          orderBy: { order: 'asc' }
        }
      }
    });

    if (!event) {
      throw new Error('Evento no encontrado');
    }

    // Borrar árbol existente si lo hay
    await prisma.communicationNode.deleteMany({
      where: { eventId }
    });

    // Crear nodo raíz (COMANDO)
    const rootNode = await prisma.communicationNode.create({
      data: {
        eventId,
        name: 'COMANDO CENTRAL',
        frequency: '41.00',
        type: 'COMMAND',
        positionX: 0,
        positionY: 0,
        order: 0
      }
    });

    // Crear nodo para cada escuadra
    const frequencyBase = 42;
    for (let i = 0; i < event.squads.length; i++) {
      const squad = event.squads[i];
      
      await prisma.communicationNode.create({
        data: {
          eventId,
          name: squad.name.toUpperCase(),
          frequency: `${frequencyBase + i}.00`,
          type: 'SQUAD',
          parentId: rootNode.id,
          positionX: (i - (event.squads.length - 1) / 2) * 200,
          positionY: 200,
          order: i + 1
        }
      });
    }

    // Audit log
    await prisma.auditLog.create({
      data: {
        action: 'COMM_TREE_AUTO_GENERATED',
        entity: 'Event',
        entityId: eventId,
        userId,
        eventId,
        details: JSON.stringify({
          squadCount: event.squads.length
        })
      }
    });

    logger.info('Communication tree auto-generated', { eventId, userId });

    return this.getEventTree(eventId);
  }

  // Actualizar posiciones de múltiples nodos (para drag & drop)
  async updateNodePositions(
    eventId: string,
    positions: Array<{ id: string; positionX: number; positionY: number }>,
    userId: string
  ) {
    const updatePromises = positions.map(({ id, positionX, positionY }) =>
      prisma.communicationNode.updateMany({
        where: {
          id,
          eventId // Verificar que pertenece al evento
        },
        data: {
          positionX,
          positionY
        }
      })
    );

    await Promise.all(updatePromises);

    logger.info('Node positions updated', { eventId, userId, nodeCount: positions.length });

    return { message: 'Posiciones actualizadas correctamente' };
  }
}

export const communicationTreeService = new CommunicationTreeService();