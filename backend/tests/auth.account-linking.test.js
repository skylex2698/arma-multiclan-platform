const test = require('node:test');
const assert = require('node:assert/strict');

const { authService } = require('../dist/services/auth.service.js');
const { userService } = require('../dist/services/user.service.js');
const { prisma } = require('../dist/index.js');

test.after(async () => {
  await prisma.$disconnect();
});

test('upsertUserFromDiscord reutiliza la cuenta existente si el email coincide', async (t) => {
  const originalUserFindUnique = prisma.user.findUnique;
  const originalUserFindFirst = prisma.user.findFirst;
  const originalUserUpdate = prisma.user.update;
  const originalOAuthUpsert = prisma.oAuthAccount.upsert;

  let oauthUpsertPayload = null;

  prisma.user.findUnique = async ({ where }) => {
    if (where?.discordId) {
      return null;
    }

    return null;
  };

  prisma.user.findFirst = async () => ({
    id: 'user-local-1',
    email: 'same@example.com',
    nickname: 'Cuenta Local',
    timezone: 'Europe/Madrid',
    role: 'USER',
    status: 'ACTIVE',
    clanId: 'clan-1',
    avatarUrl: null,
    discordId: null,
    discordUsername: null,
    clan: null,
    gameIdentities: [],
  });

  prisma.user.update = async ({ where, data, include }) => ({
    id: where.id,
    email: data.email,
    nickname: 'Cuenta Local',
    timezone: 'Europe/Madrid',
    role: 'USER',
    status: 'ACTIVE',
    clanId: 'clan-1',
    avatarUrl: null,
    discordId: data.discordId,
    discordUsername: data.discordUsername,
    clan: include?.clan ? null : undefined,
    gameIdentities: include?.gameIdentities ? [] : undefined,
  });

  prisma.oAuthAccount.upsert = async (args) => {
    oauthUpsertPayload = args;
    return { id: 'oauth-1' };
  };

  t.after(() => {
    prisma.user.findUnique = originalUserFindUnique;
    prisma.user.findFirst = originalUserFindFirst;
    prisma.user.update = originalUserUpdate;
    prisma.oAuthAccount.upsert = originalOAuthUpsert;
  });

  const result = await authService.upsertUserFromDiscord({
    discordId: 'discord-123',
    discordUsername: 'discordUser',
    email: 'Same@example.com',
    accessToken: 'access-token',
    refreshToken: 'refresh-token',
    expiresIn: 3600,
    scope: 'identify email',
  });

  assert.equal(result.isNewUser, false);
  assert.equal(result.user.id, 'user-local-1');
  assert.equal(result.user.email, 'same@example.com');
  assert.equal(result.user.discordId, 'discord-123');
  assert.equal(oauthUpsertPayload.create.userId, 'user-local-1');
  assert.equal(
    oauthUpsertPayload.where.provider_providerAccountId.providerAccountId,
    'discord-123'
  );
});

test('selfResetPassword permite fijar contraseña aunque la cuenta no tuviera password previa', async (t) => {
  const originalUserFindUnique = prisma.user.findUnique;
  const originalUserUpdate = prisma.user.update;
  const originalAuditCreate = prisma.auditLog.create;

  let updatedPassword = null;
  let auditPayload = null;

  prisma.user.findUnique = async () => ({
    id: 'user-discord-only',
  });

  prisma.user.update = async ({ data }) => {
    updatedPassword = data.password;
    return { id: 'user-discord-only' };
  };

  prisma.auditLog.create = async (args) => {
    auditPayload = args;
    return { id: 'audit-1' };
  };

  t.after(() => {
    prisma.user.findUnique = originalUserFindUnique;
    prisma.user.update = originalUserUpdate;
    prisma.auditLog.create = originalAuditCreate;
  });

  await userService.selfResetPassword('user-discord-only', 'Password123');

  assert.ok(updatedPassword);
  assert.equal(auditPayload.data.entityId, 'user-discord-only');
  assert.match(updatedPassword, /^\$2[aby]\$/);
});
