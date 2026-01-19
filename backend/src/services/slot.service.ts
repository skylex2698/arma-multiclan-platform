import { prisma } from '../index';
import { logger } from '../utils/logger';
import { SlotStatus, UserRole, EventStatus } from '@prisma/client';

export class SlotService {
  // Apuntarse a un slot
  async assignSlot(
    slotId: string,
    userId: string,
    assignedBy: string,
    assignerRole: UserRole,
    assignerClanId: string | null
  ) {
    // Obtener slot con información completa
    const slot = await prisma.slot.findUnique({
      where: { id: slotId },
      include: {
        squad: {
          include: {
            event: true
          }
        },
        user: true
      }
    });

    if (!slot) {
      throw new Error('Slot no encontrado');
    }

    // Verificar que el evento esté activo
    if (slot.squad.event.status !== EventStatus.ACTIVE) {
      throw new Error('No puedes apuntarte a un evento inactivo');
    }

    // Verificar que el slot esté libre
    if (slot.status === SlotStatus.OCCUPIED) {
      throw new Error('Este slot ya está ocupado');
    }

    // Obtener usuario a asignar
    const userToAssign = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!userToAssign) {
      throw new Error('Usuario no encontrado');
    }

    // Si no es admin, verificar restricciones
    if (assignerRole !== UserRole.ADMIN) {
      // Solo puede apuntarse a sí mismo
      if (userId !== assignedBy) {
        // O si es líder de clan, puede apuntar a miembros de su clan
        if (assignerRole === UserRole.CLAN_LEADER) {
          if (!assignerClanId || userToAssign.clanId !== assignerClanId) {
            throw new Error('Solo puedes apuntar a miembros de tu clan');
          }
        } else {
          throw new Error('Solo puedes apuntarte a ti mismo');
        }
      }
    }

    // Verificar que el usuario no esté ya en otro slot del mismo evento
    const existingSlot = await prisma.slot.findFirst({
      where: {
        userId: userId,
        squad: {
          eventId: slot.squad.eventId
        }
      }
    });

    if (existingSlot) {
      // Liberar el slot anterior automáticamente
      await prisma.slot.update({
        where: { id: existingSlot.id },
        data: {
          userId: null,
          status: SlotStatus.FREE
        }
      });

      logger.info('Previous slot freed automatically', {
        slotId: existingSlot.id,
        userId
      });
    }

    // Asignar el nuevo slot
    const updatedSlot = await prisma.slot.update({
      where: { id: slotId },
      data: {
        userId: userId,
        status: SlotStatus.OCCUPIED
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
        },
        squad: {
          select: {
            name: true,
            event: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        action: 'SLOT_ASSIGNED',
        entity: 'Slot',
        entityId: slotId,
        userId: assignedBy,
        eventId: slot.squad.eventId,
        details: JSON.stringify({
          assignedUserId: userId,
          slotRole: slot.role,
          squadName: slot.squad.name,
          eventName: slot.squad.event.name
        })
      }
    });

    logger.info('Slot assigned', { slotId, userId, assignedBy });

    return updatedSlot;
  }

  // Desapuntarse de un slot
  async unassignSlot(
    slotId: string,
    requestUserId: string,
    requestUserRole: UserRole,
    requestUserClanId: string | null
  ) {
    const slot = await prisma.slot.findUnique({
      where: { id: slotId },
      include: {
        squad: {
          include: {
            event: true
          }
        },
        user: true
      }
    });

    if (!slot) {
      throw new Error('Slot no encontrado');
    }

    if (slot.status !== SlotStatus.OCCUPIED || !slot.userId) {
      throw new Error('Este slot no está ocupado');
    }

    // Verificar que el evento esté activo
    if (slot.squad.event.status !== EventStatus.ACTIVE) {
      throw new Error('No puedes desapuntarte de un evento inactivo');
    }

    // Si no es admin, verificar permisos
    if (requestUserRole !== UserRole.ADMIN) {
      // Solo puede desapuntarse a sí mismo
      if (slot.userId !== requestUserId) {
        // O si es líder de clan, puede desapuntar a miembros de su clan
        if (requestUserRole === UserRole.CLAN_LEADER) {
          if (!requestUserClanId || slot.user?.clanId !== requestUserClanId) {
            throw new Error('Solo puedes desapuntar a miembros de tu clan');
          }
        } else {
          throw new Error('Solo puedes desapuntarte a ti mismo');
        }
      }
    }

    const updatedSlot = await prisma.slot.update({
      where: { id: slotId },
      data: {
        userId: null,
        status: SlotStatus.FREE
      }
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        action: 'SLOT_UNASSIGNED',
        entity: 'Slot',
        entityId: slotId,
        userId: requestUserId,
        eventId: slot.squad.eventId,
        details: JSON.stringify({
          unassignedUserId: slot.userId,
          slotRole: slot.role
        })
      }
    });

    logger.info('Slot unassigned', { slotId, userId: slot.userId, requestUserId });

