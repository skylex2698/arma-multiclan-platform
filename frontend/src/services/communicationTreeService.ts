// frontend/src/services/communicationTreeService.ts

import { api } from './api';
import type {
  CommunicationNode,
  CreateNodeDto,
  UpdateNodeDto,
  UpdatePositionsDto,
} from '../types/communicationTree';
import type { ApiResponse } from '../types';

export const communicationTreeService = {
  // Obtener árbol completo de un evento
  getEventTree: async (eventId: string): Promise<CommunicationNode[]> => {
    const response = await api.get<ApiResponse<CommunicationNode[]>>(
      `/events/${eventId}/communication-tree`
    );
    return response.data.data;
  },

  // Crear un nodo
  createNode: async (
    eventId: string,
    data: CreateNodeDto
  ): Promise<CommunicationNode> => {
    const response = await api.post<ApiResponse<CommunicationNode>>(
      `/events/${eventId}/communication-tree`,
      data
    );
    return response.data.data;
  },

  // Actualizar un nodo
  updateNode: async (
    eventId: string,
    nodeId: string,
    data: UpdateNodeDto
  ): Promise<CommunicationNode> => {
    const response = await api.put<ApiResponse<CommunicationNode>>(
      `/events/${eventId}/communication-tree/${nodeId}`,
      data
    );
    return response.data.data;
  },

  // Eliminar un nodo
  deleteNode: async (eventId: string, nodeId: string): Promise<void> => {
    await api.delete(`/events/${eventId}/communication-tree/${nodeId}`);
  },

  // Auto-generar árbol desde escuadras
  autoGenerateTree: async (eventId: string): Promise<CommunicationNode[]> => {
    const response = await api.post<ApiResponse<CommunicationNode[]>>(
      `/events/${eventId}/communication-tree/auto-generate`
    );
    return response.data.data;
  },

  // Actualizar posiciones de nodos (drag & drop)
  updatePositions: async (
    eventId: string,
    data: UpdatePositionsDto
  ): Promise<void> => {
    await api.patch(`/events/${eventId}/communication-tree/positions`, data);
  },
};