import { prisma } from '../index';
import { logger } from '../utils/logger';
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
        briefing: data.briefing,
        gameType: data.gameType,
        scheduledDate: data.scheduledDate,
        creatorId: data.creatorId,
        status: EventStatus.ACTIVE,
        squads: {
          create: data.squads.map(squad => ({
            name: squad.name,
            order: squad.order,
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
    // Obtener evento plantilla
    const template = await prisma.event.findUnique({
      where: { id: data.templateEventId },
      include: {
        squads: {
          include: {
            slots: true
          },
          orderBy: { order: 'asc' }
        }
      }
    });

    if (!template) {
      throw new Error('Evento plantilla no encontrado');
    }

    // Crear nuevo evento con la estructura de la plantilla
    const newEvent = await prisma.event.create({
      data: {
        name: data.name,
        description: data.description,
        briefing: data.briefing,
        gameType: template.gameType,
        scheduledDate: data.scheduledDate,
        creatorId: data.creatorId,
        status: EventStatus.ACTIVE,
        squads: {
          create: template.squads.map(squad => ({
            name: squad.name,
            order: squad.order,
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
        squads: {
          include: {
            slots: true
          }
        }
      }
    });

    logger.info('Event created from template', {
      newEventId: newEvent.id,
      templateId: template.id,
      creatorId: data.creatorId
    });

    return newEvent;
  }

  // Editar evento
  async updateEvent(
    eventId: string,
    data: {
      name?: string;
      description?: string;
      briefing?: string;
      scheduledDate?: Date;
    },
    userId: string
  ) {
    const event = await prisma.event.findUnique({
      where: { id: eventId }
    });

    if (!event) {
      throw new Error('Evento no encontrado');
    }

    const updatedEvent = await prisma.event.update({
      where: { id: eventId },
      data
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        action: 'EVENT_UPDATED',
        entity: 'Event',
        entityId: eventId,
        userId,
        eventId,
        details: JSON.stringify(data)
      }
    });

    logger.info('Event updated', { eventId, userId });

    return updatedEvent;
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
  async deleteEvent(eventId: string, userId: string) {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        squads: {
          include: {
            slots: true
          }
        }
      }
    });

    if (!event) {
      throw new Error('Evento no encontrado');
    }

    await prisma.event.delete({
      where: { id: eventId }
    });

    logger.info('Event deleted', { eventId, userId });

    return {
      message: 'Evento eliminado correctamente',
      deletedSquads: event.squads.length,
      deletedSlots: event.squads.reduce((acc, s) => acc + s.slots.length, 0)
    };
  }
}

export const eventService = new EventService();