const test = require('node:test');
const assert = require('node:assert/strict');

const { app, prisma } = require('../dist/index.js');
const { generateToken } = require('../dist/utils/jwt.js');
const { startTestServer } = require('./helpers/http.js');

const adminToken = generateToken({
  userId: 'admin-1',
  role: 'ADMIN',
});

test.after(async () => {
  await prisma.$disconnect();
});

test('subida de briefing demasiado grande devuelve un mensaje explícito', async (t) => {
  const originalUserFindUnique = prisma.user.findUnique;
  const originalEventFindFirst = prisma.event.findFirst;

  prisma.user.findUnique = async () => ({
    id: 'admin-1',
    email: 'admin@example.com',
    nickname: 'Admin',
    timezone: 'Europe/Madrid',
    mustCreateClanOnboarding: false,
    role: 'ADMIN',
    status: 'ACTIVE',
    clanId: null,
    discordId: null,
    permissionOverrides: [],
  });

  prisma.event.findFirst = async () => ({
    id: 'event-1',
    creator: {
      clanId: 'clan-1',
    },
  });

  const http = await startTestServer(app);

  t.after(async () => {
    prisma.user.findUnique = originalUserFindUnique;
    prisma.event.findFirst = originalEventFindFirst;
    await http.close();
  });

  const form = new FormData();
  form.append(
    'briefingFile',
    new Blob([new Uint8Array(10 * 1024 * 1024 + 1)], { type: 'application/pdf' }),
    'oversize.pdf'
  );

  const response = await fetch(`${http.baseUrl}/api/events/event-1/briefing-file`, {
    method: 'POST',
    headers: {
      Cookie: `token=${adminToken}`,
    },
    body: form,
  });

  const body = await response.json();

  assert.equal(response.status, 400);
  assert.equal(body.success, false);
  assert.equal(body.message, 'El archivo es demasiado grande. Máximo 10MB.');
});

test('subida de briefing sin archivo devuelve error claro', async (t) => {
  const originalUserFindUnique = prisma.user.findUnique;
  const originalEventFindFirst = prisma.event.findFirst;
  const originalEventFindUnique = prisma.event.findUnique;

  prisma.user.findUnique = async () => ({
    id: 'admin-1',
    email: 'admin@example.com',
    nickname: 'Admin',
    timezone: 'Europe/Madrid',
    mustCreateClanOnboarding: false,
    role: 'ADMIN',
    status: 'ACTIVE',
    clanId: null,
    discordId: null,
    permissionOverrides: [],
  });

  prisma.event.findFirst = async () => ({
    id: 'event-1',
    creator: {
      clanId: 'clan-1',
    },
  });

  prisma.event.findUnique = async () => ({
    id: 'event-1',
    creatorId: 'admin-1',
    status: 'ACTIVE',
    creator: {
      id: 'admin-1',
      clanId: null,
    },
  });

  const http = await startTestServer(app);

  t.after(async () => {
    prisma.user.findUnique = originalUserFindUnique;
    prisma.event.findFirst = originalEventFindFirst;
    prisma.event.findUnique = originalEventFindUnique;
    await http.close();
  });

  const response = await fetch(`${http.baseUrl}/api/events/event-1/briefing-file`, {
    method: 'POST',
    headers: {
      Cookie: `token=${adminToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({}),
  });

  const body = await response.json();

  assert.equal(response.status, 400);
  assert.equal(body.success, false);
  assert.equal(body.message, 'No se proporcionó ningún archivo');
});
