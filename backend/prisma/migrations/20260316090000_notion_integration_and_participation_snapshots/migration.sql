CREATE TYPE "NotionSyncMode" AS ENUM ('MANUAL', 'AUTO');

CREATE TABLE "ClanNotionIntegration" (
  "id" TEXT NOT NULL,
  "clanId" TEXT NOT NULL,
  "enabled" BOOLEAN NOT NULL DEFAULT false,
  "notionToken" TEXT,
  "missionsDatabaseId" TEXT,
  "participationsDatabaseId" TEXT,
  "syncMode" "NotionSyncMode" NOT NULL DEFAULT 'MANUAL',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ClanNotionIntegration_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ParticipationSnapshot" (
  "id" TEXT NOT NULL,
  "clanId" TEXT NOT NULL,
  "eventId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "userNickname" TEXT NOT NULL,
  "eventName" TEXT NOT NULL,
  "eventDate" TIMESTAMP(3) NOT NULL,
  "attendanceStatus" "AttendanceStatus" NOT NULL,
  "slotRole" TEXT,
  "squadName" TEXT,
  "exportedToNotion" BOOLEAN NOT NULL DEFAULT false,
  "exportedToNotionAt" TIMESTAMP(3),
  "notionLastSyncAt" TIMESTAMP(3),
  "notionLastError" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ParticipationSnapshot_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ClanNotionIntegration_clanId_key" ON "ClanNotionIntegration"("clanId");
CREATE INDEX "ClanNotionIntegration_enabled_idx" ON "ClanNotionIntegration"("enabled");

CREATE UNIQUE INDEX "ParticipationSnapshot_clanId_eventId_userId_key" ON "ParticipationSnapshot"("clanId", "eventId", "userId");
CREATE INDEX "ParticipationSnapshot_clanId_idx" ON "ParticipationSnapshot"("clanId");
CREATE INDEX "ParticipationSnapshot_eventId_idx" ON "ParticipationSnapshot"("eventId");
CREATE INDEX "ParticipationSnapshot_userId_idx" ON "ParticipationSnapshot"("userId");
CREATE INDEX "ParticipationSnapshot_eventDate_idx" ON "ParticipationSnapshot"("eventDate");
CREATE INDEX "ParticipationSnapshot_exportedToNotion_idx" ON "ParticipationSnapshot"("exportedToNotion");

ALTER TABLE "ClanNotionIntegration"
ADD CONSTRAINT "ClanNotionIntegration_clanId_fkey"
FOREIGN KEY ("clanId") REFERENCES "Clan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ParticipationSnapshot"
ADD CONSTRAINT "ParticipationSnapshot_clanId_fkey"
FOREIGN KEY ("clanId") REFERENCES "Clan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ParticipationSnapshot"
ADD CONSTRAINT "ParticipationSnapshot_eventId_fkey"
FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ParticipationSnapshot"
ADD CONSTRAINT "ParticipationSnapshot_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
