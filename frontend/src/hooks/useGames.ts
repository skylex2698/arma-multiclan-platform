import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { gameService } from '../services/gameService';
import type { GameIdentityProviderKind, GameIdentityStatus } from '../types';

export function useGames(filters?: { includeInactive?: boolean }) {
  return useQuery({
    queryKey: ['games', filters],
    queryFn: () => gameService.getAll(filters),
  });
}

export function useCreateGame() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: gameService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['games'] });
    },
  });
}

export function useUpdateGame() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof gameService.update>[1] }) =>
      gameService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['games'] });
    },
  });
}

export function useDeleteGame() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => gameService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['games'] });
    },
  });
}

export function useCurrentUserGameIdentities() {
  return useQuery({
    queryKey: ['profile', 'game-identities'],
    queryFn: () => gameService.getCurrentUserIdentities(),
  });
}

export function useUpsertCurrentUserGameIdentity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ gameId, data }: { gameId: string; data: { providerKind?: GameIdentityProviderKind; value: string } }) =>
      gameService.upsertCurrentUserIdentity(gameId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', 'game-identities'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

export function useUpdateGameIdentityStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ identityId, status }: { identityId: string; status: GameIdentityStatus }) =>
      gameService.updateIdentityStatus(identityId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', 'game-identities'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}
