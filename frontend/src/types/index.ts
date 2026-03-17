// Enums
export enum UserRole {
  USER = 'USER',
  OPERATIONS_OFFICER = 'OPERATIONS_OFFICER',
  RECRUITER = 'RECRUITER',
  CLAN_LEADER = 'CLAN_LEADER',
  ADMIN = 'ADMIN'
}

export enum UserStatus {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  BLOCKED = 'BLOCKED',
  BANNED = 'BANNED',
  INACTIVE = 'INACTIVE',
  EXTERNAL = 'EXTERNAL',
}

export enum EventStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  FINISHED = 'FINISHED'
}

export enum EventVisibility {
  PUBLIC = 'PUBLIC',
  PRIVATE = 'PRIVATE',
}

export enum SlotStatus {
  FREE = 'FREE',
  OCCUPIED = 'OCCUPIED'
}

export type GameStatus = 'ACTIVE' | 'INACTIVE';
export type GameIdentityMode = 'STEAM64' | 'MANUAL' | 'NONE';
export type GameIdentityProviderKind = 'STEAM' | 'MANUAL' | 'NONE';
export type GameIdentityStatus = 'PENDING' | 'VERIFIED' | 'REJECTED';
export type NotionSyncMode = 'MANUAL' | 'AUTO';
export type FeedbackType = 'BUG' | 'SUGGESTION';
export type FeedbackStatus = 'OPEN' | 'IN_REVIEW' | 'DONE' | 'REJECTED';

// Interfaces
export interface Game {
  id: string;
  slug: string;
  name: string;
  status: GameStatus;
  supportsModsetHtml: boolean;
  identityMode: GameIdentityMode;
  identityLabel: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface GameIdentity {
  id: string;
  userId: string;
  gameId: string;
  providerKind: GameIdentityProviderKind;
  value: string;
  normalizedValue?: string | null;
  status: GameIdentityStatus;
  verifiedBy?: string | null;
  verifiedAt?: string | null;
  game: Game;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  email: string | null;
  nickname: string;
  timezone: string;
  mustCreateClanOnboarding?: boolean;
  role: UserRole;
  permissions?: string[];
  status: UserStatus;
  avatarUrl?: string | null;
  clanId: string | null;
  discordId: string | null;
  discordUsername: string | null;
  clan?: Clan;
  gameIdentities?: GameIdentity[];
  blockedUntil?: string | null;
  createdAt: string;
  updatedAt?: string;
}

export interface Clan {
  id: string;
  name: string;
  tag: string | null;
  description: string | null;
  avatarUrl: string | null;
  primaryGameId: string;
  primaryGame: Game;
  memberCount?: number;
  createdAt: string;
  updatedAt?: string;
}

export interface FeedbackItem {
  id: string;
  type: FeedbackType;
  status: FeedbackStatus;
  title: string;
  description: string;
  pagePath?: string | null;
  adminNote?: string | null;
  reviewedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    nickname: string;
    email?: string | null;
  };
  clan?: {
    id: string;
    name: string;
    tag: string | null;
  } | null;
  reviewer?: {
    id: string;
    nickname: string;
  } | null;
}

export interface ClanNotionIntegration {
  enabled: boolean;
  hasToken: boolean;
  maskedToken: string | null;
  parentPageId: string | null;
  missionsDatabaseId: string | null;
  participationsDatabaseId: string | null;
  syncMode: NotionSyncMode;
}

export interface Event {
  id: string;
  name: string;
  description: string | null;
  briefing: string | null;
  briefingFileUrl: string | null;
  modsetFileUrl: string | null;
  gameId: string;
  game: Game;
  status: EventStatus;
  visibility: EventVisibility;
  scheduledDate: string;
  timezone: string;
  creatorId: string;
  serverName?: string | null;
  serverIp?: string | null;
  serverPort?: string | null;
  serverPassword?: string | null;
  publicShareToken?: string | null;
  creator?: {
    id: string;
    nickname: string;
    clanId?: string;
    clan?: {
      name: string;
      tag: string;
      primaryGame?: Game;
    };
  };
  squads: Squad[];
  invitedClans?: Array<{
    clan: {
      id: string;
      name: string;
      tag: string | null;
      avatarUrl?: string | null;
    };
  }>;
  totalSlots?: number;
  occupiedSlots?: number;
  createdAt: string;
  updatedAt?: string;
}

export interface Squad {
  id: string;
  name: string;
  order: number;
  eventId: string;

  frequency?: string;         // Frecuencia interna (ej: "42.00")
  isCommand: boolean;         // Si es nodo de mando
  parentSquadId?: string;     // ID de la escuadra padre
  parentSquad?: Squad;        // Referencia a la escuadra padre
  childSquads?: Squad[];      // Escuadras hijas
  parentFrequency?: string;   // Frecuencia para comunicarse con el padre

