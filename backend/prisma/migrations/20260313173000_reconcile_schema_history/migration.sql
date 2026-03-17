DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'AttendanceStatus') THEN
    CREATE TYPE "AttendanceStatus" AS ENUM ('PRESENT', 'ABSENT_JUSTIFIED', 'NO_SHOW');
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'NodeType') THEN
    CREATE TYPE "NodeType" AS ENUM ('COMMAND', 'SQUAD', 'ELEMENT', 'SUPPORT');
  END IF;
END
$$;

ALTER TYPE "EventStatus" ADD VALUE IF NOT EXISTS 'FINISHED';
ALTER TYPE "UserStatus" ADD VALUE IF NOT EXISTS 'EXTERNAL';

ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "blockedUntil" TIMESTAMP(3);

ALTER TABLE "Clan"
  ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);

ALTER TABLE "Event"
  ADD COLUMN IF NOT EXISTS "briefingFileUrl" TEXT,
  ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "modsetFileUrl" TEXT,
  ADD COLUMN IF NOT EXISTS "publicShareToken" TEXT,
  ADD COLUMN IF NOT EXISTS "serverIp" TEXT,
  ADD COLUMN IF NOT EXISTS "serverName" TEXT,
  ADD COLUMN IF NOT EXISTS "serverPassword" TEXT,
  ADD COLUMN IF NOT EXISTS "serverPort" TEXT;

ALTER TABLE "Squad"
  ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "frequency" TEXT,
  ADD COLUMN IF NOT EXISTS "isCommand" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "parentFrequency" TEXT,
  ADD COLUMN IF NOT EXISTS "parentSquadId" TEXT,
  ADD COLUMN IF NOT EXISTS "reservedForClanId" TEXT;

ALTER TABLE "Slot"
  ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);

CREATE TABLE IF NOT EXISTS "Attendance" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "eventId" TEXT NOT NULL,
  "slotId" TEXT,
  "status" "AttendanceStatus" NOT NULL,
  "note" TEXT,
  "markedBy" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "Attendance_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "CommunicationNode" (
  "id" TEXT NOT NULL,
  "eventId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "frequency" TEXT,
  "type" "NodeType" NOT NULL,
  "parentId" TEXT,
  "parentFrequency" TEXT,
  "positionX" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "positionY" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "order" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "CommunicationNode_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "OAuthAccount" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "provider" TEXT NOT NULL,
  "providerAccountId" TEXT NOT NULL,
  "accessToken" TEXT,
  "refreshToken" TEXT,
  "tokenType" TEXT,
  "scope" TEXT,
  "expiresAt" INTEGER,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "OAuthAccount_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "Clan_deletedAt_idx" ON "Clan"("deletedAt");
CREATE UNIQUE INDEX IF NOT EXISTS "Event_publicShareToken_key" ON "Event"("publicShareToken");
CREATE INDEX IF NOT EXISTS "Event_deletedAt_idx" ON "Event"("deletedAt");
CREATE INDEX IF NOT EXISTS "Slot_deletedAt_idx" ON "Slot"("deletedAt");
CREATE INDEX IF NOT EXISTS "Squad_reservedForClanId_idx" ON "Squad"("reservedForClanId");
CREATE INDEX IF NOT EXISTS "Squad_deletedAt_idx" ON "Squad"("deletedAt");
CREATE INDEX IF NOT EXISTS "Attendance_eventId_idx" ON "Attendance"("eventId");
CREATE INDEX IF NOT EXISTS "Attendance_userId_idx" ON "Attendance"("userId");
CREATE UNIQUE INDEX IF NOT EXISTS "Attendance_userId_eventId_key" ON "Attendance"("userId", "eventId");
CREATE INDEX IF NOT EXISTS "CommunicationNode_eventId_idx" ON "CommunicationNode"("eventId");
CREATE INDEX IF NOT EXISTS "CommunicationNode_parentId_idx" ON "CommunicationNode"("parentId");
CREATE INDEX IF NOT EXISTS "OAuthAccount_userId_idx" ON "OAuthAccount"("userId");
CREATE UNIQUE INDEX IF NOT EXISTS "OAuthAccount_provider_providerAccountId_key" ON "OAuthAccount"("provider", "providerAccountId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'Squad_parentSquadId_fkey'
  ) THEN
    ALTER TABLE "Squad"
      ADD CONSTRAINT "Squad_parentSquadId_fkey"
      FOREIGN KEY ("parentSquadId") REFERENCES "Squad"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'Squad_reservedForClanId_fkey'
  ) THEN
    ALTER TABLE "Squad"
      ADD CONSTRAINT "Squad_reservedForClanId_fkey"
      FOREIGN KEY ("reservedForClanId") REFERENCES "Clan"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'Attendance_userId_fkey'
  ) THEN
    ALTER TABLE "Attendance"
      ADD CONSTRAINT "Attendance_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'Attendance_eventId_fkey'
  ) THEN
    ALTER TABLE "Attendance"
      ADD CONSTRAINT "Attendance_eventId_fkey"
      FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'CommunicationNode_eventId_fkey'
  ) THEN
    ALTER TABLE "CommunicationNode"
      ADD CONSTRAINT "CommunicationNode_eventId_fkey"
      FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'CommunicationNode_parentId_fkey'
  ) THEN
    ALTER TABLE "CommunicationNode"
      ADD CONSTRAINT "CommunicationNode_parentId_fkey"
      FOREIGN KEY ("parentId") REFERENCES "CommunicationNode"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'OAuthAccount_userId_fkey'
  ) THEN
    ALTER TABLE "OAuthAccount"
      ADD CONSTRAINT "OAuthAccount_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END
$$;
