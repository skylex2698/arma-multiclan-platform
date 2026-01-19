import { UserRole, UserStatus } from '@prisma/client';

export interface AuthUser {
  id: string;
  email: string | null;
  nickname: string;
  role: UserRole;
  status: UserStatus;
  clanId: string | null;
  discordId: string | null;
}

export interface JWTPayload {
  userId: string;
  role: UserRole;
  clanId?: string;
}

export interface DiscordProfile {
  id: string;
  username: string;
  discriminator: string;
  avatar?: string;
  email?: string;
}

export interface CreateEventDTO {
  name: string;
  description?: string;
  briefing?: string;
  gameType: 'ARMA_3' | 'ARMA_REFORGER';
  scheduledDate: Date;
  squads: CreateSquadDTO[];
}

export interface CreateSquadDTO {
  name: string;
  order: number;
  slots: CreateSlotDTO[];
}

export interface CreateSlotDTO {
  role: string;
  order: number;
}