  reservedForClanId?: string | null;
  reservedForClan?: {
    id: string;
    name: string;
    tag: string | null;
    avatarUrl: string | null;
  } | null;

  slots: Slot[];
  createdAt: string;
  updatedAt?: string;
}

export interface Slot {
  id: string;
  role: string;
  order: number;
  status: SlotStatus;
  userId: string | null;
  squadId: string;
  user?: User | null;
  createdAt: string;
  updatedAt?: string;
}

export interface ClanChangeRequest {
  id: string;
  userId: string;
  currentClanId: string | null;
  targetClanId: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  reason: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  user: {
    id: string;
    nickname: string;
    email: string;
    clan?: {
      name: string;
      tag: string;
    };
  };
  targetClan: {
    id: string;
    name: string;
    tag: string;
  };
  createdAt: string;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface AuthResponse {
  token: string;
  user: User;
}

// Form types
export interface LoginForm {
  email: string;
  password: string;
}

export interface RegisterForm {
  email: string;
  password: string;
  nickname: string;
  clanId?: string;
  requestNewClan?: boolean;
  newClanName?: string;
  newClanTag?: string;
  newClanDescription?: string;
  newClanPrimaryGameId?: string;
}

export interface ClanCreationRequest {
  id: string;
  userId: string;
  requestedName: string;
  requestedTag: string | null;
  requestedDescription: string | null;
  primaryGameId: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'FULFILLED';
  reviewNote: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  fulfilledAt: string | null;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    nickname: string;
    email: string | null;
    status: UserStatus;
  };
  primaryGame?: {
    id: string;
    name: string;
  };
  createdClan?: {
    id: string;
    name: string;
    tag: string | null;
  } | null;
}

export interface CreateEventForm {
  name: string;
  description?: string;
  briefing?: string;
  gameId: string;
  scheduledDate: Date;
  visibility?: EventVisibility;
  invitedClanIds?: string[];
  timezone?: string;
  serverName?: string;
  serverIp?: string;
  serverPort?: string;
  serverPassword?: string;
  squads: {
    id?: string; // ID temporal para mapear jerarquías
    name: string;
    order: number;
    frequency?: string;
    isCommand?: boolean;
    parentSquadId?: string;
    parentFrequency?: string;
    slots: {
      role: string;
      order: number;
    }[];
  }[];
}

export interface CreateSquadDto {
  name: string;
  order: number;
    frequency?: string;
    isCommand?: boolean;
    parentSquadId?: string;
    parentFrequency?: string;
    reservedForClanId?: string | null;
    slots: Array<{
      role: string;
      order: number;
  }>;
}

export interface UpdateSquadDto {
  name?: string;
  order?: number;
  frequency?: string;
  isCommand?: boolean;
  parentSquadId?: string;
  parentFrequency?: string;
  slots?: Array<{
    id?: string;
    role: string;
    order: number;
    isNew?: boolean;
  }>;
}

// ========== ATTENDANCE TYPES ==========

export type AttendanceStatus = 'PRESENT' | 'ABSENT_JUSTIFIED' | 'NO_SHOW';

export interface Attendance {
  id: string;
  userId: string;
  user: {
    id: string;
    nickname: string;
    clanId: string | null;
    avatarUrl?: string | null;
    clan?: { id: string; name: string; tag: string | null };
  };
  eventId: string;
  slotId: string | null;
  status: AttendanceStatus;
  note: string | null;
  markedBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface AttendancePrePopulated {
  userId: string;
  user: {
    id: string;
    nickname: string;
    clanId: string | null;
    avatarUrl?: string | null;
    clan?: { id: string; name: string; tag: string | null };
  };
  slotId: string;
  squadName: string;
  slotRole: string;
  status: AttendanceStatus | null;
  note: string | null;
}

export interface AttendanceSummary {
  present: number;
  noShow: number;
  justifiedAbsent: number;
  total: number;
}

export interface AttendanceResponse {
  attendances: Attendance[];
  prePopulated?: AttendancePrePopulated[];
  summary: AttendanceSummary | null;
  notionIntegration: Pick<ClanNotionIntegration, 'enabled' | 'syncMode'>;
}

export interface SaveAttendanceResponse {
  attendances: Attendance[];
  summary: AttendanceSummary;
  blockedUsers: string[];
  snapshotsGenerated: number;
}

export interface NotionSyncResultRow {
  snapshotId: string;
  userId: string;
  userNickname: string;
  status: 'created' | 'updated' | 'failed';
  error?: string;
}

export interface NotionSyncSummary {
  total: number;
  created: number;
  updated: number;
  failed: number;
  results: NotionSyncResultRow[];
}

export interface ReliabilityScore {
  userId: string;
  totalEvents: number;
  present: number;
  noShow: number;
  justifiedAbsent: number;
  score: number | null;
  recentNoShows: number;
  blockedUntil: string | null;
}
