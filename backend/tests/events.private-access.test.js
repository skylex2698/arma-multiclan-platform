const test = require('node:test');
const assert = require('node:assert/strict');

const { eventService } = require('../dist/services/event.service.js');
const { prisma } = require('../dist/index.js');

test.after(async () => {
  await prisma.$disconnect();
});

test('getAllEvents restringe usuarios anónimos a eventos públicos', async (t) => {
  const originalCheckAndFinishExpiredEvents = eventService.checkAndFinishExpiredEvents;
  const originalCount = prisma.event.count;
  const originalFindMany = prisma.event.findMany;

  const seenWhere = [];

  eventService.checkAndFinishExpiredEvents = async () => 0;
  prisma.event.count = async ({ where }) => {
    seenWhere.push(where);
    return 0;
  };
  prisma.event.findMany = async ({ where }) => {
    seenWhere.push(where);
    return [];
  };

  t.after(() => {
    eventService.checkAndFinishExpiredEvents = originalCheckAndFinishExpiredEvents;
    prisma.event.count = originalCount;
    prisma.event.findMany = originalFindMany;
  });

  await eventService.getAllEvents({});

  assert.equal(seenWhere.length, 2);
  assert.equal(seenWhere[0].visibility, 'PUBLIC');
  assert.equal(seenWhere[1].visibility, 'PUBLIC');
});

test('getAllEvents permite acceso privado por clan creador, invitación o reserva', async (t) => {
  const originalCheckAndFinishExpiredEvents = eventService.checkAndFinishExpiredEvents;
  const originalCount = prisma.event.count;
  const originalFindMany = prisma.event.findMany;

  const seenWhere = [];

  eventService.checkAndFinishExpiredEvents = async () => 0;
  prisma.event.count = async ({ where }) => {
    seenWhere.push(where);
    return 0;
  };
  prisma.event.findMany = async ({ where }) => {
    seenWhere.push(where);
    return [];
  };

  t.after(() => {
    eventService.checkAndFinishExpiredEvents = originalCheckAndFinishExpiredEvents;
    prisma.event.count = originalCount;
    prisma.event.findMany = originalFindMany;
  });

  await eventService.getAllEvents({
    requesterRole: 'CLAN_LEADER',
    requesterClanId: 'clan-1',
  });

  assert.equal(seenWhere.length, 2);
  const orConditions = seenWhere[0].OR;
  assert.equal(Array.isArray(orConditions), true);
  assert.deepEqual(orConditions[0], { visibility: 'PUBLIC' });
  assert.deepEqual(orConditions[1], { creator: { clanId: 'clan-1' } });
  assert.deepEqual(orConditions[2], {
    invitedClans: {
      some: {
        clanId: 'clan-1',
      },
    },
  });
  assert.deepEqual(orConditions[3], {
    squads: {
      some: {
        reservedForClanId: 'clan-1',
      },
    },
  });
});
