// backend/src/services/event.service.ts - VERSIÓN COMPLETA ACTUALIZADA

import { prisma } from '../index';
import { logger } from '../utils/logger';
import { sanitizeHTML } from '../utils/sanitizer';
import {
  EventStatus,
  EventVisibility,
  GameIdentityMode,
  GameIdentityStatus,
  SlotStatus,
  UserRole,
} from '@prisma/client';

export class EventService {
  private buildDeletedAtFilter(includeDeleted = false) {
    return includeDeleted ? { not: null } : null;
  }

  private assertScheduledDateNotInPast(scheduledDate: Date) {
    if (scheduledDate.getTime() < Date.now()) {
      throw new Error('No se puede programar un evento en una fecha pasada');
    }
  }

  private validateSquadStructure(
    squads: Array<{
      id?: string;
      name: string;
      isCommand?: boolean;
      parentSquadId?: string;
      reservedForClanId?: string | null;
      slots: Array<{ role: string; order: number }>;
    }>
  ) {
    if (squads.length === 0) {
      throw new Error('Debes crear al menos una escuadra');
    }

    const commandSquads = squads.filter((squad) => squad.isCommand);
    if (commandSquads.length > 1) {
      throw new Error('Solo puede existir una escuadra marcada como mando de misión');
    }

    for (const squad of squads) {
      if (!squad.name.trim()) {
        throw new Error('Todas las escuadras deben tener un nombre');
      }

      if (!squad.slots.length) {
        throw new Error(`La escuadra "${squad.name}" debe tener al menos un slot`);
      }

      if (squad.isCommand && squad.parentSquadId) {
        throw new Error(`La escuadra "${squad.name}" no puede ser mando y tener enlace externo`);
      }
    }
  }

  private async validateClanIds(clanIds: string[]) {
    if (!clanIds.length) {
      return;
    }

    const uniqueClanIds = Array.from(new Set(clanIds));
    const clans = await prisma.clan.findMany({
      where: {
        id: { in: uniqueClanIds },
      },
      select: { id: true },
    });

    if (clans.length !== uniqueClanIds.length) {
      throw new Error('Hay clanes seleccionados que no existen');
    }
  }

  private validateReservedSquadClans(
    visibility: EventVisibility,
    invitedClanIds: string[],
    creatorClanId: string | null | undefined,
    squads: Array<{ name: string; reservedForClanId?: string | null }>
  ) {
    if (visibility !== EventVisibility.PRIVATE) {
      const reservedSquad = squads.find((squad) => Boolean(squad.reservedForClanId));
      if (reservedSquad) {
        throw new Error(
          `La escuadra "${reservedSquad.name}" no puede reservarse para un clan en eventos públicos`
        );
      }
      return;
    }

    const allowedClanIds = new Set(invitedClanIds);
    if (creatorClanId) {
      allowedClanIds.add(creatorClanId);
    }
    const invalidReservedSquad = squads.find(
      (squad) => squad.reservedForClanId && !allowedClanIds.has(squad.reservedForClanId)
    );

    if (invalidReservedSquad) {
      throw new Error(
        `La escuadra "${invalidReservedSquad.name}" solo puede reservarse para un clan invitado o para el clan organizador`
      );
    }
  }

  private isClanAllowedInPrivateEvent(event: {
    creator: { clanId: string | null } | null;
    invitedClans?: Array<{ clanId: string }>;
  }, clanId: string | null) {
    if (!clanId) {
      return false;
    }

    if (event.creator?.clanId === clanId) {
      return true;
    }

    return (event.invitedClans || []).some((invitation) => invitation.clanId === clanId);
  }

  // ============================================
  // MÉTODOS DE VERIFICACIÓN DE ESTADO
  // ============================================

  /**
   * Verifica y marca como FINISHED los eventos ACTIVE que ya pasaron su fecha
   * Este método debe llamarse periódicamente (cron) o al listar/obtener eventos
   */
  async checkAndFinishExpiredEvents(): Promise<number> {
    const now = new Date();

    // Actualizar eventos ACTIVE cuya fecha ya pasó
    const result = await prisma.event.updateMany({
      where: {
        status: EventStatus.ACTIVE,
        scheduledDate: { lt: now }
      },
      data: {
        status: EventStatus.FINISHED
      }
    });

    if (result.count > 0) {
      logger.info('Events auto-finished', { count: result.count });
    }

    return result.count;
  }

  /**
   * Verifica si un evento está finalizado (no permite modificaciones)
   */
  isEventFinished(event: { status: EventStatus }): boolean {
    return event.status === EventStatus.FINISHED;
  }

  /**
   * Verifica si un evento permite apuntarse/desapuntarse de slots
   */
  canModifySlots(event: { status: EventStatus }): boolean {
    return event.status === EventStatus.ACTIVE;
  }

