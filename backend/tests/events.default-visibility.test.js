const test = require('node:test');
const assert = require('node:assert/strict');

const { eventService } = require('../dist/services/event.service.js');
const { prisma } = require('../dist/index.js');

test.after(async () => {
  await prisma.$disconnect();
});

test('createEvent usa visibilidad privada por defecto si no se indica otra', async (t) => {
  const originalUserFindUnique = prisma.user.findUnique;
  const originalClanFindMany = prisma.clan.findMany;
  const originalTransaction = prisma.$transaction;

  let createdEventData = null;

  prisma.user.findUnique = async () => ({
    role: 'CLAN_LEADER',
    clanId: 'clan-1',
  });

  prisma.clan.findMany = async () => [];

  prisma.$transaction = async (callback) =>
    callback({
      event: {
        create: async ({ data }) => {
          createdEventData = data;
          return {
            id: 'event-1',
            ...data,
            creator: { nickname: 'Leader' },
            game: { id: 'game-1', name: 'Arma 3' },
            squads: [],
            invitedClans: [],
          };
        },
        findUnique: async () => ({
          id: 'event-1',
          name: 'Op privada',
          creator: { nickname: 'Leader' },
          game: { id: 'game-1', name: 'Arma 3' },
          squads: [],
          invitedClans: [],
        }),
      },
      squad: {
        update: async () => null,
      },
      auditLog: {
        create: async () => null,
      },
    });

  t.after(() => {
    prisma.user.findUnique = originalUserFindUnique;
    prisma.clan.findMany = originalClanFindMany;
    prisma.$transaction = originalTransaction;
  });

  await eventService.createEvent({
    name: 'Op privada',
    gameId: 'game-1',
    scheduledDate: new Date(Date.now() + 86400000),
    creatorId: 'user-1',
    squads: [
      {
        id: 'temp-1',
        name: 'Alpha',
        order: 1,
        slots: [{ role: 'Lider', order: 1 }],
      },
    ],
  });

  assert.equal(createdEventData.visibility, 'PRIVATE');
});
