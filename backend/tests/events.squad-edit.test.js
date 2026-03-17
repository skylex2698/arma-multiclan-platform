const test = require('node:test');
const assert = require('node:assert/strict');

const { eventService } = require('../dist/services/event.service.js');
const { prisma } = require('../dist/index.js');

test.after(async () => {
  await prisma.$disconnect();
});

test('updateEvent elimina escuadras borradas y crea nuevas sin conservar las antiguas', async (t) => {
  const originalEventFindUnique = prisma.event.findUnique;
  const originalTransaction = prisma.$transaction;
  const originalUserFindUnique = prisma.user.findUnique;

  const deletedSquads = [];
  const createdSquads = [];
  const updatedSquads = [];
  const createdSlots = [];

  prisma.event.findUnique = async () => ({
    id: 'event-1',
    status: 'ACTIVE',
    squads: [
      {
        id: '11111111-1111-1111-1111-111111111111',
        slots: [
          {
            id: 'slot-1',
            role: 'Fusilero',
            order: 1,
          },
        ],
      },
    ],
  });

  prisma.user.findUnique = async () => ({
    id: 'user-1',
    role: 'ADMIN',
    clanId: 'clan-1',
  });

  prisma.$transaction = async (callback) => {
    const tx = {
      squad: {
        delete: async ({ where }) => {
          deletedSquads.push(where.id);
          return { id: where.id };
        },
        update: async ({ where, data }) => {
          updatedSquads.push({ id: where.id, data });
          return { id: where.id };
        },
        create: async ({ data }) => {
          createdSquads.push(data);
          return { id: '22222222-2222-2222-2222-222222222222' };
        },
      },
      slot: {
        delete: async () => null,
        update: async () => null,
        create: async ({ data }) => {
          createdSlots.push(data);
          return data;
        },
      },
      eventInvitation: {
        deleteMany: async () => null,
        createMany: async () => null,
      },
      event: {
        update: async () => ({
          id: 'event-1',
          squads: [
            {
              id: '22222222-2222-2222-2222-222222222222',
              slots: [
                { id: 'slot-2', status: 'FREE' },
                { id: 'slot-3', status: 'FREE' },
              ],
            },
          ],
        }),
      },
    };

    return callback(tx);
  };

  t.after(() => {
    prisma.event.findUnique = originalEventFindUnique;
    prisma.$transaction = originalTransaction;
    prisma.user.findUnique = originalUserFindUnique;
  });

  const result = await eventService.updateEvent(
    'event-1',
    {
      name: 'Operacion Refactor',
      squads: [
        {
          id: 'temp-new-squad',
          name: 'Bravo',
          order: 1,
          slots: [
            { role: 'Jefe de Escuadra', order: 1 },
            { role: 'Fusilero', order: 2 },
          ],
        },
      ],
    },
    'user-1'
  );

  assert.deepEqual(deletedSquads, ['11111111-1111-1111-1111-111111111111']);
  assert.equal(createdSquads.length, 1);
  assert.equal(createdSquads[0].name, 'Bravo');
  assert.deepEqual(createdSquads[0].slots.create, [
    { role: 'Jefe de Escuadra', order: 1, status: 'FREE' },
    { role: 'Fusilero', order: 2, status: 'FREE' },
  ]);
  assert.equal(updatedSquads.length, 1);
  assert.deepEqual(updatedSquads[0], {
    id: '22222222-2222-2222-2222-222222222222',
    data: {
      parentSquadId: null,
      parentFrequency: null,
    },
  });
  assert.equal(createdSlots.length, 0);
  assert.equal(result.totalSlots, 2);
  assert.equal(result.occupiedSlots, 0);
});

test('getEventById filtra escuadras y slots soft-deleted en eventos activos', async (t) => {
  const originalFindFirst = prisma.event.findFirst;

  let receivedArgs = null;

  prisma.event.findFirst = async (args) => {
    receivedArgs = args;
    return {
      id: 'event-1',
      squads: [],
    };
  };

  t.after(() => {
    prisma.event.findFirst = originalFindFirst;
  });

  const result = await eventService.getEventById('event-1');

  assert.equal(result.totalSlots, 0);
  assert.equal(result.occupiedSlots, 0);
  assert.deepEqual(receivedArgs.include.squads.where, {
    deletedAt: null,
  });
  assert.deepEqual(receivedArgs.include.squads.include.slots.where, {
    deletedAt: null,
  });
});
