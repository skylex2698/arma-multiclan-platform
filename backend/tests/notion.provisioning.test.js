const test = require('node:test');
const assert = require('node:assert/strict');

const { notionIntegrationService } = require('../dist/services/notionIntegration.service.js');
const { prisma } = require('../dist/index.js');

test.after(async () => {
  await prisma.$disconnect();
});

test('ensureRequiredDatabases reutiliza bases hijas existentes sin duplicarlas', async (t) => {
  const originalCreateClient = notionIntegrationService.createClient;

  let createCalls = 0;
  let relationUpdated = false;
  const dataSourceProperties = {
    'db-missions': {
      Nombre: { type: 'title' },
      'ID Externo': { type: 'rich_text' },
      Fecha: { type: 'date' },
      Estado: { type: 'select' },
    },
    'db-participations': {
      Nombre: { type: 'title' },
      'ID Externo Participación': { type: 'rich_text' },
      'Fecha misión': { type: 'date' },
      'Asistencia válida': { type: 'checkbox' },
      'Rol de Misión': { type: 'rich_text' },
      Escuadra: { type: 'rich_text' },
      Origen: { type: 'select' },
    },
  };

  const fakeClient = {
    blocks: {
      children: {
        list: async () => ({
          results: [
            {
              id: 'db-missions',
              type: 'child_database',
              child_database: { title: 'DB_MISIONES_CCT' },
            },
            {
              id: 'db-participations',
              type: 'child_database',
              child_database: { title: 'DB_PARTICIPACIONES_CCT' },
            },
          ],
          has_more: false,
          next_cursor: null,
        }),
      },
    },
    dataSources: {
      retrieve: async ({ data_source_id }) => ({
        id: data_source_id,
        properties: dataSourceProperties[data_source_id],
      }),
      update: async ({ data_source_id, properties }) => {
        relationUpdated = true;
        if (data_source_id === 'db-missions') {
          dataSourceProperties['db-missions'].Participaciones = {
            type: 'relation',
            relation: {
              data_source_id: 'db-participations',
              dual_property: {
                synced_property_name: 'Misión',
              },
            },
          };
          dataSourceProperties['db-participations'].Misión = {
            type: 'relation',
            relation: {
              data_source_id: 'db-missions',
            },
          };
        }
        return { properties };
      },
    },
    databases: {
      create: async () => {
        createCalls += 1;
        return { id: `created-${createCalls}` };
      },
      retrieve: async ({ database_id }) => ({
        data_sources: [{ id: database_id }],
      }),
    },
  };

  notionIntegrationService.createClient = () => fakeClient;

  t.after(() => {
    notionIntegrationService.createClient = originalCreateClient;
  });

  const result = await notionIntegrationService.ensureRequiredDatabases({
    token: 'secret_test_token',
    parentPageId: 'page-parent-1',
  });

  assert.equal(createCalls, 0);
  assert.equal(relationUpdated, true);
  assert.equal(result.missions.databaseId, 'db-missions');
  assert.equal(result.participations.databaseId, 'db-participations');
  assert.deepEqual(result.createdDatabases, []);
});

test('saveClanIntegration aprovisiona y persiste IDs resueltos cuando hay parentPageId', async (t) => {
  const originalGetClanIntegrationRecord = notionIntegrationService.getClanIntegrationRecord;
  const originalEnsureRequiredDatabases = notionIntegrationService.ensureRequiredDatabases;
  const originalGetClanIntegration = notionIntegrationService.getClanIntegration;
  const originalUpsert = prisma.clanNotionIntegration.upsert;
  const originalAuditCreate = prisma.auditLog.create;

  let upsertPayload = null;

  notionIntegrationService.getClanIntegrationRecord = async () => null;
  notionIntegrationService.ensureRequiredDatabases = async () => ({
    parentPageId: '1234567890abcdef1234567890abcdef',
    missions: {
      title: 'DB_MISIONES_CCT',
      databaseId: 'db-missions',
      dataSourceId: 'ds-missions',
      created: true,
    },
    participations: {
      title: 'DB_PARTICIPACIONES_CCT',
      databaseId: 'db-participations',
      dataSourceId: 'ds-participations',
      created: true,
    },
    createdDatabases: ['DB_MISIONES_CCT', 'DB_PARTICIPACIONES_CCT'],
  });
  notionIntegrationService.getClanIntegration = async () => ({
    enabled: true,
    hasToken: true,
    maskedToken: 'secr****cret',
    parentPageId: '1234567890abcdef1234567890abcdef',
    missionsDatabaseId: 'db-missions',
    participationsDatabaseId: 'db-participations',
    syncMode: 'AUTO',
  });

  prisma.clanNotionIntegration.upsert = async (args) => {
    upsertPayload = args;
    return {
      clanId: args.create.clanId,
      enabled: args.create.enabled,
      syncMode: args.create.syncMode,
    };
  };
  prisma.auditLog.create = async () => ({ id: 'audit-1' });

  t.after(() => {
    notionIntegrationService.getClanIntegrationRecord = originalGetClanIntegrationRecord;
    notionIntegrationService.ensureRequiredDatabases = originalEnsureRequiredDatabases;
    notionIntegrationService.getClanIntegration = originalGetClanIntegration;
    prisma.clanNotionIntegration.upsert = originalUpsert;
    prisma.auditLog.create = originalAuditCreate;
  });

  const result = await notionIntegrationService.saveClanIntegration(
    'clan-1',
    {
      enabled: true,
      token: 'secret_test_token',
      parentPageId: 'https://www.notion.so/Workspace-1234567890abcdef1234567890abcdef',
      syncMode: 'AUTO',
    },
    'user-1'
  );

  assert.equal(upsertPayload.where.clanId, 'clan-1');
  assert.equal(
    upsertPayload.create.parentPageId,
    '1234567890abcdef1234567890abcdef'
  );
  assert.equal(upsertPayload.create.missionsDatabaseId, 'db-missions');
  assert.equal(
    upsertPayload.create.participationsDatabaseId,
    'db-participations'
  );
  assert.equal(result.parentPageId, '1234567890abcdef1234567890abcdef');
});
