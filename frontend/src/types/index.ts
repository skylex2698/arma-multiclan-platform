// Enums
export enum UserRole {
  USER = 'USER',
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

export type GameType = 'ARMA_3' | 'ARMA_REFORGER';

export enum SlotStatus {
  FREE = 'FREE',
  OCCUPIED = 'OCCUPIED'
}

// Interfaces
export interface User {
  id: string;
  email: string | null;
  nickname: string;
  role: UserRole;
  status: UserStatus;
  avatarUrl?: string | null;
  clanId: string | null;
  discordId: string | null;
  discordUsername: string | null;
  clan?: Clan;
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
  memberCount?: number;
  createdAt: string;
  updatedAt?: string;
}

export interface Event {
  id: string;
  name: string;
  description: string | null;
  briefing: string | null;
  briefingFileUrl: string | null;
  modsetFileUrl: string | null;
  gameType: GameType;
  status: EventStatus;
  scheduledDate: string;
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
    };
  };
  squads: Squad[];
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
  clanId: string;
}

export interface CreateEventForm {
  name: string;
  description?: string;
  briefing?: string;
  gameType: GameType;
  scheduledDate: Date;
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
}

export interface SaveAttendanceResponse {
  attendances: Attendance[];
  summary: AttendanceSummary;
  blockedUsers: string[];
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