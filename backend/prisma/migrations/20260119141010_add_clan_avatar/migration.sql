-- AlterTable
ALTER TABLE "Clan" ADD COLUMN     "avatarUrl" TEXT;

-- CreateIndex
CREATE INDEX "Clan_name_idx" ON "Clan"("name");
