const test = require('node:test');
const assert = require('node:assert/strict');

const { userService } = require('../dist/services/user.service.js');
const { prisma } = require('../dist/index.js');

test.after(async () => {
  await prisma.$disconnect();
});

test('updateRole permite varios lideres de clan sin degradar a los existentes', async (t) => {
  const originalFindUnique = prisma.user.findUnique;
  const originalTransaction = prisma.$transaction;

  let updateManyCalled = false;
  let updatedRolePayload = null;
  let auditPayload = null;

  prisma.user.findUnique = async () => ({
    id: 'target-user',
    role: 'USER',
    clanId: 'clan-1',
    status: 'ACTIVE',
  });

  prisma.$transaction = async (callback) =>
    callback({
      user: {
        updateMany: async () => {
          updateManyCalled = true;
          return { count: 0 };
        },
        update: async (args) => {
          updatedRolePayload = args;
          return { id: 'target-user', role: 'CLAN_LEADER' };
        },
      },
      userPermissionOverride: {
        deleteMany: async () => ({ count: 0 }),
      },
      auditLog: {
        create: async (args) => {
          auditPayload = args;
          return { id: 'audit-1' };
        },
      },
    });

  t.after(() => {
    prisma.user.findUnique = originalFindUnique;
    prisma.$transaction = originalTransaction;
  });

  await userService.updateRole('target-user', 'CLAN_LEADER', {
    id: 'leader-1',
    role: 'CLAN_LEADER',
    clanId: 'clan-1',
  });

  assert.equal(updateManyCalled, false);
  assert.equal(updatedRolePayload.data.role, 'CLAN_LEADER');
  assert.equal(auditPayload.data.details.includes('"newRole":"CLAN_LEADER"'), true);
});
