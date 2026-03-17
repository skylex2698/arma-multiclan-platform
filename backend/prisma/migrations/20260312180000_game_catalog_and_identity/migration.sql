-- Create enums
CREATE TYPE "GameStatus" AS ENUM ('ACTIVE', 'INACTIVE');
CREATE TYPE "GameIdentityMode" AS ENUM ('STEAM64', 'MANUAL', 'NONE');
CREATE TYPE "GameIdentityProviderKind" AS ENUM ('STEAM', 'MANUAL', 'NONE');
CREATE TYPE "GameIdentityStatus" AS ENUM ('PENDING', 'VERIFIED', 'REJECTED');

-- Create Game table
CREATE TABLE "Game" (
  "id" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "status" "GameStatus" NOT NULL DEFAULT 'ACTIVE',
  "supportsModsetHtml" BOOLEAN NOT NULL DEFAULT false,
  "identityMode" "GameIdentityMode" NOT NULL DEFAULT 'NONE',
  "identityLabel" TEXT,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Game_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Game_slug_key" ON "Game"("slug");
CREATE INDEX "Game_status_idx" ON "Game"("status");
CREATE INDEX "Game_sortOrder_idx" ON "Game"("sortOrder");

INSERT INTO "Game" (
  "id",
  "slug",
  "name",
  "status",
  "supportsModsetHtml",
  "identityMode",
  "identityLabel",
  "sortOrder",
  "createdAt",
  "updatedAt"
)
VALUES
  (
    '5fb8033a-1c32-4ded-a68b-bd0815cb8011',
    'arma-3',
    'Arma 3',
    'ACTIVE',
    true,
    'STEAM64',
    'Steam64',
    1,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  ),
  (
    'd6f1db0d-c065-48ef-98ae-9162044ed352',
    'arma-reforger',
    'Arma Reforger',
    'ACTIVE',
    false,
    'MANUAL',
    'Identificador de Reforger',
    2,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  );

-- Extend Clan
ALTER TABLE "Clan"
  ADD COLUMN "avatarArchivedAt" TIMESTAMP(3),
  ADD COLUMN "avatarArchivedPath" TEXT,
  ADD COLUMN "primaryGameId" TEXT;

UPDATE "Clan"
SET "primaryGameId" = (
  SELECT "id" FROM "Game" WHERE "slug" = 'arma-3' LIMIT 1
)
WHERE "primaryGameId" IS NULL;

ALTER TABLE "Clan" ALTER COLUMN "primaryGameId" SET NOT NULL;
ALTER TABLE "Clan"
  ADD CONSTRAINT "Clan_primaryGameId_fkey"
  FOREIGN KEY ("primaryGameId") REFERENCES "Game"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
CREATE INDEX "Clan_primaryGameId_idx" ON "Clan"("primaryGameId");

-- Extend Event and migrate enum values
ALTER TABLE "Event" ADD COLUMN "gameId" TEXT;

UPDATE "Event"
SET "gameId" = CASE
  WHEN "gameType" = 'ARMA_3' THEN (SELECT "id" FROM "Game" WHERE "slug" = 'arma-3' LIMIT 1)
  WHEN "gameType" = 'ARMA_REFORGER' THEN (SELECT "id" FROM "Game" WHERE "slug" = 'arma-reforger' LIMIT 1)
  ELSE (SELECT "id" FROM "Game" WHERE "slug" = 'arma-3' LIMIT 1)
END;

ALTER TABLE "Event" ALTER COLUMN "gameId" SET NOT NULL;
ALTER TABLE "Event"
  ADD CONSTRAINT "Event_gameId_fkey"
  FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
CREATE INDEX "Event_gameId_idx" ON "Event"("gameId");

ALTER TABLE "Event" DROP COLUMN "gameType";
DROP TYPE "GameType";

-- Game identities
CREATE TABLE "GameIdentity" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "gameId" TEXT NOT NULL,
  "providerKind" "GameIdentityProviderKind" NOT NULL,
  "value" TEXT NOT NULL,
  "normalizedValue" TEXT,
  "status" "GameIdentityStatus" NOT NULL DEFAULT 'PENDING',
  "verifiedBy" TEXT,
  "verifiedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "GameIdentity_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "GameIdentity_userId_idx" ON "GameIdentity"("userId");
CREATE INDEX "GameIdentity_gameId_idx" ON "GameIdentity"("gameId");
CREATE INDEX "GameIdentity_status_idx" ON "GameIdentity"("status");
CREATE UNIQUE INDEX "GameIdentity_gameId_providerKind_normalizedValue_key" ON "GameIdentity"("gameId", "providerKind", "normalizedValue");
CREATE UNIQUE INDEX "GameIdentity_userId_gameId_key" ON "GameIdentity"("userId", "gameId");

ALTER TABLE "GameIdentity"
  ADD CONSTRAINT "GameIdentity_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GameIdentity"
  ADD CONSTRAINT "GameIdentity_gameId_fkey"
  FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE CASCADE ON UPDATE CASCADE;
