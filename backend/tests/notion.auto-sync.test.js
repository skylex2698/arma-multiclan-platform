const test = require('node:test');
const assert = require('node:assert/strict');

const { notionIntegrationService } = require('../dist/services/notionIntegration.service.js');
const { prisma } = require('../dist/index.js');

test.after(async () => {
  await prisma.$disconnect();
});

test('triggerAutoSyncIfEnabled no rompe el flujo si la sincronización falla', async (t) => {
  const originalFindUnique = prisma.event.findUnique;
  const originalGetClanIntegrationRecord = notionIntegrationService.getClanIntegrationRecord;
  const originalSyncEventParticipations = notionIntegrationService.syncEventParticipations;

  let syncAttempts = 0;

  prisma.event.findUnique = async () => ({
    id: 'event-1',
    creator: {
      clanId: 'clan-bear',
    },
  });

  notionIntegrationService.getClanIntegrationRecord = async () => ({
    enabled: true,
    syncMode: 'AUTO',
  });

  notionIntegrationService.syncEventParticipations = async () => {
    syncAttempts += 1;
    throw new Error('notion unavailable');
  };

  t.after(() => {
    prisma.event.findUnique = originalFindUnique;
    notionIntegrationService.getClanIntegrationRecord = originalGetClanIntegrationRecord;
    notionIntegrationService.syncEventParticipations = originalSyncEventParticipations;
  });

  await assert.doesNotReject(() =>
    notionIntegrationService.triggerAutoSyncIfEnabled('event-1')
  );
  assert.equal(syncAttempts, 1);
});
