// backend/src/types/index.ts - VERSIÓN ACTUALIZADA COMPLETA

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

// ========== DTOs DE SLOT ==========
export interface CreateSlotDTO {
  role: string;
  order: number;
}

export interface UpdateSlotDto {
  id?: string;
  role: string;
  order: number;
}

// ========== DTOs DE SQUAD CON CAMPOS DE COMUNICACIÓN ==========
export interface CreateSquadDTO {
  name: string;
  order: number;
  frequency?: string;
  isCommand?: boolean;
  parentSquadId?: string;
  parentFrequency?: string;
  slots: CreateSlotDTO[];
}

export interface UpdateSquadDto {
  id?: string;
  name: string;
  order: number;
  frequency?: string;
  isCommand?: boolean;
  parentSquadId?: string;
  parentFrequency?: string;
  slots: UpdateSlotDto[];
}

// ========== DTOs DE EVENT ==========
export interface CreateEventDTO {
  name: string;
  description?: string;
  briefing?: string;
  gameType: 'ARMA_3' | 'ARMA_REFORGER';
  scheduledDate: Date;
  squads: CreateSquadDTO[];
}

export interface UpdateEventDTO {
  name?: string;
  description?: string;
  briefing?: string;
  gameType?: 'ARMA_3' | 'ARMA_REFORGER';
  scheduledDate?: Date;
  squads?: UpdateSquadDto[];
}