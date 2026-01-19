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
  INACTIVE = 'INACTIVE'
}

export enum EventStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE'
}

export enum GameType {
  ARMA_3 = 'ARMA_3',
  ARMA_REFORGER = 'ARMA_REFORGER'
}

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
  gameType: GameType;
  status: EventStatus;
  scheduledDate: string;
  creatorId: string;
  creator?: {
    id: string;
    nickname: string;
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
  squads: {
    name: string;
    order: number;
    slots: {
      role: string;
      order: number;
    }[];
  }[];
}