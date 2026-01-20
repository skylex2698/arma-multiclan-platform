// frontend/src/types/communicationTree.ts
// VERSIÓN ACTUALIZADA CON PARENTFREQUENCY

export const NodeType = {
  COMMAND: 'COMMAND',
  SQUAD: 'SQUAD',
  ELEMENT: 'ELEMENT',
  SUPPORT: 'SUPPORT',
} as const;

export type NodeType = typeof NodeType[keyof typeof NodeType];

export interface CommunicationNode {
  id: string;
  eventId: string;
  name: string;
  frequency?: string;
  type: NodeType;
  parentId?: string;
  parentFrequency?: string; // ← AÑADIR ESTE CAMPO
  positionX: number;
  positionY: number;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateNodeDto {
  name: string;
  frequency?: string;
  type: NodeType;
  parentId?: string;
  positionX?: number;
  positionY?: number;
}

export interface UpdateNodeDto {
  name?: string;
  frequency?: string;
  type?: NodeType;
  parentId?: string;
}

export interface UpdatePositionsDto {
  positions: Array<{
    id: string;
    positionX: number;
    positionY: number;
  }>;
}