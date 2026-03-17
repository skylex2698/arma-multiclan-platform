import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { clanService } from '../services/clanService';

export function useClans(filters?: { deleted?: boolean }) {
  return useQuery({
    queryKey: ['clans', filters],
    queryFn: () => clanService.getAll(filters),
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
    mutationFn: (data: { name: string; tag?: string; description?: string; primaryGameId: string }) =>
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
      primaryGameId?: string;
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

export function useRestoreClan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => clanService.restore(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clans'] });
    },
  });
}

export function useUploadClanAvatar(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (file: File) => clanService.uploadAvatar(id, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clans'] });
      queryClient.invalidateQueries({ queryKey: ['clan', id] });
    },
  });
}

export function useDeleteClanAvatar(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => clanService.deleteAvatar(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clans'] });
      queryClient.invalidateQueries({ queryKey: ['clan', id] });
    },
  });
}

export function useClanNotionIntegration(id: string) {
  return useQuery({
    queryKey: ['clan-notion', id],
    queryFn: () => clanService.getNotionIntegration(id),
    enabled: !!id,
  });
}

export function useSaveClanNotionIntegration(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      enabled: boolean;
      token?: string;
      parentPageId?: string;
      missionsDatabaseId?: string;
      participationsDatabaseId?: string;
      syncMode: 'MANUAL' | 'AUTO';
    }) => clanService.saveNotionIntegration(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clan-notion', id] });
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
    },
  });
}

export function useTestClanNotionConnection(id: string) {
  return useMutation({
    mutationFn: (data?: { token?: string; parentPageId?: string }) =>
      clanService.testNotionConnection(id, data),
  });
}
