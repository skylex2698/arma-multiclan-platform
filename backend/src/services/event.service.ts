// backend/src/services/event.service.ts - VERSIÓN COMPLETA ACTUALIZADA

import { prisma } from '../index';
import { logger } from '../utils/logger';
import { sanitizeHTML } from '../utils/sanitizer';
import { EventStatus, GameType, UserRole, SlotStatus } from '@prisma/client';

export class EventService {
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

  // ============================================
  // MÉTODOS DE LISTADO
  // ============================================

  // Listar eventos con filtros
  async getAllEvents(filters?: {
    status?: EventStatus;
    gameType?: GameType;
    upcoming?: boolean;
    includeAll?: boolean; // Si true, muestra todos los estados
  }) {
    // Primero verificar y finalizar eventos expirados
    await this.checkAndFinishExpiredEvents();

    const now = new Date();

    // Por defecto: solo eventos ACTIVE, ordenados por fecha más próxima
    const whereClause: Record<string, unknown> = {};

    if (filters?.includeAll) {
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

    if (filters?.gameType) {
      whereClause.gameType = filters.gameType;
    }

    if (filters?.upcoming) {
      whereClause.scheduledDate = { gte: now };
      whereClause.status = EventStatus.ACTIVE;
    }

    const events = await prisma.event.findMany({
      where: whereClause,
      include: {
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
          include: {
            slots: {
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
        }
      },
      // Ordenar por fecha más próxima primero
      orderBy: { scheduledDate: 'asc' }
    });

    return events.map(event => ({
      ...event,
      totalSlots: event.squads.reduce((acc, squad) => acc + squad.slots.length, 0),
      occupiedSlots: event.squads.reduce(
        (acc, squad) => acc + squad.slots.filter(s => s.status === SlotStatus.OCCUPIED).length,
        0
      )
    }));
  }

  // Obtener evento por ID
  async getEventById(id: string) {
    const event = await prisma.event.findUnique({
      where: { id },
      include: {
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
          include: {
            slots: {
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
    gameType: GameType;
    scheduledDate: Date;
    creatorId: string;
    squads: Array<{
      id?: string; // ID temporal del frontend para mapeo de jerarquía
      name: string;
      order: number;
      frequency?: string;
      isCommand?: boolean;
      parentSquadId?: string;
      parentFrequency?: string;
      slots: Array<{
        role: string;
        order: number;
      }>;
    }>;
  }) {
    // Guardar referencias de jerarquía para procesarlas después
    // El frontend envía IDs temporales (ej: "1672531200000") que no existen en la BD
    const squadHierarchy = data.squads.map(squad => ({
      tempId: squad.id,
      parentTempId: squad.parentSquadId,
      parentFrequency: squad.parentFrequency
    }));

    // Paso 1: Crear evento con squads SIN parentSquadId
    // Esto evita errores de foreign key cuando los padres aún no existen
    const event = await prisma.event.create({
      data: {
        name: data.name,
        description: data.description,
        // SEGURIDAD: Sanitizar HTML del briefing para prevenir XSS
        briefing: data.briefing ? sanitizeHTML(data.briefing) : undefined,
        gameType: data.gameType,
        scheduledDate: data.scheduledDate,
        creatorId: data.creatorId,
        status: EventStatus.ACTIVE,
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
        squads: {
          include: {
            slots: true
          },
          orderBy: { order: 'asc' }
        }
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
            prisma.squad.update({
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

    // Recargar el evento con los datos actualizados de jerarquía
    const finalEvent = await prisma.event.findUnique({
      where: { id: event.id },
      include: {
        creator: {
          select: {
            nickname: true
          }
        },
        squads: {
          include: {
            slots: true
          },
          orderBy: { order: 'asc' }
        }
      }
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        action: 'EVENT_CREATED',
        entity: 'Event',
        entityId: event.id,
        userId: data.creatorId,
        eventId: event.id,
        details: JSON.stringify({
          name: event.name,
          gameType: event.gameType,
          squadCount: event.squads.length,
          totalSlots: event.squads.reduce((acc, s) => acc + s.slots.length, 0)
        })
      }
    });

    logger.info('Event created', { eventId: event.id, creatorId: data.creatorId });

    return finalEvent!;
  }

  // Crear evento desde plantilla
  async createEventFromTemplate(data: {
    templateEventId: string;
    name: string;
    description?: string;
    briefing?: string;
    scheduledDate: Date;
    creatorId: string;
  }) {
    // Obtener el evento plantilla
    const templateEvent = await prisma.event.findUnique({
      where: { id: data.templateEventId },
      include: {
        squads: {
          include: {
            slots: {
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
        gameType: templateEvent.gameType,
        scheduledDate: data.scheduledDate,
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
        squads: {
          include: {
            slots: {
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
      gameType?: GameType;
      scheduledDate?: Date;
      squads?: Array<{
        id?: string;
        name: string;
        order: number;
        frequency?: string;
        isCommand?: boolean;
        parentSquadId?: string;
        parentFrequency?: string;
        slots: Array<{
          id?: string;
          role: string;
          order: number;
        }>;
      }>;
    },
    userId: string
  ) {
    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        squads: {
          include: {
            slots: true,
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

    // Si se envían escuadras, actualizar estructura completa
    if (data.squads) {
      // Helper para verificar si un ID es un UUID válido (real de la BD)
      const isRealUUID = (id: string | undefined): boolean => {
        if (!id) return false;
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        return uuidRegex.test(id);
      };

      // 1. Eliminar escuadras que ya no existen
      // Solo consideramos IDs reales (UUIDs) para identificar squads existentes
      const realSquadIds = data.squads
        .filter((s) => s.id && isRealUUID(s.id))
        .map((s) => s.id as string);
      const squadsToDelete = event.squads.filter(
        (s) => !realSquadIds.includes(s.id)
      );

      for (const squad of squadsToDelete) {
        await prisma.squad.delete({
          where: { id: squad.id },
        });
      }

      // 2. Guardar info de jerarquía para procesarla después
      const squadHierarchyInfo: Array<{
        inputId?: string; // ID del frontend (puede ser temp o real)
        parentInputId?: string; // parentSquadId del frontend
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
            // Actualizar sin parentSquadId por ahora
            await prisma.squad.update({
              where: { id: inputId },
              data: {
                name: squadData.name,
                order: squadData.order,
                frequency: squadData.frequency || null,
                isCommand: squadData.isCommand || false,
                // NO actualizar parentSquadId aquí
              },
            });

            // Registrar mapeo (ID real -> ID real)
            inputIdToRealId.set(inputId, inputId);

            // Manejar slots
            const newSlotIds = squadData.slots
              .filter((sl) => sl.id)
              .map((sl) => sl.id as string);
            const slotsToDelete = existingSquad.slots.filter(
              (sl) => !newSlotIds.includes(sl.id)
            );

            // Eliminar slots que ya no existen
            for (const slot of slotsToDelete) {
              await prisma.slot.delete({
                where: { id: slot.id },
              });
            }

            // Actualizar o crear slots
            for (const slotData of squadData.slots) {
              if (slotData.id) {
                await prisma.slot.update({
                  where: { id: slotData.id },
                  data: {
                    role: slotData.role,
                    order: slotData.order,
                  },
                });
              } else {
                await prisma.slot.create({
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
          const newSquad = await prisma.squad.create({
            data: {
              name: squadData.name,
              order: squadData.order,
              eventId: id,
              frequency: squadData.frequency || null,
              isCommand: squadData.isCommand || false,
              parentSquadId: null, // Se asignará después
              parentFrequency: null,
              slots: {
                create: squadData.slots.map((slot) => ({
                  role: slot.role,
                  order: slot.order,
                  status: 'FREE',
                })),
              },
            },
          });

          // Registrar mapeo (ID temp -> ID real)
          if (inputId) {
            inputIdToRealId.set(inputId, newSquad.id);
          }
        }
      }

      // 4. Actualizar parentSquadId para todos los squads que tienen jerarquía
      for (const hierarchy of squadHierarchyInfo) {
        if (hierarchy.parentInputId) {
          // Resolver el ID real del squad actual
          const currentSquadRealId = hierarchy.inputId
            ? inputIdToRealId.get(hierarchy.inputId)
            : null;

          // Resolver el ID real del padre
          let parentRealId: string | null = null;
          if (isRealUUID(hierarchy.parentInputId)) {
            // El padre es un squad existente
            parentRealId = hierarchy.parentInputId;
          } else {
            // El padre es un squad nuevo, buscar en el mapeo
            parentRealId = inputIdToRealId.get(hierarchy.parentInputId) || null;
          }

          if (currentSquadRealId && parentRealId) {
            await prisma.squad.update({
              where: { id: currentSquadRealId },
              data: {
                parentSquadId: parentRealId,
                parentFrequency: hierarchy.parentFrequency || null,
              },
            });
          }
        }
      }
    }

    // Actualizar información básica del evento
    const updatedEvent = await prisma.event.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        // SEGURIDAD: Sanitizar HTML del briefing para prevenir XSS
        briefing: data.briefing ? sanitizeHTML(data.briefing) : undefined,
        gameType: data.gameType,
        scheduledDate: data.scheduledDate,
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
        squads: {
          include: {
            slots: {
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
      },
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

  // Cambiar estado del evento con validaciones
  async changeEventStatus(
    eventId: string,
    newStatus: EventStatus,
    userId: string,
    userRole: UserRole,
    userClanId?: string
  ) {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        creator: {
          select: {
            clanId: true
          }
        }
      }
    });

    if (!event) {
      throw new Error('Evento no encontrado');
    }

    const now = new Date();

    // VALIDACIÓN 1: No se puede cambiar el estado de un evento FINISHED
    if (event.status === EventStatus.FINISHED) {
      throw new Error('No se puede modificar un evento finalizado');
    }

    // VALIDACIÓN 2: Solo ADMIN o CLAN_LEADER del mismo clan que creó el evento
    if (userRole !== UserRole.ADMIN) {
      if (userRole !== UserRole.CLAN_LEADER || userClanId !== event.creator.clanId) {
        throw new Error('No tienes permisos para cambiar el estado de este evento');
      }
    }

    // VALIDACIÓN 3: No se puede establecer manualmente el estado FINISHED
    if (newStatus === EventStatus.FINISHED) {
      throw new Error('El estado FINISHED solo se establece automáticamente cuando el evento expira');
    }

    // VALIDACIÓN 4: Para pasar a ACTIVE, la fecha debe ser futura
    if (newStatus === EventStatus.ACTIVE && event.scheduledDate <= now) {
      throw new Error('No se puede activar un evento cuya fecha ya ha pasado');
    }

    const updatedEvent = await prisma.event.update({
      where: { id: eventId },
      data: { status: newStatus }
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        action: 'EVENT_STATUS_CHANGED',
        entity: 'Event',
        entityId: eventId,
        userId,
        eventId,
        details: JSON.stringify({ previousStatus: event.status, newStatus })
      }
    });

    logger.info('Event status changed', { eventId, previousStatus: event.status, newStatus, userId });

    return updatedEvent;
  }

  // Eliminar evento
  async deleteEvent(id: string) {
    const event = await prisma.event.findUnique({
      where: { id },
    });

    if (!event) {
      throw new Error('Evento no encontrado');
    }

    await prisma.event.delete({
      where: { id },
    });
  }
}

export const eventService = new EventService();