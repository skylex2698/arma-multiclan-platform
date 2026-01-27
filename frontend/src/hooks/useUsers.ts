import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userService } from '../services/userService';
import type { User, UserRole, UserStatus } from '../types';
import { useAuthStore } from '../store/authStore';

export function useUsers(filters?: {
  clanId?: string;
  role?: string;
  status?: string;
  search?: string;
}) {
  return useQuery({
    queryKey: ['users', filters],
    queryFn: () => userService.getAll(filters),
  });
}

export function useUser(id: string) {
  return useQuery({
    queryKey: ['user', id],
    queryFn: () => userService.getById(id),
    enabled: !!id,
  });
}

export function useValidateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => userService.validate(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

export function useChangeUserRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: UserRole }) =>
      userService.changeRole(userId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

export function useChangeUserStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, status }: { userId: string; status: UserStatus }) =>
      userService.changeStatus(userId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

export function useChangeUserClan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      userId,
      clanId,
    }: {
      userId: string;
      clanId: string | null;
    }) => userService.changeClan(userId, clanId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

export function useClanChangeRequests(filters?: { status?: string }) {
  return useQuery({
    queryKey: ['clan-change-requests', filters],
    queryFn: () => userService.getClanChangeRequests(filters),
  });
}

export function useReviewClanChangeRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      requestId,
      approved,
    }: {
      requestId: string;
      approved: boolean;
    }) => userService.reviewClanChangeRequest(requestId, approved),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clan-change-requests'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

export function useAvailableUsers(clanId?: string) {
  return useQuery({
    queryKey: ['users', 'available', clanId],
    queryFn: async () => {
      const params = clanId ? { clanId, status: 'ACTIVE' } : { status: 'ACTIVE' };
      return userService.getAll(params);
    },
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const setAuth = useAuthStore((state) => state.setAuth);

  return useMutation({
    mutationFn: (data: { nickname?: string; email?: string }) =>
      userService.updateProfile(data),
    onSuccess: (response) => {
      // Actualizar el usuario en el store
      // No necesitamos el token porque la autenticación usa cookies httpOnly
      setAuth(response.user);
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (data: { currentPassword: string; newPassword: string }) =>
      userService.changePassword(data),
  });
}

export function useUpdateUserRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: UserRole }) =>
      userService.updateRole(userId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

export function useUpdateUserStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, status }: { userId: string; status: UserStatus }) =>
      userService.updateStatus(userId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}