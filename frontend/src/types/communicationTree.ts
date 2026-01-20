// frontend/src/types/communicationTree.ts

// Usar tipos literales en lugar de enum
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
  order?: number;
}

export interface UpdateNodeDto {
  name?: string;
  frequency?: string;
  type?: NodeType;
  parentId?: string;
  positionX?: number;
  positionY?: number;
  order?: number;
}

export interface UpdatePositionsDto {
  positions: Array<{
    id: string;
    positionX: number;
    positionY: number;
  }>;
}