    return updatedSlot;
  }

  // Marcar ausencia (libera el slot y crea registro de ausencia)
  async markAbsence(
    eventId: string,
    userId: string,
    reason?: string
  ) {
    // Verificar que el evento existe
    const event = await prisma.event.findUnique({
      where: { id: eventId }
    });

    if (!event) {
      throw new Error('Evento no encontrado');
    }

    // Buscar si el usuario tiene un slot en este evento
    const slot = await prisma.slot.findFirst({
      where: {
        userId: userId,
        squad: {
          eventId: eventId
        }
      },
      include: {
        squad: true
      }
    });

    // Crear registro de ausencia
    const absence = await prisma.absence.create({
      data: {
        userId,
        eventId,
        reason
      }
    });

    // Si tenía un slot, liberarlo
    if (slot) {
      await prisma.slot.update({
        where: { id: slot.id },
        data: {
          userId: null,
          status: SlotStatus.FREE
        }
      });

      logger.info('Slot freed due to absence', { slotId: slot.id, userId });
    }

    // Audit log
    await prisma.auditLog.create({
      data: {
        action: 'ABSENCE_MARKED',
        entity: 'Event',
        entityId: eventId,
        userId: userId,
        eventId: eventId,
        details: JSON.stringify({
          reason,
          slotFreed: !!slot
        })
      }
    });

    logger.info('Absence marked', { eventId, userId });

    return {
      absence,
      slotFreed: !!slot
    };
  }

  // Crear escuadra
  async createSquad(
    eventId: string,
    data: {
      name: string;
      order: number;
      slots: Array<{
        role: string;
        order: number;
      }>;
    },
    userId: string
  ) {
    // Verificar que el evento existe
    const event = await prisma.event.findUnique({
      where: { id: eventId }
    });

    if (!event) {
      throw new Error('Evento no encontrado');
    }

    const squad = await prisma.squad.create({
      data: {
        eventId,
        name: data.name,
        order: data.order,
        slots: {
          create: data.slots.map(slot => ({
            role: slot.role,
            order: slot.order,
            status: SlotStatus.FREE
          }))
        }
      },
      include: {
        slots: true
      }
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        action: 'SQUAD_CREATED',
        entity: 'Squad',
        entityId: squad.id,
        userId,
        eventId,
        details: JSON.stringify({
          squadName: squad.name,
          slotCount: data.slots.length
        })
      }
    });

    logger.info('Squad created', { squadId: squad.id, eventId, userId });

    return squad;
  }

  // Editar escuadra
  async updateSquad(
    squadId: string,
    data: {
      name?: string;
      order?: number;
    },
    userId: string
  ) {
    const squad = await prisma.squad.findUnique({
      where: { id: squadId },
      include: {
        event: true
      }
    });

    if (!squad) {
      throw new Error('Escuadra no encontrada');
    }

    const updatedSquad = await prisma.squad.update({
      where: { id: squadId },
      data
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        action: 'SQUAD_UPDATED',
        entity: 'Squad',
        entityId: squadId,
        userId,
        eventId: squad.eventId,
        details: JSON.stringify(data)
      }
    });

    logger.info('Squad updated', { squadId, userId });

    return updatedSquad;
  }

  // Eliminar escuadra
  async deleteSquad(squadId: string, userId: string) {
    const squad = await prisma.squad.findUnique({
      where: { id: squadId },
      include: {
        slots: true,
        event: true
      }
    });

    if (!squad) {
      throw new Error('Escuadra no encontrada');
    }

    await prisma.squad.delete({
      where: { id: squadId }
    });

    logger.info('Squad deleted', { squadId, userId, deletedSlots: squad.slots.length });

    return {
      message: 'Escuadra eliminada correctamente',
      deletedSlots: squad.slots.length
    };
  }

  // Crear slot
  async createSlot(
    squadId: string,
    data: {
      role: string;
      order: number;
    },
    userId: string
  ) {
    const squad = await prisma.squad.findUnique({
      where: { id: squadId },
      include: {
        event: true
      }
    });

    if (!squad) {
      throw new Error('Escuadra no encontrada');
    }

    const slot = await prisma.slot.create({
      data: {
        squadId,
        role: data.role,
        order: data.order,
        status: SlotStatus.FREE
      }
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        action: 'SLOT_CREATED',
        entity: 'Slot',
        entityId: slot.id,
        userId,
        eventId: squad.eventId,
        details: JSON.stringify({
          role: data.role,
          squadName: squad.name
        })
      }
    });

    logger.info('Slot created', { slotId: slot.id, squadId, userId });

    return slot;
  }

  // Editar slot
  async updateSlot(
    slotId: string,
    data: {
      role?: string;
      order?: number;
    },
    userId: string
  ) {
    const slot = await prisma.slot.findUnique({
      where: { id: slotId },
      include: {
        squad: {
          include: {
            event: true
          }
        }
      }
    });

    if (!slot) {
      throw new Error('Slot no encontrado');
    }

    const updatedSlot = await prisma.slot.update({
      where: { id: slotId },
      data
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        action: 'SLOT_UPDATED',
        entity: 'Slot',
        entityId: slotId,
        userId,
        eventId: slot.squad.eventId,
        details: JSON.stringify(data)
      }
    });

    logger.info('Slot updated', { slotId, userId });

    return updatedSlot;
  }

  // Eliminar slot
  async deleteSlot(slotId: string, userId: string) {
    const slot = await prisma.slot.findUnique({
      where: { id: slotId },
      include: {
        squad: {
          include: {
            event: true
          }
        }
      }
    });

    if (!slot) {
      throw new Error('Slot no encontrado');
    }

    if (slot.status === SlotStatus.OCCUPIED) {
      throw new Error('No puedes eliminar un slot ocupado. Primero desapunta al usuario.');
    }

    await prisma.slot.delete({
      where: { id: slotId }
    });

    logger.info('Slot deleted', { slotId, userId });

    return {
      message: 'Slot eliminado correctamente'
    };
  }
}

export const slotService = new SlotService();