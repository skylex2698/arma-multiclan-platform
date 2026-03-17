const test = require('node:test');
const assert = require('node:assert/strict');

const { app, prisma } = require('../dist/index.js');
const { authService } = require('../dist/services/auth.service.js');
const { startTestServer } = require('./helpers/http.js');

test.after(async () => {
  await prisma.$disconnect();
});

test('registro normaliza el email y crea solicitud de nuevo clan', async (t) => {
  const originalRegisterLocal = authService.registerLocal;

  const calls = [];
  authService.registerLocal = async (payload) => {
    calls.push(payload);
    return {
      id: 'user-1',
      email: payload.email,
      nickname: payload.nickname,
      timezone: 'Europe/Madrid',
      mustCreateClanOnboarding: false,
      role: 'USER',
      status: 'PENDING',
      clanId: null,
    };
  };

  const http = await startTestServer(app);

  t.after(async () => {
    authService.registerLocal = originalRegisterLocal;
    await http.close();
  });

  const response = await fetch(`${http.baseUrl}/api/auth/register/local`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: '  NuevoClan@Example.COM ',
      password: 'Password123',
      nickname: 'Operador',
      requestNewClan: true,
      newClanName: 'Task Force Atlas',
      newClanTag: 'TFA',
      newClanDescription: 'Clan de pruebas',
      newClanPrimaryGameId: 'game-1',
    }),
  });

  const body = await response.json();

  assert.equal(response.status, 201);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].email, 'nuevoclan@example.com');
  assert.deepEqual(calls[0].clanCreationRequest, {
    requestedName: 'Task Force Atlas',
    requestedTag: 'TFA',
    requestedDescription: 'Clan de pruebas',
    primaryGameId: 'game-1',
  });
  assert.match(body.message, /aprobar la creación del nuevo clan/i);
});

test('registro con clan existente exige clanId cuando no se solicita nuevo clan', async (t) => {
  const http = await startTestServer(app);

  t.after(async () => {
    await http.close();
  });

  const response = await fetch(`${http.baseUrl}/api/auth/register/local`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'usuario@example.com',
      password: 'Password123',
      nickname: 'Operador',
      requestNewClan: false,
    }),
  });

  const body = await response.json();

  assert.equal(response.status, 400);
  assert.equal(body.message, 'Debes seleccionar un clan o solicitar uno nuevo');
});
