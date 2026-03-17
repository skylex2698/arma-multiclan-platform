import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userService } from '../services/userService';
import type { ClanCreationRequest, User, UserRole, UserStatus } from '../types';
import { useAuthStore } from '../store/authStore';
import { authService } from '../services/authService';

export function useUsers(filters?: {
  clanId?: string;
  role?: string;
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
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

export function useAdminUpdateUserProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      userId,
      data,
    }: {
      userId: string;
      data: { nickname?: string; email?: string | null; timezone?: string };
    }) => userService.adminUpdateProfile(userId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

export function useAdminResetUserPassword() {
  return useMutation({
    mutationFn: (userId: string) => userService.adminResetPassword(userId),
  });
}

export function useAdminUpdateUserPermissions() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      userId,
      permissions,
    }: {
      userId: string;
      permissions: string[];
    }) => userService.adminUpdatePermissions(userId, permissions),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
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
      // Para usuarios disponibles, traemos todos sin paginación (limit alto)
      const params = clanId
        ? { clanId, status: 'ACTIVE', limit: 500 }
        : { status: 'ACTIVE', limit: 500 };
      const result = await userService.getAll(params);
      return { users: result.users, count: result.total };
    },
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const setAuth = useAuthStore((state) => state.setAuth);

  return useMutation({
    mutationFn: (data: { nickname?: string; email?: string; timezone?: string }) =>
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

export function useSelfResetPassword() {
  return useMutation({
    mutationFn: (data: { newPassword: string }) =>
      userService.selfResetPassword(data),
  });
}

export function useUpdateUserRole() {
  const queryClient = useQueryClient();
  const setAuth = useAuthStore((state) => state.setAuth);

  return useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: UserRole }) =>
      userService.updateRole(userId, role),
    onSuccess: async () => {
      try {
        const response = await authService.getMe();
        setAuth(response.user);
      } catch {
        // Ignore auth refresh failures here.
      }
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
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

export function useCreateExternalUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ nickname, clanId }: { nickname: string; clanId?: string }) =>
      userService.createExternalUser(nickname, clanId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => userService.deleteUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

export function useClanCreationRequests(filters?: { status?: string }) {
  return useQuery({
    queryKey: ['clan-creation-requests', filters],
    queryFn: () => userService.getClanCreationRequests(filters),
  });
}

export function useReviewClanCreationRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      requestId,
      approved,
      reviewNote,
    }: {
      requestId: string;
      approved: boolean;
      reviewNote?: string;
    }) => userService.reviewClanCreationRequest(requestId, approved, reviewNote),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clan-creation-requests'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

export function useCurrentApprovedClanCreationRequest(
  enabled = true
) {
  return useQuery<{ request: ClanCreationRequest }>({
    queryKey: ['current-approved-clan-creation-request'],
    queryFn: () => userService.getCurrentApprovedClanCreationRequest(),
    enabled,
    retry: false,
  });
}
