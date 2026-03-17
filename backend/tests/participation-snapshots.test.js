const test = require('node:test');
const assert = require('node:assert/strict');

const { participationSnapshotService } = require('../dist/services/participationSnapshot.service.js');

test('upsertEventSnapshots solo conserva miembros activos del clan organizador', async () => {
  const deleteManyCalls = [];
  const upsertCalls = [];

  const tx = {
    event: {
      findUnique: async () => ({
        id: 'event-1',
        name: 'Operación Martillo',
        scheduledDate: new Date('2026-03-16T20:00:00.000Z'),
        creator: {
          clanId: 'clan-bear',
        },
      }),
    },
    attendance: {
      findMany: async () => [
        {
          userId: 'user-valid',
          slotId: 'slot-1',
          status: 'PRESENT',
          user: {
            id: 'user-valid',
            nickname: 'Tutu',
            clanId: 'clan-bear',
            status: 'ACTIVE',
          },
        },
        {
          userId: 'user-external',
          slotId: null,
          status: 'PRESENT',
          user: {
            id: 'user-external',
            nickname: 'Invitado',
            clanId: null,
            status: 'EXTERNAL',
          },
        },
        {
          userId: 'user-other-clan',
          slotId: 'slot-2',
          status: 'NO_SHOW',
          user: {
            id: 'user-other-clan',
            nickname: 'Aliado',
            clanId: 'clan-ally',
            status: 'ACTIVE',
          },
        },
      ],
    },
    slot: {
      findMany: async () => [
        {
          id: 'slot-1',
          role: 'Líder de Escuadra',
          squad: {
            name: 'Alpha',
          },
        },
        {
          id: 'slot-2',
          role: 'Médico',
          squad: {
            name: 'Bravo',
          },
        },
      ],
    },
    participationSnapshot: {
      deleteMany: async (args) => {
        deleteManyCalls.push(args);
        return { count: 0 };
      },
      upsert: async (args) => {
        upsertCalls.push(args);
        return args;
      },
    },
  };

  const result = await participationSnapshotService.upsertEventSnapshots(tx, 'event-1');

  assert.equal(result.clanId, 'clan-bear');
  assert.equal(result.eligibleSnapshotCount, 1);
  assert.equal(deleteManyCalls.length, 1);
  assert.deepEqual(deleteManyCalls[0], {
    where: {
      clanId: 'clan-bear',
      eventId: 'event-1',
      userId: {
        notIn: ['user-valid'],
      },
    },
  });

  assert.equal(upsertCalls.length, 1);
  assert.deepEqual(upsertCalls[0].where, {
    clanId_eventId_userId: {
      clanId: 'clan-bear',
      eventId: 'event-1',
      userId: 'user-valid',
    },
  });
  assert.equal(upsertCalls[0].create.userNickname, 'Tutu');
  assert.equal(upsertCalls[0].create.slotRole, 'Líder de Escuadra');
  assert.equal(upsertCalls[0].create.squadName, 'Alpha');
  assert.equal(upsertCalls[0].create.exportedToNotion, false);
});
