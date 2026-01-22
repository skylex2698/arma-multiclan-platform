// backend/src/services/event.service.ts - VERSIÓN COMPLETA ACTUALIZADA

import { prisma } from '../index';
import { logger } from '../utils/logger';
import { sanitizeHTML } from '../utils/sanitizer';
import { EventStatus, GameType, UserRole, SlotStatus } from '@prisma/client';

export class EventService {
  // Listar eventos con filtros
  async getAllEvents(filters?: {
    status?: EventStatus;
    gameType?: GameType;
    upcoming?: boolean;
  }) {
    const now = new Date();

    const events = await prisma.event.findMany({
      where: {
        ...(filters?.status && { status: filters.status }),
        ...(filters?.gameType && { gameType: filters.gameType }),
        ...(filters?.upcoming && {
          scheduledDate: { gte: now },
          status: EventStatus.ACTIVE
        })
      },
      include: {
        creator: {
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
      orderBy: { scheduledDate: 'desc' }
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
            parentSquadId: squad.parentSquadId || null,
            parentFrequency: squad.parentFrequency || null,
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

    return event;
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

    // Si se envían escuadras, actualizar estructura completa
    if (data.squads) {
      // 1. Eliminar escuadras y slots que ya no existen
      const newSquadIds = data.squads
        .filter((s) => s.id)
        .map((s) => s.id as string);
      const squadsToDelete = event.squads.filter(
        (s) => !newSquadIds.includes(s.id)
      );

      for (const squad of squadsToDelete) {
        await prisma.squad.delete({
          where: { id: squad.id },
        });
      }

      // 2. Actualizar o crear escuadras
      for (const squadData of data.squads) {
        if (squadData.id) {
          // Actualizar escuadra existente
          const existingSquad = event.squads.find((s) => s.id === squadData.id);
          
          if (existingSquad) {
            // Actualizar nombre, orden y CAMPOS DE COMUNICACIÓN
            await prisma.squad.update({
              where: { id: squadData.id },
              data: {
                name: squadData.name,
                order: squadData.order,
                // ========== CAMPOS DE COMUNICACIÓN ==========
                frequency: squadData.frequency || null,
                isCommand: squadData.isCommand || false,
                parentSquadId: squadData.parentSquadId || null,
                parentFrequency: squadData.parentFrequency || null,
                // ============================================
              },
            });

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
                // Actualizar slot existente
                await prisma.slot.update({
                  where: { id: slotData.id },
                  data: {
                    role: slotData.role,
                    order: slotData.order,
                  },
                });
              } else {
                // Crear nuevo slot
                await prisma.slot.create({
                  data: {
                    role: slotData.role,
                    order: slotData.order,
                    status: 'FREE',
                    squadId: squadData.id,
                  },
                });
              }
            }
          }
        } else {
          // Crear nueva escuadra con sus slots
          await prisma.squad.create({
            data: {
              name: squadData.name,
              order: squadData.order,
              eventId: id,
              // ========== CAMPOS DE COMUNICACIÓN ==========
              frequency: squadData.frequency || null,
              isCommand: squadData.isCommand || false,
              parentSquadId: squadData.parentSquadId || null,
              parentFrequency: squadData.parentFrequency || null,
              // ============================================
              slots: {
                create: squadData.slots.map((slot) => ({
                  role: slot.role,
                  order: slot.order,
                  status: 'FREE',
                })),
              },
            },
          });
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

  // Cambiar estado del evento
  async changeEventStatus(eventId: string, newStatus: EventStatus, userId: string) {
    const event = await prisma.event.findUnique({
      where: { id: eventId }
    });

    if (!event) {
      throw new Error('Evento no encontrado');
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