  private buildVisibilityFilter(
    requesterRole?: UserRole,
    requesterClanId?: string | null
  ) {
    if (requesterRole === UserRole.ADMIN) {
      return undefined;
    }

    if (!requesterClanId) {
      return { visibility: EventVisibility.PUBLIC };
    }

    return {
      OR: [
        { visibility: EventVisibility.PUBLIC },
        { creator: { clanId: requesterClanId } },
        {
          invitedClans: {
            some: {
              clanId: requesterClanId,
            },
          },
        },
        {
          squads: {
            some: {
              reservedForClanId: requesterClanId,
            },
          },
        },
      ],
    };
  }

  // ============================================
  // MÉTODOS DE LISTADO
  // ============================================

  // Listar eventos con filtros y paginación
  async getAllEvents(filters?: {
    status?: EventStatus;
    gameId?: string;
    upcoming?: boolean;
    includeAll?: boolean; // Si true, muestra todos los estados
    deleted?: boolean; // Si true, muestra solo eventos soft-deleted (admin)
    search?: string;
    page?: number;
    limit?: number;
    requesterRole?: UserRole;
    requesterClanId?: string | null;
    }) {
    // Primero verificar y finalizar eventos expirados
    await this.checkAndFinishExpiredEvents();
    const includeDeletedChildren = Boolean(filters?.deleted);

    const now = new Date();
    const page = filters?.page || 1;
    const limit = filters?.limit || 12;
    const skip = (page - 1) * limit;

    // Por defecto: solo eventos ACTIVE, ordenados por fecha más próxima
    const whereClause: Record<string, unknown> = {};

    // Si se pide ver eventos eliminados (admin), usar escape hatch del middleware
    if (filters?.deleted) {
      whereClause.deletedAt = { not: null };
      // No aplicar filtros de status ni auto-finish en modo deleted
    } else if (filters?.includeAll) {
      // Mostrar todos los eventos
      if (filters?.status) {
        whereClause.status = filters.status;
      }
    } else if (filters?.status) {
      // Filtro específico de estado
      whereClause.status = filters.status;
    } else {
      // Por defecto: solo ACTIVE
      whereClause.status = EventStatus.ACTIVE;
    }

    if (filters?.gameId) {
      whereClause.gameId = filters.gameId;
    }

    if (filters?.upcoming) {
      whereClause.scheduledDate = { gte: now };
      whereClause.status = EventStatus.ACTIVE;
    }

    // Búsqueda por nombre
    if (filters?.search) {
      whereClause.name = { contains: filters.search, mode: 'insensitive' };
    }

    const visibilityFilter = this.buildVisibilityFilter(
      filters?.requesterRole,
      filters?.requesterClanId
    );

    if (visibilityFilter) {
      Object.assign(whereClause, visibilityFilter);
    }

    // Obtener total y eventos en paralelo
    const [total, events] = await Promise.all([
      prisma.event.count({ where: whereClause }),
      prisma.event.findMany({
        where: whereClause,
        include: {
          game: true,
          creator: {
            select: {
              id: true,
              nickname: true,
              clanId: true,
              clan: {
                select: {
                  id: true,
                  name: true,
                  tag: true
                }
              }
            }
          },
          squads: {
            where: {
              deletedAt: this.buildDeletedAtFilter(includeDeletedChildren),
            },
            include: {
              reservedForClan: {
                select: {
                  id: true,
                  name: true,
                  tag: true,
                  avatarUrl: true,
                },
              },
              slots: {
                where: {
                  deletedAt: this.buildDeletedAtFilter(includeDeletedChildren),
                },
                include: {
                  user: {
                    select: {
                      id: true,
                      nickname: true,
                      clan: {
                        select: {
                          name: true,
                          tag: true
                        }
                      }
                    }
                  }
                },
                orderBy: { order: 'asc' }
              }
            },
            orderBy: { order: 'asc' }
          },
          _count: {
            select: {
              squads: true
            }
          },
          invitedClans: {
            select: {
              clan: {
                select: {
                  id: true,
                  name: true,
                  tag: true,
                },
              },
            },
          },
        },
        // Ordenar por fecha más próxima primero
        orderBy: { scheduledDate: 'asc' },
        skip,
        take: limit,
      }),
    ]);

    const eventsWithCounts = events.map(event => ({
      ...event,
      totalSlots: event.squads.reduce((acc, squad) => acc + squad.slots.length, 0),
      occupiedSlots: event.squads.reduce(
        (acc, squad) => acc + squad.slots.filter(s => s.status === SlotStatus.OCCUPIED).length,
        0
      )
    }));

    return {
      events: eventsWithCounts,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // Obtener evento por ID
  async getEventById(
    id: string,
    options?: {
      deleted?: boolean;
      requesterRole?: UserRole;
      requesterClanId?: string | null;
    }
  ) {
    const includeDeletedChildren = Boolean(options?.deleted);
    const visibilityFilter = this.buildVisibilityFilter(
      options?.requesterRole,
      options?.requesterClanId
    );

    const event = await prisma.event.findFirst({
      where: {
        id,
        ...(options?.deleted ? { deletedAt: { not: null } } : {}),
        ...(visibilityFilter || {}),
      },
      include: {
        game: true,
        creator: {
          select: {
            id: true,
            nickname: true,
            email: true,
            role: true,
            status: true,
            clanId: true,
            avatarUrl: true,
            clan: {
              select: {
                id: true,
                name: true,
                tag: true,
                avatarUrl: true,
              },
            },
          },
        },
        squads: {
          where: {
            deletedAt: this.buildDeletedAtFilter(includeDeletedChildren),
          },
          include: {
            parentSquad: {
              select: {
                id: true,
                name: true,
              },
            },
            reservedForClan: {
              select: {
                id: true,
                name: true,
                tag: true,
                avatarUrl: true,
              },
            },
            slots: {
              where: {
                deletedAt: this.buildDeletedAtFilter(includeDeletedChildren),
              },
              include: {
                user: {
                  select: {
                    id: true,
                    nickname: true,
                    email: true,
                    role: true,
                    status: true,
                    clanId: true,
                    avatarUrl: true,
                    clan: {
                      select: {
                        id: true,
                        name: true,
                        tag: true,
                        avatarUrl: true,
                      },
                    },
                  },
                },
              },
              orderBy: {
                order: 'asc',
              },
            },
          },
          orderBy: {
            order: 'asc',
          },
        },
        invitedClans: {
          select: {
            clan: {
              select: {
                id: true,
                name: true,
                tag: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });

    if (!event) {
      throw new Error('Evento no encontrado');
    }

    // Calcular slots ocupados
    const totalSlots = event.squads.reduce((acc, squad) => acc + squad.slots.length, 0);
    const occupiedSlots = event.squads.reduce(
      (acc, squad) => acc + squad.slots.filter((slot) => slot.userId !== null).length,
      0
    );

    return {
      ...event,
      totalSlots,
      occupiedSlots,
    };
  }

  // Crear evento desde cero
  async createEvent(data: {
    name: string;
    description?: string;
    briefing?: string;
    gameId: string;
    scheduledDate: Date;
    timezone?: string;
    creatorId: string;
    visibility?: EventVisibility;
    invitedClanIds?: string[];
    serverName?: string;
    serverIp?: string;
    serverPort?: string;
    serverPassword?: string;
    squads: Array<{
      id?: string; // ID temporal del frontend para mapeo de jerarquía
      name: string;
      order: number;
      frequency?: string;
      isCommand?: boolean;
      parentSquadId?: string;
      parentFrequency?: string;
      reservedForClanId?: string | null;
      slots: Array<{
        role: string;
        order: number;
      }>;
    }>;
  }) {
    this.assertScheduledDateNotInPast(data.scheduledDate);
    this.validateSquadStructure(data.squads);

    const creator = await prisma.user.findUnique({
      where: { id: data.creatorId },
      select: {
        role: true,
        clanId: true,
      },
    });

    if (!creator) {
      throw new Error('Usuario creador no encontrado');
    }

    const visibility = data.visibility || EventVisibility.PRIVATE;
    const invitedClanIds = Array.from(new Set(data.invitedClanIds || []));
    const reservedClanIds = data.squads
      .map((squad) => squad.reservedForClanId)
      .filter((clanId): clanId is string => Boolean(clanId));

    this.validateReservedSquadClans(visibility, invitedClanIds, creator.clanId, data.squads);
    await this.validateClanIds([...invitedClanIds, ...reservedClanIds]);

    // Guardar referencias de jerarquía para procesarlas después
    // El frontend envía IDs temporales (ej: "1672531200000") que no existen en la BD
    const squadHierarchy = data.squads.map(squad => ({
      tempId: squad.id,
      parentTempId: squad.parentSquadId,
      parentFrequency: squad.parentFrequency
    }));

    const finalEvent = await prisma.$transaction(async (tx) => {
      // Paso 1: Crear evento con squads SIN parentSquadId
      // Esto evita errores de foreign key cuando los padres aún no existen
      const event = await tx.event.create({
        data: {
          name: data.name,
          description: data.description,
          // SEGURIDAD: Sanitizar HTML del briefing para prevenir XSS
          briefing: data.briefing ? sanitizeHTML(data.briefing) : undefined,
          gameId: data.gameId,
          scheduledDate: data.scheduledDate,
          timezone: data.timezone || 'UTC',
          creatorId: data.creatorId,
          status: EventStatus.ACTIVE,
          visibility,
          serverName: data.serverName || null,
          serverIp: data.serverIp || null,
          serverPort: data.serverPort || null,
          serverPassword: data.serverPassword || null,
          invitedClans: invitedClanIds.length > 0
            ? {
                create: invitedClanIds.map((clanId) => ({
                  clanId,
                  invitedBy: data.creatorId,
                })),
              }
            : undefined,
          squads: {
            create: data.squads.map(squad => ({
              name: squad.name,
              order: squad.order,
              // ========== CAMPOS DE COMUNICACIÓN ==========
              frequency: squad.frequency || null,
              isCommand: squad.isCommand || false,
              // NO asignamos parentSquadId aquí - lo hacemos después
              parentSquadId: null,
              parentFrequency: null,
              reservedForClanId: squad.reservedForClanId || null,
              // ============================================
              slots: {
                create: squad.slots.map(slot => ({
                  role: slot.role,
                  order: slot.order,
                  status: SlotStatus.FREE
                }))
              }
            }))
          }
        },
        include: {
          creator: {
            select: {
              nickname: true
            }
          },
          game: true,
          squads: {
            where: {
              deletedAt: null,
            },
            include: {
              reservedForClan: {
                select: {
                  id: true,
                  name: true,
                  tag: true,
                  avatarUrl: true,
                },
              },
              slots: {
                where: {
                  deletedAt: null,
                },
              }
            },
            orderBy: { order: 'asc' }
          },
          invitedClans: {
            select: {
              clan: {
                select: {
                  id: true,
                  name: true,
                  tag: true,
                  avatarUrl: true,
                },
              },
            },
          },
        }
      });

      // Paso 2: Crear mapeo de IDs temporales a IDs reales
      // Los squads se crean en el mismo orden que se envían
      const tempIdToRealId = new Map<string, string>();
      event.squads.forEach((squad, index) => {
        const tempId = squadHierarchy[index]?.tempId;
        if (tempId) {
          tempIdToRealId.set(tempId, squad.id);
        }
      });

      // Paso 3: Actualizar squads que tienen jerarquía
      const updatePromises: Promise<unknown>[] = [];
      event.squads.forEach((squad, index) => {
        const hierarchy = squadHierarchy[index];
        if (hierarchy?.parentTempId) {
          const realParentId = tempIdToRealId.get(hierarchy.parentTempId);
          if (realParentId) {
            updatePromises.push(
              tx.squad.update({
                where: { id: squad.id },
                data: {
                  parentSquadId: realParentId,
                  parentFrequency: hierarchy.parentFrequency || null
                }
              })
            );
          }
        }
      });

      if (updatePromises.length > 0) {
        await Promise.all(updatePromises);
      }

      // Paso 4: Recargar el evento con los datos actualizados de jerarquía
      const reloaded = await tx.event.findUnique({
        where: { id: event.id },
        include: {
          creator: {
            select: {
              nickname: true
            }
          },
          game: true,
          squads: {
            where: {
              deletedAt: null,
            },
            include: {
              reservedForClan: {
                select: {
                  id: true,
                  name: true,
                  tag: true,
                  avatarUrl: true,
                },
              },
              slots: {
                where: {
                  deletedAt: null,
                },
              }
            },
            orderBy: { order: 'asc' }
          },
          invitedClans: {
            select: {
              clan: {
                select: {
                  id: true,
                  name: true,
                  tag: true,
                  avatarUrl: true,
                },
              },
            },
          },
        }
      });

      // Paso 5: Audit log
      await tx.auditLog.create({
        data: {
          action: 'EVENT_CREATED',
          entity: 'Event',
          entityId: event.id,
          userId: data.creatorId,
          eventId: event.id,
          details: JSON.stringify({
            name: event.name,
            gameId: event.gameId,
            squadCount: event.squads.length,
            totalSlots: event.squads.reduce((acc, s) => acc + s.slots.length, 0)
          })
        }
      });

      return reloaded!;
    });

    logger.info('Event created', { eventId: finalEvent.id, creatorId: data.creatorId });

    return finalEvent;
  }

  // Crear evento desde plantilla
  async createEventFromTemplate(data: {
    templateEventId: string;
    name: string;
    description?: string;
    briefing?: string;
    scheduledDate: Date;
    timezone?: string;
    creatorId: string;
  }) {
    this.assertScheduledDateNotInPast(data.scheduledDate);

    // Obtener el evento plantilla
    const templateEvent = await prisma.event.findUnique({
      where: { id: data.templateEventId },
      include: {
        squads: {
          where: {
            deletedAt: null,
          },
          include: {
            slots: {
              where: {
                deletedAt: null,
              },
              orderBy: { order: 'asc' },
            },
          },
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!templateEvent) {
      throw new Error('Evento plantilla no encontrado');
    }

    // Crear nuevo evento copiando la estructura
    const newEvent = await prisma.event.create({
      data: {
        name: data.name,
        description: data.description,
        // SEGURIDAD: Sanitizar HTML del briefing para prevenir XSS
        briefing: data.briefing ? sanitizeHTML(data.briefing) : undefined,
        gameId: templateEvent.gameId,
        scheduledDate: data.scheduledDate,
        timezone: data.timezone || templateEvent.timezone,
        creatorId: data.creatorId,
        status: 'ACTIVE',
        squads: {
          create: templateEvent.squads.map((squad) => ({
            name: squad.name,
            order: squad.order,
            // ========== COPIAR CAMPOS DE COMUNICACIÓN ==========
            frequency: squad.frequency,
            isCommand: squad.isCommand,
            parentSquadId: null, // No copiar relaciones entre escuadras
            parentFrequency: squad.parentFrequency,
            // ===================================================
            slots: {
              create: squad.slots.map((slot) => ({
                role: slot.role,
                order: slot.order,
                status: 'FREE',
              })),
            },
          })),
        },
      },
      include: {
        creator: {
          select: {
            id: true,
            nickname: true,
            clan: {
              select: {
                name: true,
                tag: true,
              },
            },
          },
        },
        game: true,
        squads: {
          where: {
            deletedAt: null,
          },
          include: {
            slots: {
              where: {
                deletedAt: null,
              },
              orderBy: { order: 'asc' },
            },
          },
          orderBy: { order: 'asc' },
        },
      },
    });

    // Calcular slots
    const totalSlots = newEvent.squads.reduce(
      (acc, squad) => acc + squad.slots.length,
      0
    );

    logger.info('Event created from template', {
      eventId: newEvent.id,
      templateId: data.templateEventId,
      creatorId: data.creatorId,
    });

    return {
      ...newEvent,
      totalSlots,
      occupiedSlots: 0,
    };
  }

  // Editar evento
  async updateEvent(
    id: string,
    data: {
      name?: string;
      description?: string;
      briefing?: string;
      gameId?: string;
      scheduledDate?: Date;
      timezone?: string;
      visibility?: EventVisibility;
      invitedClanIds?: string[];
      serverName?: string;
      serverIp?: string;
      serverPort?: string;
      serverPassword?: string;
      squads?: Array<{
        id?: string;
        name: string;
        order: number;
        frequency?: string;
        isCommand?: boolean;
        parentSquadId?: string;
        parentFrequency?: string;
        reservedForClanId?: string | null;
        slots: Array<{
          id?: string;
          role: string;
          order: number;
        }>;
      }>;
    },
    userId: string
  ) {
    if (data.scheduledDate) {
      this.assertScheduledDateNotInPast(data.scheduledDate);
    }

    const actor = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        role: true,
        clanId: true,
      },
    });

    if (!actor) {
      throw new Error('Usuario no encontrado');
    }

    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        creator: {
          select: {
            clanId: true,
          },
        },
        invitedClans: {
          select: {
            clanId: true,
          },
        },
        squads: {
          where: {
            deletedAt: null,
          },
          include: {
            slots: {
              where: {
                deletedAt: null,
              },
            },
          },
        },
      },
    });

    if (!event) {
      throw new Error('Evento no encontrado');
    }

    // VALIDACIÓN: No se puede modificar un evento FINISHED
    if (event.status === EventStatus.FINISHED) {
      throw new Error('No se puede modificar un evento finalizado');
    }

    const visibility = data.visibility ?? event.visibility;
    const invitedClanIds = Array.from(
      new Set(
        data.invitedClanIds ??
          event.invitedClans?.map((invitation) => invitation.clanId) ??
          []
      )
    );
    const reservedClanIds = (data.squads || [])
      .map((squad) => squad.reservedForClanId)
      .filter((clanId): clanId is string => Boolean(clanId));

    if (data.squads) {
      this.validateReservedSquadClans(
        visibility,
        invitedClanIds,
        event.creator?.clanId,
        data.squads
      );
    }

    await this.validateClanIds([...invitedClanIds, ...reservedClanIds]);

    const updatedEvent = await prisma.$transaction(async (tx) => {
      // Si se envían escuadras, actualizar estructura completa
      if (data.squads) {
        this.validateSquadStructure(data.squads);

        // Helper para verificar si un ID es un UUID válido (real de la BD)
        const isRealUUID = (sqId: string | undefined): boolean => {
          if (!sqId) return false;
          const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
          return uuidRegex.test(sqId);
        };

        // 1. Eliminar escuadras que ya no existen
        const realSquadIds = data.squads
          .filter((s) => s.id && isRealUUID(s.id))
          .map((s) => s.id as string);
        const squadsToDelete = event.squads.filter(
          (s) => !realSquadIds.includes(s.id)
        );

        for (const squad of squadsToDelete) {
          await tx.squad.delete({
            where: { id: squad.id },
          });
        }

        // 2. Guardar info de jerarquía para procesarla después
        const squadHierarchyInfo: Array<{
          inputId?: string;
          parentInputId?: string;
          parentFrequency?: string;
          index: number;
        }> = data.squads.map((squad, index) => ({
          inputId: squad.id,
          parentInputId: squad.parentSquadId,
          parentFrequency: squad.parentFrequency,
          index
        }));

        // Mapeo de IDs de input a IDs reales
        const inputIdToRealId = new Map<string, string>();

        // 3. Actualizar o crear escuadras SIN parentSquadId primero
        for (let i = 0; i < data.squads.length; i++) {
          const squadData = data.squads[i];
          const inputId = squadData.id;
          const isExisting = inputId && isRealUUID(inputId);

          if (isExisting) {
            // Actualizar escuadra existente
            const existingSquad = event.squads.find((s) => s.id === inputId);

            if (existingSquad) {
              await tx.squad.update({
                where: { id: inputId },
                data: {
                  name: squadData.name,
                  order: squadData.order,
                  frequency: squadData.frequency || null,
                  isCommand: squadData.isCommand || false,
                  parentSquadId: null,
                  parentFrequency: null,
                  reservedForClanId: squadData.reservedForClanId || null,
                },
              });

              inputIdToRealId.set(inputId, inputId);

              // Manejar slots
              const newSlotIds = squadData.slots
                .filter((sl) => sl.id)
                .map((sl) => sl.id as string);
              const slotsToDelete = existingSquad.slots.filter(
                (sl) => !newSlotIds.includes(sl.id)
              );

              for (const slot of slotsToDelete) {
                await tx.slot.delete({
                  where: { id: slot.id },
                });
              }

              for (const slotData of squadData.slots) {
                if (slotData.id) {
                  await tx.slot.update({
                    where: { id: slotData.id },
                    data: {
                      role: slotData.role,
                      order: slotData.order,
                    },
                  });
                } else {
                  await tx.slot.create({
                    data: {
                      role: slotData.role,
                      order: slotData.order,
                      status: 'FREE',
                      squadId: inputId,
                    },
                  });
                }
              }
            }
          } else {
            // Crear nueva escuadra SIN parentSquadId
            const newSquad = await tx.squad.create({
              data: {
                name: squadData.name,
                order: squadData.order,
                eventId: id,
                frequency: squadData.frequency || null,
                isCommand: squadData.isCommand || false,
                parentSquadId: null,
                parentFrequency: null,
                reservedForClanId: squadData.reservedForClanId || null,
                slots: {
                  create: squadData.slots.map((slot) => ({
                    role: slot.role,
                    order: slot.order,
                    status: 'FREE',
                  })),
                },
              },
            });

            if (inputId) {
              inputIdToRealId.set(inputId, newSquad.id);
            }
          }
        }

        // 4. Actualizar parentSquadId para todos los squads que tienen jerarquía
        for (const hierarchy of squadHierarchyInfo) {
          const currentSquadRealId = hierarchy.inputId
            ? inputIdToRealId.get(hierarchy.inputId)
            : null;

          if (!currentSquadRealId) {
            continue;
          }

          if (hierarchy.parentInputId) {
            let parentRealId: string | null = null;
            if (isRealUUID(hierarchy.parentInputId)) {
              parentRealId = hierarchy.parentInputId;
            } else {
              parentRealId = inputIdToRealId.get(hierarchy.parentInputId) || null;
            }

            if (parentRealId === currentSquadRealId) {
              throw new Error('Una escuadra no puede enlazarse consigo misma');
            }

            if (parentRealId) {
              await tx.squad.update({
                where: { id: currentSquadRealId },
                data: {
                  parentSquadId: parentRealId,
                  parentFrequency: hierarchy.parentFrequency || null,
                },
              });
            }
          } else {
            await tx.squad.update({
              where: { id: currentSquadRealId },
              data: {
                parentSquadId: null,
                parentFrequency: null,
              },
            });
          }
        }

      }

      if (data.invitedClanIds !== undefined) {
        await tx.eventInvitation.deleteMany({
          where: { eventId: id },
        });

        if (invitedClanIds.length > 0) {
          await tx.eventInvitation.createMany({
            data: invitedClanIds.map((clanId) => ({
              eventId: id,
              clanId,
              invitedBy: userId,
            })),
          });
        }
      }

      // Actualizar información básica del evento
      return tx.event.update({
        where: { id },
        data: {
          name: data.name,
          description: data.description,
          // SEGURIDAD: Sanitizar HTML del briefing para prevenir XSS
          briefing: data.briefing ? sanitizeHTML(data.briefing) : undefined,
          gameId: data.gameId,
          scheduledDate: data.scheduledDate,
          ...(data.timezone !== undefined && { timezone: data.timezone || 'UTC' }),
          ...(data.visibility !== undefined && { visibility: data.visibility }),
          ...(data.serverName !== undefined && { serverName: data.serverName || null }),
          ...(data.serverIp !== undefined && { serverIp: data.serverIp || null }),
          ...(data.serverPort !== undefined && { serverPort: data.serverPort || null }),
          ...(data.serverPassword !== undefined && { serverPassword: data.serverPassword || null }),
        },
        include: {
          game: true,
          creator: {
            select: {
              id: true,
              nickname: true,
              clan: {
                select: {
                  name: true,
                  tag: true,
                },
              },
            },
          },
          squads: {
            where: {
              deletedAt: null,
            },
            include: {
              reservedForClan: {
                select: {
                  id: true,
                  name: true,
                  tag: true,
                  avatarUrl: true,
                },
              },
              slots: {
                where: {
                  deletedAt: null,
                },
                include: {
                  user: {
                    select: {
                      id: true,
                      nickname: true,
                      email: true,
                      role: true,
                      status: true,
                      clanId: true,
                      avatarUrl: true,
                      clan: {
                        select: {
                          id: true,
                          name: true,
                          tag: true,
                          avatarUrl: true,
                        },
                      },
                    },
                  },
                },
                orderBy: { order: 'asc' },
              },
            },
            orderBy: { order: 'asc' },
          },
          invitedClans: {
            select: {
              clan: {
                select: {
                  id: true,
                  name: true,
                  tag: true,
                  avatarUrl: true,
                },
              },
            },
          },
        },
      });
    });

    // Calcular slots ocupados
    const occupiedSlots = updatedEvent.squads.reduce(
      (acc, squad) =>
        acc + squad.slots.filter((slot) => slot.status === 'OCCUPIED').length,
      0
    );

    const totalSlots = updatedEvent.squads.reduce(
      (acc, squad) => acc + squad.slots.length,
      0
    );

    logger.info('Event updated', {
      eventId: id,
      userId,
      squadsUpdated: !!data.squads,
    });

    return {
      ...updatedEvent,
      totalSlots,
      occupiedSlots,
    };
  }

  // Eliminar evento (soft delete con cascade manual)
  async deleteEvent(id: string) {
    const event = await prisma.event.findUnique({
      where: { id },
    });

    if (!event) {
      throw new Error('Evento no encontrado');
    }

    // Cascade manual atómico: soft-delete hijos antes que el padre.
    // El middleware convierte delete/deleteMany en update/updateMany con deletedAt.
    await prisma.$transaction(async (tx) => {
      // 1. Soft-delete todos los slots de las escuadras del evento
      await tx.slot.deleteMany({
        where: { squad: { eventId: id } },
      });

      // 2. Soft-delete todas las escuadras del evento
      await tx.squad.deleteMany({
        where: { eventId: id },
      });

      // 3. Soft-delete el evento
      await tx.event.delete({
        where: { id },
      });
    });
  }

  // Restaurar evento eliminado (soft delete)
  async restoreEvent(id: string) {
    // Buscar evento incluyendo soft-deleted (escape hatch del middleware)
    const event = await prisma.event.findFirst({
      where: { id, deletedAt: { not: null } },
    });

    if (!event) {
      throw new Error('Evento eliminado no encontrado');
    }

    // Restaurar atómicamente: evento → escuadras → slots
    const restoredEvent = await prisma.$transaction(async (tx) => {
      await tx.event.update({
        where: { id },
        data: { deletedAt: null },
      });

      await tx.squad.updateMany({
        where: { eventId: id, deletedAt: { not: null } },
        data: { deletedAt: null },
      });

      await tx.slot.updateMany({
        where: { squad: { eventId: id }, deletedAt: { not: null } },
        data: { deletedAt: null },
      });

      // Devolver el evento restaurado con sus relaciones
      return tx.event.findUnique({
        where: { id },
        include: {
          game: true,
          creator: {
            select: {
              id: true,
              nickname: true,
              clanId: true,
              clan: {
                select: {
                  id: true,
                  name: true,
                  tag: true,
                },
              },
            },
          },
          squads: {
            where: {
              deletedAt: null,
            },
            include: {
              slots: {
                where: {
                  deletedAt: null,
                },
                include: {
                  user: {
                    select: {
                      id: true,
                      nickname: true,
                      clan: {
                        select: {
                          name: true,
                          tag: true,
                        },
                      },
                    },
                  },
                },
                orderBy: { order: 'asc' },
              },
            },
            orderBy: { order: 'asc' },
          },
        },
      });
    });

    return restoredEvent;
  }

  // Cambiar estado del evento (ACTIVE <-> INACTIVE)
  async changeEventStatus(id: string, status: EventStatus) {
    const event = await prisma.event.findUnique({
      where: { id },
    });

    if (!event) {
      throw new Error('Evento no encontrado');
    }

    // No se puede cambiar el estado de un evento finalizado
    if (event.status === EventStatus.FINISHED) {
      throw new Error('No se puede modificar el estado de un evento finalizado');
    }

    // Solo se puede cambiar entre ACTIVE e INACTIVE
    if (status !== EventStatus.ACTIVE && status !== EventStatus.INACTIVE) {
      throw new Error('Estado no válido. Solo se puede cambiar entre Activo e Inactivo');
    }

    const updatedEvent = await prisma.event.update({
      where: { id },
      data: { status },
      include: {
        game: true,
        creator: {
          select: {
            id: true,
            nickname: true,
            clanId: true,
            clan: {
              select: {
                id: true,
                name: true,
                tag: true,
              },
            },
          },
        },
      },
    });

    return updatedEvent;
  }

  async getEventSlotlist(eventId: string) {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: {
        gameId: true,
      },
    });

    if (!event) {
      throw new Error('Evento no encontrado');
    }

    const slotlist = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        game: true,
        squads: {
          where: {
            deletedAt: null,
          },
          include: {
            reservedForClan: {
              select: {
                id: true,
                name: true,
                tag: true,
              },
            },
            slots: {
              where: {
                deletedAt: null,
              },
              include: {
                user: {
                  select: {
                    id: true,
                    nickname: true,
                    email: true,
                    clanId: true,
                    clan: {
                      select: {
                        id: true,
                        name: true,
                        tag: true,
                      },
                    },
                    gameIdentities: {
                      where: {
                        gameId: event.gameId,
                      },
                      select: {
                        providerKind: true,
                        value: true,
                        normalizedValue: true,
                        status: true,
                        verifiedAt: true,
                      },
                      take: 1,
                    },
                  },
                },
              },
              orderBy: { order: 'asc' },
            },
          },
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!slotlist) {
      throw new Error('Evento no encontrado');
    }

    return {
      event: {
        id: slotlist.id,
        name: slotlist.name,
        scheduledDate: slotlist.scheduledDate,
        timezone: slotlist.timezone,
        game: slotlist.game,
      },
      squads: slotlist.squads.map((squad) => ({
        id: squad.id,
        name: squad.name,
        order: squad.order,
        reservedForClan: squad.reservedForClan,
        slots: squad.slots.map((slot) => {
          const identity = slot.user?.gameIdentities[0] || null;

          return {
            id: slot.id,
            role: slot.role,
            order: slot.order,
            status: slot.status,
            user: slot.user
              ? {
                  id: slot.user.id,
                  nickname: slot.user.nickname,
                  email: slot.user.email,
                  clan: slot.user.clan,
                  identity: identity
                    ? {
                        providerKind: identity.providerKind,
                        value: identity.value,
                        normalizedValue: identity.normalizedValue,
                        status: identity.status,
                        verifiedAt: identity.verifiedAt,
                      }
                    : null,
                }
              : null,
          };
        }),
      })),
    };
  }

  async getEventWhitelist(eventId: string) {
    const slotlist = await this.getEventSlotlist(eventId);

    if (slotlist.event.game.identityMode === GameIdentityMode.NONE) {
      throw new Error('Este juego no usa whitelist basada en identidad');
    }

    const identifiers = Array.from(new Set(slotlist.squads
      .flatMap((squad) => squad.slots)
      .map((slot) => slot.user?.identity)
      .filter((identity) => Boolean(identity && identity.status === GameIdentityStatus.VERIFIED && identity.normalizedValue))
      .map((identity) => identity!.normalizedValue as string)));

    return {
      event: slotlist.event,
      identifiers,
      content: identifiers.join('\n'),
    };
  }

  // Generar token de compartir público
  async generateShareToken(eventId: string): Promise<string> {
    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) throw new Error('Evento no encontrado');

    // Si ya tiene token, devolverlo
    if (event.publicShareToken) return event.publicShareToken;

    // Generar token único
    const crypto = await import('crypto');
    const token = crypto.randomBytes(16).toString('hex');

    await prisma.event.update({
      where: { id: eventId },
      data: { publicShareToken: token },
    });

    return token;
  }

  // Obtener evento por token público (sin info de servidor)
  async getEventByShareToken(token: string) {
    const event = await prisma.event.findUnique({
      where: { publicShareToken: token },
      include: {
        game: true,
        creator: {
          select: {
            id: true,
            nickname: true,
            clanId: true,
            clan: {
              select: {
                id: true,
                name: true,
                tag: true,
                avatarUrl: true,
              },
            },
          },
        },
        squads: {
          where: {
            deletedAt: null,
          },
          include: {
            reservedForClan: {
              select: {
                id: true,
                name: true,
                tag: true,
                avatarUrl: true,
              },
            },
            slots: {
              where: {
                deletedAt: null,
              },
              include: {
                user: {
                  select: {
                    id: true,
                    nickname: true,
                    status: true,
                    clanId: true,
                    avatarUrl: true,
                    clan: {
                      select: {
                        id: true,
                        name: true,
                        tag: true,
                        avatarUrl: true,
                      },
                    },
                  },
                },
              },
              orderBy: { order: 'asc' as const },
            },
          },
          orderBy: { order: 'asc' as const },
        },
      },
    });

    if (!event) {
      throw new Error('Evento no encontrado');
    }

    // OMITIR info de conexión del servidor por seguridad
    const { serverName, serverIp, serverPort, serverPassword, ...safeEvent } = event;

    const totalSlots = safeEvent.squads.reduce((acc, squad) => acc + squad.slots.length, 0);
    const occupiedSlots = safeEvent.squads.reduce(
      (acc, squad) => acc + squad.slots.filter((s) => s.userId !== null).length,
      0
    );

    return {
      ...safeEvent,
      totalSlots,
      occupiedSlots,
    };
  }
}

export const eventService = new EventService();
