import { AttendanceStatus, EventStatus, NotionSyncMode } from '@prisma/client';
import { Client } from '@notionhq/client';
import { prisma } from '../index';
import { decrypt, encrypt } from '../utils/encryption';
import { logger } from '../utils/logger';

const NOTION_VERSION = '2025-09-03';
const NOTION_MISSIONS_DATABASE_NAME = 'DB_MISIONES_CCT';
const NOTION_PARTICIPATIONS_DATABASE_NAME = 'DB_PARTICIPACIONES_CCT';
const NOTION_TITLE_PROPERTY = 'Nombre';
const NOTION_EXTERNAL_ID_PROPERTY = 'ID Externo Participación';
const NOTION_DATE_PROPERTY = 'Fecha misión';
const NOTION_VALID_ATTENDANCE_PROPERTY = 'Asistencia válida';
const NOTION_ROLE_PROPERTY = 'Rol de Misión';
const NOTION_SQUAD_PROPERTY = 'Escuadra';
const NOTION_ORIGIN_PROPERTY = 'Origen';
const NOTION_ORIGIN_VALUE = 'CCT_AUTO';
const NOTION_MISSION_EXTERNAL_ID_PROPERTY = 'ID Externo';
const NOTION_MISSION_DATE_PROPERTY = 'Fecha';
const NOTION_MISSION_STATUS_PROPERTY = 'Estado';
const NOTION_MISSION_STATUS_VALUE = 'Finalizada';
const NOTION_MISSION_PARTICIPATIONS_RELATION_PROPERTY = 'Participaciones';
const NOTION_PARTICIPATION_MISSION_RELATION_PROPERTY = 'Misión';
const MAX_NOTION_RETRIES = 3;

type NotionClientLike = Client;
type DatabasePropertyType = 'title' | 'rich_text' | 'date' | 'checkbox' | 'select' | 'relation';

interface ClanNotionIntegrationPayload {
  enabled: boolean;
  token?: string;
  parentPageId?: string | null;
  missionsDatabaseId?: string | null;
  participationsDatabaseId?: string | null;
  syncMode?: NotionSyncMode;
}

interface SyncResultRow {
  snapshotId: string;
  userId: string;
  userNickname: string;
  status: 'created' | 'updated' | 'failed';
  error?: string;
}

interface ExpectedDatabaseDefinition {
  title: string;
  properties: Record<string, { type: DatabasePropertyType; schema: Record<string, unknown> }>;
}

interface ProvisionedDatabase {
  title: string;
  databaseId: string;
  dataSourceId: string;
  created: boolean;
}

interface ProvisionedDatabasesResult {
  parentPageId: string;
  missions: ProvisionedDatabase;
  participations: ProvisionedDatabase;
  createdDatabases: string[];
}

interface RetrievedProperty {
  type?: string;
  relation?: {
    data_source_id?: string;
    dual_property?: {
      synced_property_name?: string;
    };
  };
}

