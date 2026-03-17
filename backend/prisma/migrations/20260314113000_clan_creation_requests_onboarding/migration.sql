CREATE TYPE "ClanCreationRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'FULFILLED');

ALTER TABLE "User"
ADD COLUMN "mustCreateClanOnboarding" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE "ClanCreationRequest" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "requestedName" TEXT NOT NULL,
  "requestedTag" TEXT,
  "requestedDescription" TEXT,
  "primaryGameId" TEXT NOT NULL,
  "status" "ClanCreationRequestStatus" NOT NULL DEFAULT 'PENDING',
  "reviewedBy" TEXT,
  "reviewNote" TEXT,
  "reviewedAt" TIMESTAMP(3),
  "createdClanId" TEXT,
  "fulfilledAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ClanCreationRequest_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ClanCreationRequest_userId_idx" ON "ClanCreationRequest"("userId");
CREATE INDEX "ClanCreationRequest_status_idx" ON "ClanCreationRequest"("status");
CREATE INDEX "ClanCreationRequest_primaryGameId_idx" ON "ClanCreationRequest"("primaryGameId");

ALTER TABLE "ClanCreationRequest"
ADD CONSTRAINT "ClanCreationRequest_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ClanCreationRequest"
ADD CONSTRAINT "ClanCreationRequest_primaryGameId_fkey"
FOREIGN KEY ("primaryGameId") REFERENCES "Game"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ClanCreationRequest"
ADD CONSTRAINT "ClanCreationRequest_reviewedBy_fkey"
FOREIGN KEY ("reviewedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ClanCreationRequest"
ADD CONSTRAINT "ClanCreationRequest_createdClanId_fkey"
FOREIGN KEY ("createdClanId") REFERENCES "Clan"("id") ON DELETE SET NULL ON UPDATE CASCADE;
