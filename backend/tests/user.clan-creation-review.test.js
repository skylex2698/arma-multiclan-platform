const test = require('node:test');
const assert = require('node:assert/strict');

const { userService } = require('../dist/services/user.service.js');
const { prisma } = require('../dist/index.js');

test.after(async () => {
  await prisma.$disconnect();
});

test('reviewClanCreationRequest aprueba la solicitud, crea el clan y promociona al usuario a lider', async (t) => {
  const originalFindUnique = prisma.clanCreationRequest.findUnique;
  const originalTransaction = prisma.$transaction;

  let updatedRequestPayload = null;
  let updatedUserPayload = null;
  let auditPayload = null;
  let createdClanPayload = null;

  prisma.clanCreationRequest.findUnique = async () => ({
    id: 'request-1',
    userId: 'user-1',
    requestedName: 'Task Force Atlas',
    requestedTag: '[TFA]',
    requestedDescription: 'Unidad principal',
    primaryGameId: 'game-1',
    status: 'PENDING',
    user: {
      id: 'user-1',
      status: 'PENDING',
    },
    primaryGame: {
      id: 'game-1',
      name: 'Arma 3',
    },
  });

  prisma.$transaction = async (callback) => {
    const tx = {
      clan: {
        create: async (payload) => {
          createdClanPayload = payload;
          return {
            id: 'clan-1',
            name: 'Task Force Atlas',
            tag: 'TFA',
          };
        },
      },
      clanCreationRequest: {
        update: async (payload) => {
          updatedRequestPayload = payload;
          return {
            id: 'request-1',
            status: 'FULFILLED',
            reviewNote: 'Aprobado',
            createdClan: {
              id: 'clan-1',
              name: 'Task Force Atlas',
              tag: 'TFA',
            },
            user: {
              id: 'user-1',
              nickname: 'Operador',
              email: 'user@example.com',
              status: 'ACTIVE',
            },
            primaryGame: {
              id: 'game-1',
              name: 'Arma 3',
            },
          };
        },
      },
      user: {
        update: async (payload) => {
          updatedUserPayload = payload;
          return payload;
        },
      },
      auditLog: {
        create: async (payload) => {
          auditPayload = payload;
          return payload;
        },
      },
    };

    return callback(tx);
  };

  t.after(() => {
    prisma.clanCreationRequest.findUnique = originalFindUnique;
    prisma.$transaction = originalTransaction;
  });

  const result = await userService.reviewClanCreationRequest(
    'request-1',
    'admin-1',
    true,
    'Aprobado'
  );

  assert.equal(result.status, 'FULFILLED');
  assert.deepEqual(createdClanPayload, {
    data: {
      name: 'Task Force Atlas',
      tag: 'TFA',
      description: 'Unidad principal',
      primaryGameId: 'game-1',
    },
  });
  assert.deepEqual(updatedRequestPayload.data.status, 'FULFILLED');
  assert.deepEqual(updatedRequestPayload.data.reviewedBy, 'admin-1');
  assert.deepEqual(updatedRequestPayload.data.reviewNote, 'Aprobado');
  assert.equal(updatedRequestPayload.data.createdClanId, 'clan-1');
  assert.ok(updatedRequestPayload.data.fulfilledAt instanceof Date);
  assert.deepEqual(updatedUserPayload, {
    where: { id: 'user-1' },
    data: {
      status: 'ACTIVE',
      mustCreateClanOnboarding: false,
      clanId: 'clan-1',
      role: 'CLAN_LEADER',
    },
  });
  assert.equal(
    auditPayload.data.action,
    'CLAN_CREATION_REQUEST_APPROVED'
  );
  assert.equal(
    JSON.parse(auditPayload.data.details).createdClanId,
    'clan-1'
  );
});

test('reviewClanCreationRequest rechaza la solicitud y bloquea onboarding', async (t) => {
  const originalFindUnique = prisma.clanCreationRequest.findUnique;
  const originalTransaction = prisma.$transaction;

  let updatedUserPayload = null;
  let auditPayload = null;

  prisma.clanCreationRequest.findUnique = async () => ({
    id: 'request-2',
    userId: 'user-2',
    requestedName: 'Ghost Unit',
    status: 'PENDING',
    user: {
      id: 'user-2',
      status: 'PENDING',
    },
  });

  prisma.$transaction = async (callback) => {
    const tx = {
      clanCreationRequest: {
        update: async () => ({
          id: 'request-2',
          status: 'REJECTED',
          reviewNote: 'Duplicado',
          user: {
            id: 'user-2',
            nickname: 'Ghost',
            email: 'ghost@example.com',
            status: 'BLOCKED',
          },
          primaryGame: {
            id: 'game-1',
            name: 'Arma 3',
          },
        }),
      },
      user: {
        update: async (payload) => {
          updatedUserPayload = payload;
          return payload;
        },
      },
      auditLog: {
        create: async (payload) => {
          auditPayload = payload;
          return payload;
        },
      },
    };

    return callback(tx);
  };

  t.after(() => {
    prisma.clanCreationRequest.findUnique = originalFindUnique;
    prisma.$transaction = originalTransaction;
  });

  const result = await userService.reviewClanCreationRequest(
    'request-2',
    'admin-1',
    false,
    'Duplicado'
  );

  assert.equal(result.status, 'REJECTED');
  assert.deepEqual(updatedUserPayload, {
    where: { id: 'user-2' },
    data: {
      status: 'BLOCKED',
      mustCreateClanOnboarding: false,
    },
  });
  assert.equal(
    auditPayload.data.action,
    'CLAN_CREATION_REQUEST_REJECTED'
  );
});