class NotionIntegrationService {
  private trimOrNull(value: string | null | undefined) {
    if (typeof value !== 'string') {
      return null;
    }

    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  private normalizeNotionIdentifier(value: string | null | undefined) {
    const trimmed = this.trimOrNull(value);
    if (!trimmed) {
      return null;
    }

    const match = trimmed.match(
      /([0-9a-f]{32}|[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i
    );

    return match ? match[1] : trimmed;
  }

  private maskToken(token: string | null) {
    if (!token) {
      return null;
    }

    if (token.length <= 8) {
      return '****';
    }

    return `${token.slice(0, 4)}****${token.slice(-4)}`;
  }

  private createClient(token: string) {
    return new Client({
      auth: token,
      notionVersion: NOTION_VERSION,
    });
  }

  private getExpectedMissionDatabase(): ExpectedDatabaseDefinition {
    return {
      title: NOTION_MISSIONS_DATABASE_NAME,
      properties: {
        [NOTION_TITLE_PROPERTY]: {
          type: 'title',
          schema: {
            title: {},
          },
        },
        [NOTION_MISSION_EXTERNAL_ID_PROPERTY]: {
          type: 'rich_text',
          schema: {
            rich_text: {},
          },
        },
        [NOTION_MISSION_DATE_PROPERTY]: {
          type: 'date',
          schema: {
            date: {},
          },
        },
        [NOTION_MISSION_STATUS_PROPERTY]: {
          type: 'select',
          schema: {
            select: {
              options: [
                {
                  name: NOTION_MISSION_STATUS_VALUE,
                  color: 'green',
                },
              ],
            },
          },
        },
        [NOTION_MISSION_PARTICIPATIONS_RELATION_PROPERTY]: {
          type: 'relation',
          schema: {},
        },
      },
    };
  }

  private getExpectedParticipationDatabase(): ExpectedDatabaseDefinition {
    return {
      title: NOTION_PARTICIPATIONS_DATABASE_NAME,
      properties: {
        [NOTION_TITLE_PROPERTY]: {
          type: 'title',
          schema: {
            title: {},
          },
        },
        [NOTION_EXTERNAL_ID_PROPERTY]: {
          type: 'rich_text',
          schema: {
            rich_text: {},
          },
        },
        [NOTION_DATE_PROPERTY]: {
          type: 'date',
          schema: {
            date: {},
          },
        },
        [NOTION_VALID_ATTENDANCE_PROPERTY]: {
          type: 'checkbox',
          schema: {
            checkbox: {},
          },
        },
        [NOTION_ROLE_PROPERTY]: {
          type: 'rich_text',
          schema: {
            rich_text: {},
          },
        },
        [NOTION_SQUAD_PROPERTY]: {
          type: 'rich_text',
          schema: {
            rich_text: {},
          },
        },
        [NOTION_ORIGIN_PROPERTY]: {
          type: 'select',
          schema: {
            select: {
              options: [
                {
                  name: NOTION_ORIGIN_VALUE,
                  color: 'blue',
                },
              ],
            },
          },
        },
        [NOTION_PARTICIPATION_MISSION_RELATION_PROPERTY]: {
          type: 'relation',
          schema: {},
        },
      },
    };
  }

  private getRetryAfterMs(error: unknown) {
    const headers = (error as {
      headers?: Record<string, string> | { get?: (name: string) => string | null };
    })?.headers as Record<string, string> | { get?: (name: string) => string | null } | undefined;

    if (!headers) {
      return null;
    }

    const headerMap = headers as Record<string, string>;
    const retryAfterHeader =
      ('get' in headers && typeof headers.get === 'function'
        ? headers.get('retry-after')
        : headerMap['retry-after'] || headerMap['Retry-After']) ?? null;

    if (!retryAfterHeader) {
      return null;
    }

    const retryAfterSeconds = Number(retryAfterHeader);
    if (Number.isNaN(retryAfterSeconds) || retryAfterSeconds <= 0) {
      return null;
    }

    return retryAfterSeconds * 1000;
  }

  private isRetryableError(error: unknown) {
    const candidate = error as { status?: number; code?: string };
    const status = candidate?.status;
    const code = candidate?.code;

    return (
      status === 429 ||
      status === 500 ||
      status === 502 ||
      status === 503 ||
      status === 504 ||
      code === 'rate_limited' ||
      code === 'bad_gateway' ||
      code === 'service_unavailable' ||
      code === 'gateway_timeout'
    );
  }

  private async sleep(ms: number) {
    await new Promise((resolve) => setTimeout(resolve, ms));
  }

  private async withRetries<T>(operation: () => Promise<T>) {
    let lastError: unknown;

    for (let attempt = 0; attempt < MAX_NOTION_RETRIES; attempt += 1) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;

        if (!this.isRetryableError(error) || attempt === MAX_NOTION_RETRIES - 1) {
          break;
        }

        const retryDelayMs = this.getRetryAfterMs(error) ?? 500 * (attempt + 1);
        await this.sleep(retryDelayMs);
      }
    }

    throw lastError;
  }

  private formatNotionError(error: unknown) {
    const candidate = error as { code?: string; message?: string };
    if (candidate?.code && candidate?.message) {
      return `${candidate.code}: ${candidate.message}`;
    }

    if (candidate?.message) {
      return candidate.message;
    }

    return 'Error desconocido al sincronizar con Notion';
  }

  private toRichText(value: string | null | undefined) {
    const trimmed = this.trimOrNull(value);
    if (!trimmed) {
      return [];
    }

    return [
      {
        type: 'text',
        text: {
          content: trimmed.slice(0, 2000),
        },
      },
    ];
  }

  private toTitle(value: string) {
    return [
      {
        type: 'text',
        text: {
          content: value.slice(0, 2000),
        },
      },
    ];
  }

  private buildParticipationProperties(snapshot: {
    eventName: string;
    userNickname: string;
    eventDate: Date;
    slotRole: string | null;
    squadName: string | null;
    missionPageId?: string | null;
  }) {
    return {
      [NOTION_TITLE_PROPERTY]: {
        title: this.toTitle(`${snapshot.eventName} - ${snapshot.userNickname}`),
      },
      [NOTION_DATE_PROPERTY]: {
        date: {
          start: snapshot.eventDate.toISOString(),
        },
      },
      [NOTION_VALID_ATTENDANCE_PROPERTY]: {
        checkbox: true,
      },
      [NOTION_ROLE_PROPERTY]: {
        rich_text: this.toRichText(snapshot.slotRole),
      },
      [NOTION_SQUAD_PROPERTY]: {
        rich_text: this.toRichText(snapshot.squadName),
      },
      [NOTION_ORIGIN_PROPERTY]: {
        select: {
          name: NOTION_ORIGIN_VALUE,
        },
      },
      [NOTION_PARTICIPATION_MISSION_RELATION_PROPERTY]: {
        relation: snapshot.missionPageId ? [{ id: snapshot.missionPageId }] : [],
      },
    };
  }

  private buildMissionProperties(event: {
    eventName: string;
    eventDate: Date;
  }) {
    return {
      [NOTION_TITLE_PROPERTY]: {
        title: this.toTitle(event.eventName),
      },
      [NOTION_MISSION_DATE_PROPERTY]: {
        date: {
          start: event.eventDate.toISOString(),
        },
      },
      [NOTION_MISSION_STATUS_PROPERTY]: {
        select: {
          name: NOTION_MISSION_STATUS_VALUE,
        },
      },
    };
  }

  private buildExternalParticipationId(snapshot: {
    clanId: string;
    eventId: string;
    userId: string;
  }) {
    return `cct:${snapshot.clanId}:${snapshot.eventId}:${snapshot.userId}`;
  }

  private async validateParentPageAccess(
    client: NotionClientLike,
    parentPageId: string
  ) {
    try {
      await this.withRetries(() =>
        (client as any).blocks.children.list({
          block_id: parentPageId,
          page_size: 1,
        })
      );
    } catch (error) {
      throw new Error(
        `No se puede acceder a la página padre de Notion. Verifica el parentPageId y comparte esa página con la integración. (${this.formatNotionError(error)})`
      );
    }
  }

  private async listChildDatabases(
    client: NotionClientLike,
    parentPageId: string
  ) {
    const databases = new Map<string, { title: string; databaseId: string }>();
    let hasMore = true;
    let nextCursor: string | undefined;

    while (hasMore) {
      const response = (await this.withRetries(() =>
        (client as any).blocks.children.list({
          block_id: parentPageId,
          page_size: 100,
          ...(nextCursor ? { start_cursor: nextCursor } : {}),
        })
      )) as {
        results?: Array<{
          id?: string;
          type?: string;
          child_database?: { title?: string };
        }>;
        has_more?: boolean;
        next_cursor?: string | null;
      };

      for (const block of response.results || []) {
        if (
          block?.type === 'child_database' &&
          typeof block.child_database?.title === 'string' &&
          typeof block.id === 'string'
        ) {
          databases.set(block.child_database.title.trim().toUpperCase(), {
            title: block.child_database.title,
            databaseId: block.id,
          });
        }
      }

      hasMore = Boolean(response.has_more);
      nextCursor = response.next_cursor ?? undefined;
    }

    return databases;
  }

  private async validateDatabaseSchema(
    client: NotionClientLike,
    dataSourceId: string,
    definition: ExpectedDatabaseDefinition,
    options?: { includeRelations?: boolean }
  ) {
    const dataSource = (await this.withRetries(() =>
      (client as any).dataSources.retrieve({
        data_source_id: dataSourceId,
      })
    )) as {
      properties?: Record<string, RetrievedProperty>;
    };

    const properties = dataSource?.properties || {};

    const includeRelations = options?.includeRelations ?? true;

    for (const [propertyName, expected] of Object.entries(definition.properties)) {
      if (!includeRelations && expected.type === 'relation') {
        continue;
      }

      const property = properties[propertyName];

      if (!property) {
        throw new Error(
          `La base ${definition.title} no tiene la propiedad requerida "${propertyName}" en Notion`
        );
      }

      if (property.type !== expected.type) {
        throw new Error(
          `La propiedad "${propertyName}" de ${definition.title} debe ser de tipo ${expected.type} y en Notion es ${property.type || 'desconocido'}`
        );
      }
    }
  }

  private async createDatabase(
    client: NotionClientLike,
    parentPageId: string,
    definition: ExpectedDatabaseDefinition
  ) {
    const database = (await this.withRetries(() =>
      (client as any).databases.create({
        parent: {
          type: 'page_id',
          page_id: parentPageId,
        },
        title: this.toTitle(definition.title),
        initial_data_source: {
          properties: Object.fromEntries(
            Object.entries(definition.properties)
              .filter(([, config]) => config.type !== 'relation')
              .map(([propertyName, config]) => [propertyName, config.schema])
          ),
        },
      })
    )) as { id?: string };

    if (!database?.id) {
      throw new Error(`No se pudo crear la base ${definition.title} en Notion`);
    }

    return database.id;
  }

  private async ensureNamedDatabase(
    client: NotionClientLike,
    parentPageId: string,
    existingDatabases: Map<string, { title: string; databaseId: string }>,
    definition: ExpectedDatabaseDefinition
  ): Promise<ProvisionedDatabase> {
    const existing = existingDatabases.get(definition.title.trim().toUpperCase());
    const databaseId = existing?.databaseId
      ? this.normalizeNotionIdentifier(existing.databaseId)
      : await this.createDatabase(client, parentPageId, definition);

    if (!databaseId) {
      throw new Error(`No se pudo resolver el ID de la base ${definition.title}`);
    }

    const dataSourceId = await this.resolveDataSourceId(client, databaseId, 'database');
    await this.validateDatabaseSchema(client, dataSourceId, definition, {
      includeRelations: false,
    });

    return {
      title: definition.title,
      databaseId,
      dataSourceId,
      created: !existing,
    };
  }

  async ensureRequiredDatabases(input: { token: string; parentPageId: string }) {
    const token = this.trimOrNull(input.token);
    const parentPageId = this.normalizeNotionIdentifier(input.parentPageId);

    if (!token) {
      throw new Error('Debes proporcionar un token de Notion válido');
    }

    if (!parentPageId) {
      throw new Error('Debes proporcionar un parentPageId válido de Notion');
    }

    const client = this.createClient(token);
    await this.validateParentPageAccess(client, parentPageId);

    const childDatabases = await this.listChildDatabases(client, parentPageId);
    const missions = await this.ensureNamedDatabase(
      client,
      parentPageId,
      childDatabases,
      this.getExpectedMissionDatabase()
    );
    const participations = await this.ensureNamedDatabase(
      client,
      parentPageId,
      childDatabases,
      this.getExpectedParticipationDatabase()
    );

    await this.ensureMissionParticipationRelation(
      client,
      missions.dataSourceId,
      participations.dataSourceId
    );
    await this.validateDatabaseSchema(client, missions.dataSourceId, this.getExpectedMissionDatabase());
    await this.validateDatabaseSchema(
      client,
      participations.dataSourceId,
      this.getExpectedParticipationDatabase()
    );

    return {
      parentPageId,
      missions,
      participations,
      createdDatabases: [missions, participations]
        .filter((database) => database.created)
        .map((database) => database.title),
    } satisfies ProvisionedDatabasesResult;
  }

  private async resolveDataSourceId(
    client: NotionClientLike,
    configuredId: string,
    preferredInputType: 'database' | 'data_source' | 'unknown' = 'unknown'
  ) {
    const candidateId = this.normalizeNotionIdentifier(configuredId);

    if (!candidateId) {
      throw new Error('ID de Notion inválido');
    }

    const tryDatabase = async () => {
      const database = (await this.withRetries(() =>
        (client as any).databases.retrieve({
          database_id: candidateId,
        })
      )) as { data_sources?: Array<{ id?: string }> };

      const dataSources = Array.isArray(database?.data_sources) ? database.data_sources : [];

      if (dataSources.length === 1 && dataSources[0]?.id) {
        return dataSources[0].id as string;
      }

      if (dataSources.length === 0) {
        throw new Error(
          'La base de datos de Notion no tiene data sources disponibles para sincronizar.'
        );
      }

      throw new Error(
        'La base de datos de Notion tiene múltiples data sources. Usa un data source ID específico.'
      );
    };

    const tryDataSource = async () => {
      const dataSource = (await this.withRetries(() =>
        (client as any).dataSources.retrieve({
          data_source_id: candidateId,
        })
      )) as { id?: string };

      if (dataSource?.id) {
        return dataSource.id as string;
      }

      throw new Error('El data source de Notion no existe o no es accesible.');
    };

    const attempts =
      preferredInputType === 'database'
        ? [tryDatabase, tryDataSource]
        : preferredInputType === 'data_source'
          ? [tryDataSource, tryDatabase]
          : [tryDatabase, tryDataSource];

    let lastError: unknown = null;

    for (const attempt of attempts) {
      try {
        return await attempt();
      } catch (error) {
        lastError = error;
      }
    }

    throw lastError ?? new Error('No se pudo resolver el data source de Notion.');
  }

  private async getDataSourceProperties(client: NotionClientLike, dataSourceId: string) {
    const dataSource = (await this.withRetries(() =>
      (client as any).dataSources.retrieve({
        data_source_id: dataSourceId,
      })
    )) as {
      properties?: Record<string, RetrievedProperty>;
    };

    return dataSource?.properties || {};
  }

  private hasExpectedRelationProperty(
    properties: Record<string, RetrievedProperty>,
    propertyName: string,
    targetDataSourceId: string,
    syncedPropertyName?: string
  ) {
    const property = properties[propertyName];
    if (!property || property.type !== 'relation') {
      return false;
    }

    const relationTarget = this.normalizeNotionIdentifier(property.relation?.data_source_id);
    if (relationTarget !== this.normalizeNotionIdentifier(targetDataSourceId)) {
      return false;
    }

    if (syncedPropertyName) {
      return property.relation?.dual_property?.synced_property_name === syncedPropertyName;
    }

    return true;
  }

  private async ensureMissionParticipationRelation(
    client: NotionClientLike,
    missionsDataSourceId: string,
    participationsDataSourceId: string
  ) {
    const missionProperties = await this.getDataSourceProperties(client, missionsDataSourceId);
    const participationProperties = await this.getDataSourceProperties(
      client,
      participationsDataSourceId
    );

    const missionRelationOk = this.hasExpectedRelationProperty(
      missionProperties,
      NOTION_MISSION_PARTICIPATIONS_RELATION_PROPERTY,
      participationsDataSourceId,
      NOTION_PARTICIPATION_MISSION_RELATION_PROPERTY
    );
    const participationRelationOk = this.hasExpectedRelationProperty(
      participationProperties,
      NOTION_PARTICIPATION_MISSION_RELATION_PROPERTY,
      missionsDataSourceId
    );

    if (missionRelationOk && participationRelationOk) {
      return;
    }

    await this.withRetries(() =>
      (client as any).dataSources.update({
        data_source_id: missionsDataSourceId,
        properties: {
          [NOTION_MISSION_PARTICIPATIONS_RELATION_PROPERTY]: {
            relation: {
              data_source_id: participationsDataSourceId,
              dual_property: {
                synced_property_name: NOTION_PARTICIPATION_MISSION_RELATION_PROPERTY,
              },
            },
          },
        },
      })
    );
  }

  private async findMissionPage(
    client: NotionClientLike,
    dataSourceId: string,
    externalId: string
  ) {
    const response = (await this.withRetries(() =>
      (client as any).dataSources.query({
        data_source_id: dataSourceId,
        filter: {
          property: NOTION_MISSION_EXTERNAL_ID_PROPERTY,
          rich_text: {
            equals: externalId,
          },
        },
        page_size: 1,
      })
    )) as { results?: Array<{ id: string }> };

    return Array.isArray(response?.results) && response.results.length > 0
      ? (response.results[0] as { id: string })
      : null;
  }

  private async upsertMissionPage(
    client: NotionClientLike,
    dataSourceId: string,
    event: {
      id: string;
      name: string;
      scheduledDate: Date;
    }
  ) {
    const existingPage = await this.findMissionPage(client, dataSourceId, event.id);
    const properties = {
      ...this.buildMissionProperties({
        eventName: event.name,
        eventDate: event.scheduledDate,
      }),
      [NOTION_MISSION_EXTERNAL_ID_PROPERTY]: {
        rich_text: this.toRichText(event.id),
      },
    };

    if (existingPage) {
      await this.withRetries(() =>
        (client as any).pages.update({
          page_id: existingPage.id,
          properties,
        })
      );

      return {
        pageId: existingPage.id,
        status: 'updated' as const,
      };
    }

    const createdPage = (await this.withRetries(() =>
      (client as any).pages.create({
        parent: {
          data_source_id: dataSourceId,
        },
        properties,
      })
    )) as { id?: string };

    if (!createdPage?.id) {
      throw new Error('No se pudo crear la misión en Notion');
    }

    return {
      pageId: createdPage.id,
      status: 'created' as const,
    };
  }

  private async findParticipationPage(
    client: NotionClientLike,
    dataSourceId: string,
    externalId: string
  ) {
    const response = (await this.withRetries(() =>
      (client as any).dataSources.query({
        data_source_id: dataSourceId,
        filter: {
          property: NOTION_EXTERNAL_ID_PROPERTY,
          rich_text: {
            equals: externalId,
          },
        },
        page_size: 1,
      })
    )) as { results?: Array<{ id: string }> };

    return Array.isArray(response?.results) && response.results.length > 0
      ? (response.results[0] as { id: string })
      : null;
  }

  private async getClanIntegrationRecord(clanId: string) {
    const clan = await prisma.clan.findUnique({
      where: { id: clanId },
      select: {
        id: true,
        notionIntegration: true,
      },
    });

    if (!clan) {
      throw new Error('Clan no encontrado');
    }

    return clan.notionIntegration;
  }

  private async provisionClanDatabases(
    clanId: string,
    token: string,
    parentPageId: string
  ) {
    const provisioned = await this.ensureRequiredDatabases({
      token,
      parentPageId,
    });

    await prisma.clanNotionIntegration.update({
      where: { clanId },
      data: {
        parentPageId: provisioned.parentPageId,
        missionsDatabaseId: provisioned.missions.databaseId,
        participationsDatabaseId: provisioned.participations.databaseId,
      },
    });

    return provisioned;
  }

  async getClanIntegration(clanId: string) {
    const integration = await this.getClanIntegrationRecord(clanId);
    const decryptedToken = integration?.notionToken ? decrypt(integration.notionToken) : null;

    return {
      enabled: integration?.enabled ?? false,
      hasToken: Boolean(decryptedToken),
      maskedToken: this.maskToken(decryptedToken),
      parentPageId: integration?.parentPageId ?? null,
      missionsDatabaseId: integration?.missionsDatabaseId ?? null,
      participationsDatabaseId: integration?.participationsDatabaseId ?? null,
      syncMode: integration?.syncMode ?? NotionSyncMode.MANUAL,
    };
  }

  async saveClanIntegration(
    clanId: string,
    payload: ClanNotionIntegrationPayload,
    actorId?: string
  ) {
    const existing = await this.getClanIntegrationRecord(clanId);

    const enabled = Boolean(payload.enabled);
    const normalizedParentPageId =
      this.normalizeNotionIdentifier(payload.parentPageId) ??
      existing?.parentPageId ??
      null;
    let missionsDatabaseId =
      this.normalizeNotionIdentifier(payload.missionsDatabaseId) ??
      existing?.missionsDatabaseId ??
      null;
    let participationsDatabaseId =
      this.normalizeNotionIdentifier(payload.participationsDatabaseId) ??
      existing?.participationsDatabaseId ??
      null;
    const syncMode = payload.syncMode ?? existing?.syncMode ?? NotionSyncMode.MANUAL;
    const incomingToken = this.trimOrNull(payload.token);
    const decryptedExistingToken = existing?.notionToken
      ? decrypt(existing.notionToken)
      : null;
    const plainToken = incomingToken ?? decryptedExistingToken;
    const notionToken = plainToken ? encrypt(plainToken) : null;

    if (enabled) {
      if (!notionToken || !plainToken) {
        throw new Error('Debes proporcionar un token de Notion para activar la integración');
      }

      if (
        !normalizedParentPageId &&
        (!missionsDatabaseId || !participationsDatabaseId)
      ) {
        throw new Error(
          'Debes indicar una página padre de Notion o ambos IDs de bases de datos para activar la integración'
        );
      }
    }

    let createdDatabases: string[] = [];
    const shouldProvision =
      enabled &&
      Boolean(plainToken && normalizedParentPageId) &&
      (
        incomingToken !== null ||
        normalizedParentPageId !== (existing?.parentPageId ?? null) ||
        !missionsDatabaseId ||
        !participationsDatabaseId
      );

    if (shouldProvision && plainToken && normalizedParentPageId) {
      const provisioned = await this.ensureRequiredDatabases({
        token: plainToken,
        parentPageId: normalizedParentPageId,
      });
      missionsDatabaseId = provisioned.missions.databaseId;
      participationsDatabaseId = provisioned.participations.databaseId;
      createdDatabases = provisioned.createdDatabases;
    }

    const integration = await prisma.clanNotionIntegration.upsert({
      where: { clanId },
      create: {
        clanId,
        enabled,
        notionToken,
        parentPageId: normalizedParentPageId,
        missionsDatabaseId,
        participationsDatabaseId,
        syncMode,
      },
      update: {
        enabled,
        notionToken,
        parentPageId: normalizedParentPageId,
        missionsDatabaseId,
        participationsDatabaseId,
        syncMode,
      },
    });

    if (actorId) {
      await prisma.auditLog.create({
        data: {
          action: 'CLAN_NOTION_INTEGRATION_UPDATED',
          entity: 'Clan',
          entityId: clanId,
          userId: actorId,
          details: JSON.stringify({
            enabled: integration.enabled,
            parentPageId: normalizedParentPageId,
            missionsDatabaseId,
            participationsDatabaseId,
            syncMode: integration.syncMode,
            tokenUpdated: incomingToken !== null,
            createdDatabases,
          }),
        },
      });
    }

    return this.getClanIntegration(clanId);
  }

  async testConnection(input: { clanId?: string; token?: string; parentPageId?: string }) {
    const explicitToken = this.trimOrNull(input.token);
    const explicitParentPageId = this.normalizeNotionIdentifier(input.parentPageId);
    let token = explicitToken;
    let parentPageId = explicitParentPageId;

    if ((!token || !parentPageId) && input.clanId) {
      const integration = await this.getClanIntegrationRecord(input.clanId);
      if (!token) {
        token = integration?.notionToken ? decrypt(integration.notionToken) : null;
      }
      if (!parentPageId) {
        parentPageId = integration?.parentPageId ?? null;
      }
    }

    if (!token) {
      throw new Error('Debes proporcionar un token de Notion válido');
    }

    const client = this.createClient(token);
    const me = (await this.withRetries(() => (client as any).users.me({}))) as {
      name?: string;
      id?: string;
      workspace_name?: string;
    };

    if (parentPageId) {
      await this.validateParentPageAccess(client, parentPageId);
    }

    return {
      ok: true,
      botName:
        typeof me?.name === 'string' && me.name.trim().length > 0 ? me.name : 'Integración sin nombre',
      botId: typeof me?.id === 'string' ? me.id : null,
      workspaceName:
        typeof me?.workspace_name === 'string' ? me.workspace_name : null,
      parentPageValidated: Boolean(parentPageId),
    };
  }

  async syncEventParticipations(eventId: string, actorId?: string) {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: {
        id: true,
        name: true,
        scheduledDate: true,
        status: true,
        creator: {
          select: {
            clanId: true,
          },
        },
      },
    });

