import type { User } from '../types';

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

const ROLE_PERMISSIONS = {
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
} satisfies Record<string, Permission[]>;

export const hasPermission = (
  user: Pick<User, 'role' | 'permissions'> | null | undefined,
  permission: Permission
) => {
  if (!user) {
    return false;
  }

  if (user.permissions !== undefined) {
    return user.permissions.includes(permission);
  }

  return ROLE_PERMISSIONS[user.role]?.includes(permission) || false;
};

export const DELEGABLE_CLAN_PERMISSIONS: Permission[] = [
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

export const PERMISSION_LABELS: Record<Permission, string> = {
  [PERMISSIONS.USER_VIEW]: 'Ver personal',
  [PERMISSIONS.USER_STATUS_MANAGE]: 'Cambiar estado de usuarios',
  [PERMISSIONS.USER_ROLE_MANAGE]: 'Cambiar roles',
  [PERMISSIONS.USER_CLAN_MANAGE]: 'Mover usuarios entre clanes',
  [PERMISSIONS.USER_DELETE]: 'Eliminar usuarios',
  [PERMISSIONS.USER_PROFILE_ADMIN_EDIT]: 'Editar perfil de cualquier usuario',
  [PERMISSIONS.USER_PASSWORD_RESET]: 'Resetear contraseñas',
  [PERMISSIONS.USER_EXTERNAL_CREATE]: 'Crear miembros externos',
  [PERMISSIONS.USER_IDENTITY_REVIEW]: 'Revisar identidades',
  [PERMISSIONS.FEEDBACK_MANAGE]: 'Gestionar feedback de plataforma',
  [PERMISSIONS.CLAN_CREATE]: 'Crear clanes',
  [PERMISSIONS.CLAN_EDIT]: 'Editar clan propio',
  [PERMISSIONS.CLAN_DELETE]: 'Eliminar clanes',
  [PERMISSIONS.CLAN_RESTORE]: 'Restaurar clanes',
  [PERMISSIONS.CLAN_AVATAR_MANAGE]: 'Gestionar logo de clan',
  [PERMISSIONS.EVENT_CREATE]: 'Crear eventos',
  [PERMISSIONS.EVENT_EDIT]: 'Editar eventos',
  [PERMISSIONS.EVENT_STATUS_MANAGE]: 'Cambiar estado de eventos',
  [PERMISSIONS.EVENT_DELETE]: 'Eliminar eventos',
  [PERMISSIONS.EVENT_RESTORE]: 'Restaurar eventos',
  [PERMISSIONS.EVENT_FILES_MANAGE]: 'Gestionar archivos del evento',
  [PERMISSIONS.EVENT_ATTENDANCE_MANAGE]: 'Gestionar asistencia',
  [PERMISSIONS.SLOT_MANAGE]: 'Gestionar slots y escuadras',
  [PERMISSIONS.COMMUNICATIONS_MANAGE]: 'Gestionar comunicaciones',
  [PERMISSIONS.GAME_MANAGE]: 'Gestionar catalogo de juegos',
};

const resolveRole = (roleOrUser: Pick<User, 'role'> | User['role'] | null | undefined) => {
  if (!roleOrUser) {
    return null;
  }

  return typeof roleOrUser === 'string' ? roleOrUser : roleOrUser.role;
};

export const getRoleBadgeVariant = (roleOrUser: Pick<User, 'role'> | User['role']) => {
  const role = resolveRole(roleOrUser);

  switch (role) {
    case 'ADMIN':
      return 'danger' as const;
    case 'RECRUITER':
      return 'success' as const;
    case 'OPERATIONS_OFFICER':
      return 'info' as const;
    case 'CLAN_LEADER':
      return 'warning' as const;
    default:
      return 'default' as const;
  }
};

export const getRoleDisplayName = (
  roleOrUser: Pick<User, 'role'> | User['role'] | null | undefined
) => {
  const role = resolveRole(roleOrUser);

  if (!role) {
    return '';
  }

  switch (role) {
    case 'ADMIN':
      return 'Administrador de plataforma';
    case 'OPERATIONS_OFFICER':
      return 'Oficial de operaciones';
    case 'RECRUITER':
      return 'Oficial de personal';
    case 'CLAN_LEADER':
      return 'Administrador de clan';
    default:
      return 'Operador';
  }
};
