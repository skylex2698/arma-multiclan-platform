// frontend/src/hooks/useCommunicationTree.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { communicationTreeService } from '../services/communicationTreeService';
import type {
  CreateNodeDto,
  UpdateNodeDto,
  UpdatePositionsDto,
} from '../types/communicationTree';

// Hook para obtener el árbol de un evento
export const useCommunicationTree = (eventId: string) => {
  return useQuery({
    queryKey: ['communicationTree', eventId],
    queryFn: () => communicationTreeService.getEventTree(eventId),
    enabled: !!eventId,
  });
};

// Hook para crear un nodo
export const useCreateNode = (eventId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateNodeDto) =>
      communicationTreeService.createNode(eventId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communicationTree', eventId] });
    },
  });
};

// Hook para actualizar un nodo
export const useUpdateNode = (eventId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ nodeId, data }: { nodeId: string; data: UpdateNodeDto }) =>
      communicationTreeService.updateNode(eventId, nodeId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communicationTree', eventId] });
    },
  });
};

// Hook para eliminar un nodo
export const useDeleteNode = (eventId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (nodeId: string) =>
      communicationTreeService.deleteNode(eventId, nodeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communicationTree', eventId] });
    },
  });
};

// Hook para auto-generar el árbol
export const useAutoGenerateTree = (eventId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => communicationTreeService.autoGenerateTree(eventId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communicationTree', eventId] });
    },
  });
};

// Hook para actualizar posiciones (drag & drop)
export const useUpdatePositions = (eventId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdatePositionsDto) =>
      communicationTreeService.updatePositions(eventId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communicationTree', eventId] });
    },
  });
};