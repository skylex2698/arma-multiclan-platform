import { PrismaClient } from '@prisma/client';
import { purgeArchivedClanAvatar } from '../config/multer.config';

const prisma = new PrismaClient();
const RETENTION_DAYS = 30;

async function main() {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - RETENTION_DAYS);

  const clans = await prisma.clan.findMany({
    where: {
      deletedAt: { not: null },
      avatarArchivedPath: { not: null },
      avatarArchivedAt: { lte: cutoff },
    },
    select: {
      id: true,
      avatarArchivedPath: true,
    },
  });

  for (const clan of clans) {
    if (clan.avatarArchivedPath) {
      purgeArchivedClanAvatar(clan.avatarArchivedPath);
      await prisma.clan.update({
        where: { id: clan.id },
        data: {
          avatarArchivedPath: null,
          avatarArchivedAt: null,
        },
      });
    }
  }

  console.log(`Purged ${clans.length} archived clan assets`);
}

main()
  .catch((error) => {
    console.error('Error purging archived clan assets', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
