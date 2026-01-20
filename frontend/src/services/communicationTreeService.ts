// frontend/src/services/communicationTreeService.ts

import { api } from './api';
import type {
  CommunicationNode,
  CreateNodeDto,
  UpdateNodeDto,
  UpdatePositionsDto,
} from '../types/communicationTree';

export const communicationTreeService = {
  // Obtener árbol completo de un evento
  getEventTree: async (eventId: string): Promise<CommunicationNode[]> => {
    try {
      const response = await api.get(`/events/${eventId}/communication-tree`);
      
      // El backend puede devolver la data directamente o envuelta en un objeto
      const data = response.data?.data || response.data;
      
      // Asegurarse de devolver siempre un array
      if (Array.isArray(data)) {
        return data;
      }
      
      return [];
    } catch (error: any) {
      // Si es 404 o no hay datos, devolver array vacío
      if (error.response?.status === 404) {
        return [];
      }
      console.error('Error fetching communication tree:', error);
      return [];
    }
  },

  // Crear un nodo
  createNode: async (
    eventId: string,
    data: CreateNodeDto
  ): Promise<CommunicationNode> => {
    const response = await api.post(
      `/events/${eventId}/communication-tree`,
      data
    );
    return response.data?.data || response.data;
  },

  // Actualizar un nodo
  updateNode: async (
    eventId: string,
    nodeId: string,
    data: UpdateNodeDto
  ): Promise<CommunicationNode> => {
    const response = await api.put(
      `/events/${eventId}/communication-tree/${nodeId}`,
      data
    );
    return response.data?.data || response.data;
  },

  // Eliminar un nodo
  deleteNode: async (eventId: string, nodeId: string): Promise<void> => {
    await api.delete(`/events/${eventId}/communication-tree/${nodeId}`);
  },

  // Auto-generar árbol desde escuadras
  autoGenerateTree: async (eventId: string): Promise<CommunicationNode[]> => {
    const response = await api.post(
      `/events/${eventId}/communication-tree/auto-generate`
    );
    
    const data = response.data?.data || response.data;
    
    if (Array.isArray(data)) {
      return data;
    }
    
    return [];
  },

  // Actualizar posiciones de nodos (drag & drop)
  updatePositions: async (
    eventId: string,
    data: UpdatePositionsDto
  ): Promise<void> => {
    await api.patch(`/events/${eventId}/communication-tree/positions`, data);
  },
};