    if (!event) {
      throw new Error('Evento no encontrado');
    }

    if (event.status !== EventStatus.FINISHED) {
      throw new Error('Solo se puede sincronizar un evento finalizado');
    }

    const clanId = event.creator?.clanId;
    if (!clanId) {
      throw new Error('El evento no está asociado a un clan organizador');
    }

    const integration = await this.getClanIntegrationRecord(clanId);
    if (!integration?.enabled) {
      throw new Error('La integración con Notion no está habilitada para este clan');
    }

    const token = integration.notionToken ? decrypt(integration.notionToken) : null;
    if (!token) {
      throw new Error('No hay un token de Notion configurado para este clan');
    }

    let missionsDatabaseId = this.normalizeNotionIdentifier(integration.missionsDatabaseId);
    let participationsDatabaseId = this.normalizeNotionIdentifier(integration.participationsDatabaseId);

    if ((!missionsDatabaseId || !participationsDatabaseId) && integration.parentPageId) {
      const provisioned = await this.provisionClanDatabases(
        clanId,
        token,
        integration.parentPageId
      );
      missionsDatabaseId = provisioned.missions.databaseId;
      participationsDatabaseId = provisioned.participations.databaseId;
    }

    if (!missionsDatabaseId || !participationsDatabaseId) {
      throw new Error(
        'Falta configurar las bases de datos de Notion o una página padre válida para este clan'
      );
    }

