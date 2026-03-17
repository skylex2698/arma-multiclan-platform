CREATE TYPE "EventVisibility" AS ENUM ('PUBLIC', 'PRIVATE');

ALTER TABLE "Event"
ADD COLUMN "visibility" "EventVisibility" NOT NULL DEFAULT 'PUBLIC';

CREATE TABLE "EventInvitation" (
  "id" TEXT NOT NULL,
  "eventId" TEXT NOT NULL,
  "clanId" TEXT NOT NULL,
  "invitedBy" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "EventInvitation_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "EventInvitation_eventId_clanId_key" ON "EventInvitation"("eventId", "clanId");
CREATE INDEX "EventInvitation_eventId_idx" ON "EventInvitation"("eventId");
CREATE INDEX "EventInvitation_clanId_idx" ON "EventInvitation"("clanId");

ALTER TABLE "EventInvitation"
ADD CONSTRAINT "EventInvitation_eventId_fkey"
FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "EventInvitation"
ADD CONSTRAINT "EventInvitation_clanId_fkey"
FOREIGN KEY ("clanId") REFERENCES "Clan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "EventInvitation"
ADD CONSTRAINT "EventInvitation_invitedBy_fkey"
FOREIGN KEY ("invitedBy") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
