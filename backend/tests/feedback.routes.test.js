const test = require('node:test');
const assert = require('node:assert/strict');

const { app, prisma } = require('../dist/index.js');
const { generateToken } = require('../dist/utils/jwt.js');
const { startTestServer } = require('./helpers/http.js');

const buildAuthCookie = (userId, role = 'USER') =>
  `token=${generateToken({ userId, role })}`;

test.after(async () => {
  await prisma.$disconnect();
});

test('crear feedback autenticado devuelve 201 y usa el usuario de sesion', async (t) => {
  const originalUserFindUnique = prisma.user.findUnique;
  const originalFeedbackCreate = prisma.feedbackItem.create;

  let createdData = null;

  prisma.user.findUnique = async ({ where }) => ({
    id: where.id,
    email: 'operador@example.com',
    nickname: 'Operador',
    timezone: 'Europe/Madrid',
    mustCreateClanOnboarding: false,
    role: 'USER',
    status: 'ACTIVE',
    clanId: 'clan-1',
    discordId: null,
    permissionOverrides: [],
  });

  prisma.feedbackItem.create = async ({ data }) => {
    createdData = data;
    return {
      id: 'feedback-1',
      ...data,
      status: 'OPEN',
      adminNote: null,
      reviewedAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      user: {
        id: data.userId,
        nickname: 'Operador',
        email: 'operador@example.com',
      },
      clan: {
        id: 'clan-1',
        name: 'Clan Uno',
        tag: 'C1',
      },
    };
  };

  const http = await startTestServer(app);

  t.after(async () => {
    prisma.user.findUnique = originalUserFindUnique;
    prisma.feedbackItem.create = originalFeedbackCreate;
    await http.close();
  });

  const response = await fetch(`${http.baseUrl}/api/feedback`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: buildAuthCookie('user-1'),
    },
    body: JSON.stringify({
      type: 'BUG',
      title: 'El formulario falla',
      description: 'No guarda correctamente.',
      pagePath: '/events/create',
    }),
  });

  const body = await response.json();

  assert.equal(response.status, 201);
  assert.equal(createdData.userId, 'user-1');
  assert.equal(createdData.clanId, 'clan-1');
  assert.equal(createdData.pagePath, '/events/create');
  assert.equal(body.data.item.type, 'BUG');
});

test('crear feedback sin autenticacion devuelve 401', async (t) => {
  const http = await startTestServer(app);

  t.after(async () => {
    await http.close();
  });

  const response = await fetch(`${http.baseUrl}/api/feedback`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      type: 'BUG',
      title: 'Fallo',
      description: 'Sin login',
    }),
  });

  assert.equal(response.status, 401);
});

test('listar feedback como no admin devuelve 403', async (t) => {
  const originalUserFindUnique = prisma.user.findUnique;

  prisma.user.findUnique = async ({ where }) => ({
    id: where.id,
    email: 'user@example.com',
    nickname: 'User',
    timezone: 'Europe/Madrid',
    mustCreateClanOnboarding: false,
    role: 'USER',
    status: 'ACTIVE',
    clanId: null,
    discordId: null,
    permissionOverrides: [],
  });

  const http = await startTestServer(app);

  t.after(async () => {
    prisma.user.findUnique = originalUserFindUnique;
    await http.close();
  });

  const response = await fetch(`${http.baseUrl}/api/feedback`, {
    headers: {
      Cookie: buildAuthCookie('user-2'),
    },
  });

  assert.equal(response.status, 403);
});

test('listar feedback como admin aplica filtros y revisar persiste estado', async (t) => {
  const originalUserFindUnique = prisma.user.findUnique;
  const originalFeedbackFindMany = prisma.feedbackItem.findMany;
  const originalFeedbackFindUnique = prisma.feedbackItem.findUnique;
  const originalFeedbackUpdate = prisma.feedbackItem.update;

  let receivedWhere = null;
  let receivedUpdateData = null;

  prisma.user.findUnique = async ({ where }) => ({
    id: where.id,
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

  prisma.feedbackItem.findMany = async ({ where }) => {
    receivedWhere = where;
    return [
      {
        id: 'feedback-1',
        type: 'BUG',
        status: 'OPEN',
        title: 'Algo roto',
        description: 'Detalles',
        pagePath: '/dashboard',
        adminNote: null,
        reviewedAt: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        user: {
          id: 'user-1',
          nickname: 'Operador',
          email: 'operador@example.com',
        },
        clan: null,
        reviewer: null,
      },
    ];
  };

  prisma.feedbackItem.findUnique = async () => ({ id: 'feedback-1' });
  prisma.feedbackItem.update = async ({ data }) => {
    receivedUpdateData = data;
    return {
      id: 'feedback-1',
      type: 'BUG',
      title: 'Algo roto',
      description: 'Detalles',
      pagePath: '/dashboard',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      user: {
        id: 'user-1',
        nickname: 'Operador',
        email: 'operador@example.com',
      },
      clan: null,
      reviewer: {
        id: 'admin-1',
        nickname: 'Admin',
      },
      ...data,
    };
  };

  const http = await startTestServer(app);

  t.after(async () => {
    prisma.user.findUnique = originalUserFindUnique;
    prisma.feedbackItem.findMany = originalFeedbackFindMany;
    prisma.feedbackItem.findUnique = originalFeedbackFindUnique;
    prisma.feedbackItem.update = originalFeedbackUpdate;
    await http.close();
  });

  const listResponse = await fetch(
    `${http.baseUrl}/api/feedback?type=BUG&status=OPEN`,
    {
      headers: {
        Cookie: buildAuthCookie('admin-1', 'ADMIN'),
      },
    }
  );

  const listBody = await listResponse.json();

  assert.equal(listResponse.status, 200);
  assert.deepEqual(receivedWhere, { type: 'BUG', status: 'OPEN' });
  assert.equal(listBody.data.count, 1);

  const reviewResponse = await fetch(
    `${http.baseUrl}/api/feedback/feedback-1/status`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Cookie: buildAuthCookie('admin-1', 'ADMIN'),
      },
      body: JSON.stringify({
        status: 'DONE',
        adminNote: 'Corregido en revisión.',
      }),
    }
  );

  const reviewBody = await reviewResponse.json();

  assert.equal(reviewResponse.status, 200);
  assert.equal(receivedUpdateData.status, 'DONE');
  assert.equal(receivedUpdateData.adminNote, 'Corregido en revisión.');
  assert.equal(receivedUpdateData.reviewedBy, 'admin-1');
  assert.ok(receivedUpdateData.reviewedAt);
  assert.equal(reviewBody.data.item.status, 'DONE');
});
