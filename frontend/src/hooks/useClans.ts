import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { clanService } from '../services/clanService';

export function useClans() {
  return useQuery({
    queryKey: ['clans'],
    queryFn: () => clanService.getAll(),
  });
}

export function useClan(id: string) {
  return useQuery({
    queryKey: ['clan', id],
    queryFn: () => clanService.getById(id),
    enabled: !!id,
  });
}

export function useClanMembers(id: string) {
  return useQuery({
    queryKey: ['clan-members', id],
    queryFn: () => clanService.getMembers(id),
    enabled: !!id,
  });
}

export function useCreateClan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { name: string; tag?: string; description?: string }) =>
      clanService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clans'] });
    },
  });
}

export function useUpdateClan(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      name?: string;
      tag?: string;
      description?: string;
    }) => clanService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clans'] });
      queryClient.invalidateQueries({ queryKey: ['clan', id] });
    },
  });
}

export function useDeleteClan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => clanService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clans'] });
    },
  });
}