    const snapshots = await prisma.participationSnapshot.findMany({
      where: {
        clanId,
        eventId,
        attendanceStatus: AttendanceStatus.PRESENT,
      },
      orderBy: [{ eventDate: 'asc' }, { userNickname: 'asc' }],
    });

    const client = this.createClient(token);
    const missionsDataSourceId = await this.resolveDataSourceId(
      client,
      missionsDatabaseId,
      'database'
    );
    const participationsDataSourceId = await this.resolveDataSourceId(
      client,
      participationsDatabaseId,
      'database'
    );
    await this.ensureMissionParticipationRelation(
      client,
      missionsDataSourceId,
      participationsDataSourceId
    );
    const missionPage = await this.upsertMissionPage(client, missionsDataSourceId, {
      id: event.id,
      name: event.name,
      scheduledDate: event.scheduledDate,
    });
    const summary = {
      total: snapshots.length,
      created: 0,
      updated: 0,
      failed: 0,
      results: [] as SyncResultRow[],
      mission: missionPage,
    };

    for (const snapshot of snapshots) {
      const externalId = this.buildExternalParticipationId(snapshot);

      try {
        const existingPage = await this.findParticipationPage(
          client,
          participationsDataSourceId,
          externalId
        );
        const properties = {
          ...this.buildParticipationProperties({
            ...snapshot,
            missionPageId: missionPage.pageId,
          }),
          [NOTION_EXTERNAL_ID_PROPERTY]: {
            rich_text: this.toRichText(externalId),
          },
        };

        if (existingPage) {
          await this.withRetries(() =>
            (client as any).pages.update({
              page_id: existingPage.id,
              properties,
            })
          );
          summary.updated += 1;
          summary.results.push({
            snapshotId: snapshot.id,
            userId: snapshot.userId,
            userNickname: snapshot.userNickname,
            status: 'updated',
          });
        } else {
          await this.withRetries(() =>
            (client as any).pages.create({
              parent: {
                data_source_id: participationsDataSourceId,
              },
              properties,
            })
          );
          summary.created += 1;
          summary.results.push({
            snapshotId: snapshot.id,
            userId: snapshot.userId,
            userNickname: snapshot.userNickname,
            status: 'created',
          });
        }

        await prisma.participationSnapshot.update({
          where: { id: snapshot.id },
          data: {
            exportedToNotion: true,
            exportedToNotionAt: new Date(),
            notionLastSyncAt: new Date(),
            notionLastError: null,
          },
        });
      } catch (error) {
        const formattedError = this.formatNotionError(error);
        summary.failed += 1;
        summary.results.push({
          snapshotId: snapshot.id,
          userId: snapshot.userId,
          userNickname: snapshot.userNickname,
          status: 'failed',
          error: formattedError,
        });

        logger.error('Notion participation sync failed', {
          eventId,
          clanId,
          snapshotId: snapshot.id,
          userId: snapshot.userId,
          error: formattedError,
        });

        await prisma.participationSnapshot.update({
          where: { id: snapshot.id },
          data: {
            notionLastSyncAt: new Date(),
            notionLastError: formattedError,
          },
        });
      }
    }

    if (actorId) {
      await prisma.auditLog.create({
        data: {
          action: 'EVENT_NOTION_SYNC_EXECUTED',
          entity: 'Event',
          entityId: eventId,
          userId: actorId,
          eventId,
          details: JSON.stringify({
            clanId,
            total: summary.total,
            created: summary.created,
            updated: summary.updated,
            failed: summary.failed,
          }),
        },
      });
    }

    return summary;
  }

  async triggerAutoSyncIfEnabled(eventId: string) {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: {
        id: true,
        creator: {
          select: {
            clanId: true,
          },
        },
      },
    });

    const clanId = event?.creator?.clanId;
    if (!event || !clanId) {
      return;
    }

    const integration = await this.getClanIntegrationRecord(clanId);
    if (!integration?.enabled || integration.syncMode !== NotionSyncMode.AUTO) {
      return;
    }

    try {
      await this.syncEventParticipations(eventId);
    } catch (error) {
      logger.error('Automatic Notion sync failed', {
        eventId,
        clanId,
        error: this.formatNotionError(error),
      });
    }
  }
}

export const notionIntegrationService = new NotionIntegrationService();
