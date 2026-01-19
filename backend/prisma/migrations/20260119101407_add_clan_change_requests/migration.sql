-- CreateTable
CREATE TABLE "ClanChangeRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "currentClanId" TEXT,
    "targetClanId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "reason" TEXT,
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClanChangeRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ClanChangeRequest_userId_idx" ON "ClanChangeRequest"("userId");

-- CreateIndex
CREATE INDEX "ClanChangeRequest_targetClanId_idx" ON "ClanChangeRequest"("targetClanId");

-- CreateIndex
CREATE INDEX "ClanChangeRequest_status_idx" ON "ClanChangeRequest"("status");

-- AddForeignKey
ALTER TABLE "ClanChangeRequest" ADD CONSTRAINT "ClanChangeRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClanChangeRequest" ADD CONSTRAINT "ClanChangeRequest_targetClanId_fkey" FOREIGN KEY ("targetClanId") REFERENCES "Clan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
