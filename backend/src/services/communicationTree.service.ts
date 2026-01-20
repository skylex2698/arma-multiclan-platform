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
          orderBy: { order: 'asc' },
          include: {
            parentSquad: true,
            childSquads: true
          }
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

    const createdNodes: Record<string, any> = {}; // Mapa de squadId -> node

    // PASO 1: Crear nodos de comando primero
    const commandSquads = event.squads.filter(s => s.isCommand);
    for (let i = 0; i < commandSquads.length; i++) {
      const squad = commandSquads[i];
      
      const node = await prisma.communicationNode.create({
        data: {
          eventId,
          name: squad.name.toUpperCase(),
          frequency: squad.frequency || '41.00',
          type: 'COMMAND',
          positionX: i * 300,
          positionY: 0,
          order: i,
          // ⚠️ Los nodos COMMAND no tienen padre, así que parentFrequency es null
          parentFrequency: null
        }
      });

      createdNodes[squad.id] = node;
    }

    // PASO 2: Crear nodos normales (escuadras)
    const normalSquads = event.squads.filter(s => !s.isCommand);
    
    // Ordenar por jerarquía (primero los que no tienen padre, luego sus hijos)
    const sortedSquads = sortByHierarchy(normalSquads);
    
    for (let i = 0; i < sortedSquads.length; i++) {
      const squad = sortedSquads[i];
      
      // Determinar el padre del nodo
      let parentNodeId: string | undefined = undefined;
      
      if (squad.parentSquadId && createdNodes[squad.parentSquadId]) {
        // Si tiene padre y ya fue creado, usarlo
        parentNodeId = createdNodes[squad.parentSquadId].id;
      } else if (commandSquads.length > 0) {
        // Si no tiene padre asignado pero hay comandos, conectar al primer comando
        parentNodeId = createdNodes[commandSquads[0].id]?.id;
      }

      // Determinar el tipo de nodo
      const nodeType = squad.childSquads.length > 0 ? 'SQUAD' : 'ELEMENT';

      // Calcular posición
      const level = getHierarchyLevel(squad, event.squads);
      const indexAtLevel = getIndexAtLevel(squad, sortedSquads, level);
      
      const node = await prisma.communicationNode.create({
        data: {
          eventId,
          name: squad.name.toUpperCase(),
          frequency: squad.frequency || undefined,
          type: nodeType,
          parentId: parentNodeId,
          // ========== IMPORTANTE: Guardar parentFrequency ==========
          parentFrequency: squad.parentFrequency || null,
          // =========================================================
          positionX: (indexAtLevel) * 250,
          positionY: level * 200,
          order: i + commandSquads.length
        }
      });

      createdNodes[squad.id] = node;
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
          squadCount: event.squads.length,
          nodeCount: Object.keys(createdNodes).length
        })
      }
    });

    logger.info('Communication tree auto-generated', { 
      eventId, 
      userId,
      nodeCount: Object.keys(createdNodes).length 
    });

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

// Funciones auxiliares (sin cambios)
function sortByHierarchy(squads: any[]): any[] {
  const sorted: any[] = [];
  const processed = new Set<string>();
  
  function addSquadWithChildren(squad: any) {
    if (processed.has(squad.id)) return;
    
    sorted.push(squad);
    processed.add(squad.id);
    
    const children = squads.filter(s => s.parentSquadId === squad.id);
    children.forEach(child => addSquadWithChildren(child));
  }
  
  const rootSquads = squads.filter(s => !s.parentSquadId);
  rootSquads.forEach(squad => addSquadWithChildren(squad));
  
  squads.forEach(squad => {
    if (!processed.has(squad.id)) {
      addSquadWithChildren(squad);
    }
  });
  
  return sorted;
}

function getHierarchyLevel(squad: any, allSquads: any[]): number {
  let level = 1;
  let current = squad;
  
  while (current.parentSquadId) {
    level++;
    current = allSquads.find(s => s.id === current.parentSquadId);
    if (!current) break;
  }
  
  return level;
}

function getIndexAtLevel(squad: any, sortedSquads: any[], level: number): number {
  const squadsAtLevel = sortedSquads.filter(s => 
    getHierarchyLevel(s, sortedSquads) === level
  );
  return squadsAtLevel.indexOf(squad);
}

export const communicationTreeService = new CommunicationTreeService();