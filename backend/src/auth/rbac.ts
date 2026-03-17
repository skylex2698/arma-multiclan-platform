import { UserRole } from '@prisma/client';
import { AuthUser } from '../types';

export const PERMISSIONS = {
  USER_VIEW: 'user.view',
  USER_STATUS_MANAGE: 'user.status.manage',
  USER_ROLE_MANAGE: 'user.role.manage',
  USER_CLAN_MANAGE: 'user.clan.manage',
  USER_DELETE: 'user.delete',
  USER_PROFILE_ADMIN_EDIT: 'user.profile.admin.edit',
  USER_PASSWORD_RESET: 'user.password.reset',
  USER_EXTERNAL_CREATE: 'user.external.create',
  USER_IDENTITY_REVIEW: 'user.identity.review',
  FEEDBACK_MANAGE: 'feedback.manage',
  CLAN_CREATE: 'clan.create',
  CLAN_EDIT: 'clan.edit',
  CLAN_DELETE: 'clan.delete',
  CLAN_RESTORE: 'clan.restore',
  CLAN_AVATAR_MANAGE: 'clan.avatar.manage',
  EVENT_CREATE: 'event.create',
  EVENT_EDIT: 'event.edit',
  EVENT_STATUS_MANAGE: 'event.status.manage',
  EVENT_DELETE: 'event.delete',
  EVENT_RESTORE: 'event.restore',
  EVENT_FILES_MANAGE: 'event.files.manage',
  EVENT_ATTENDANCE_MANAGE: 'event.attendance.manage',
  SLOT_MANAGE: 'slot.manage',
  COMMUNICATIONS_MANAGE: 'communications.manage',
  GAME_MANAGE: 'game.manage',
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

const ALL_PERMISSIONS = Object.values(PERMISSIONS);
const CLAN_SCOPED_DELEGABLE_PERMISSIONS: Permission[] = [
  PERMISSIONS.USER_VIEW,
  PERMISSIONS.USER_STATUS_MANAGE,
  PERMISSIONS.USER_EXTERNAL_CREATE,
  PERMISSIONS.USER_IDENTITY_REVIEW,
  PERMISSIONS.CLAN_EDIT,
  PERMISSIONS.CLAN_AVATAR_MANAGE,
  PERMISSIONS.EVENT_CREATE,
  PERMISSIONS.EVENT_EDIT,
  PERMISSIONS.EVENT_STATUS_MANAGE,
  PERMISSIONS.EVENT_DELETE,
  PERMISSIONS.EVENT_RESTORE,
  PERMISSIONS.EVENT_FILES_MANAGE,
  PERMISSIONS.EVENT_ATTENDANCE_MANAGE,
  PERMISSIONS.SLOT_MANAGE,
  PERMISSIONS.COMMUNICATIONS_MANAGE,
];

const ROLE_PERMISSION_MAP: Record<UserRole, Permission[]> = {
  ADMIN: ALL_PERMISSIONS,
  OPERATIONS_OFFICER: [
    PERMISSIONS.EVENT_CREATE,
    PERMISSIONS.EVENT_EDIT,
    PERMISSIONS.EVENT_STATUS_MANAGE,
    PERMISSIONS.EVENT_FILES_MANAGE,
    PERMISSIONS.SLOT_MANAGE,
    PERMISSIONS.COMMUNICATIONS_MANAGE,
  ],
  RECRUITER: [
    PERMISSIONS.USER_VIEW,
    PERMISSIONS.USER_STATUS_MANAGE,
    PERMISSIONS.USER_EXTERNAL_CREATE,
    PERMISSIONS.USER_IDENTITY_REVIEW,
  ],
  CLAN_LEADER: [
    PERMISSIONS.USER_VIEW,
    PERMISSIONS.USER_STATUS_MANAGE,
    PERMISSIONS.USER_EXTERNAL_CREATE,
    PERMISSIONS.USER_IDENTITY_REVIEW,
    PERMISSIONS.CLAN_EDIT,
    PERMISSIONS.CLAN_AVATAR_MANAGE,
    PERMISSIONS.EVENT_CREATE,
    PERMISSIONS.EVENT_EDIT,
    PERMISSIONS.EVENT_STATUS_MANAGE,
    PERMISSIONS.EVENT_DELETE,
    PERMISSIONS.EVENT_RESTORE,
    PERMISSIONS.EVENT_FILES_MANAGE,
    PERMISSIONS.EVENT_ATTENDANCE_MANAGE,
    PERMISSIONS.SLOT_MANAGE,
    PERMISSIONS.COMMUNICATIONS_MANAGE,
  ],
  USER: [],
};

export const getPermissionsForRole = (role: UserRole): Permission[] =>
  ROLE_PERMISSION_MAP[role] || [];

export const getDelegablePermissionsForRole = (role: UserRole): Permission[] => {
  if (role === UserRole.ADMIN) {
    return [];
  }

  if (role === UserRole.OPERATIONS_OFFICER || role === UserRole.RECRUITER) {
    return [];
  }

  return CLAN_SCOPED_DELEGABLE_PERMISSIONS;
};

export const getEffectivePermissions = (
  role: UserRole,
  overrides: Array<{ permission: string; enabled: boolean }> = []
): Permission[] => {
  if (role === UserRole.ADMIN) {
    return ALL_PERMISSIONS;
  }

  const allowedOverrides = new Map<Permission, boolean>();
  const delegablePermissions = new Set(getDelegablePermissionsForRole(role));

  for (const override of overrides) {
    if (!delegablePermissions.has(override.permission as Permission)) {
      continue;
    }

    allowedOverrides.set(override.permission as Permission, override.enabled);
  }

  const effectivePermissions = new Set(getPermissionsForRole(role));

  for (const permission of delegablePermissions) {
    const override = allowedOverrides.get(permission);
    if (override === undefined) {
      continue;
    }

    if (override) {
      effectivePermissions.add(permission);
    } else {
      effectivePermissions.delete(permission);
    }
  }

  return Array.from(effectivePermissions);
};

export const hasPermission = (
  user: Pick<AuthUser, 'role'> & { permissions?: string[] } | null | undefined,
  permission: Permission
) => {
  if (!user) {
    return false;
  }

  if (user.permissions !== undefined) {
    return user.permissions.includes(permission);
  }

  return getPermissionsForRole(user.role).includes(permission);
};

export const isPlatformAdmin = (user: Pick<AuthUser, 'role'> | null | undefined) =>
  user?.role === UserRole.ADMIN;

export const isClanAdmin = (user: Pick<AuthUser, 'role'> | null | undefined) =>
  user?.role === UserRole.CLAN_LEADER;

export const isClanBoundRole = (role: UserRole) =>
  role === UserRole.CLAN_LEADER ||
  role === UserRole.OPERATIONS_OFFICER ||
  role === UserRole.RECRUITER;

export const canManageClanScope = (
  user: Pick<AuthUser, 'role' | 'clanId'> | null | undefined,
  clanId: string | null | undefined,
  permission: Permission
) => {
  if (!user || !clanId || !hasPermission(user, permission)) {
    return false;
  }

  if (isPlatformAdmin(user)) {
    return true;
  }

  return Boolean(isClanBoundRole(user.role) && user.clanId === clanId);
};

export const canManageUserScope = (
  user: Pick<AuthUser, 'role' | 'clanId'> | null | undefined,
  targetClanId: string | null | undefined,
  permission: Permission
) => {
  if (!user || !hasPermission(user, permission)) {
    return false;
  }

  if (isPlatformAdmin(user)) {
    return true;
  }

  return Boolean(targetClanId && isClanBoundRole(user.role) && user.clanId === targetClanId);
};

export const canManageEventScope = (
  user: Pick<AuthUser, 'role' | 'clanId'> | null | undefined,
  creatorClanId: string | null | undefined,
  permission: Permission
) => {
  if (!user || !hasPermission(user, permission)) {
    return false;
  }

  if (isPlatformAdmin(user)) {
    return true;
  }

  return Boolean(creatorClanId && isClanBoundRole(user.role) && user.clanId === creatorClanId);
};
