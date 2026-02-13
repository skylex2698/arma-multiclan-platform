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
    const updatedSlot = await prisma.$transaction(async (tx) => {
      // Leer slot con información completa (snapshot dentro de la transacción)
      const slot = await tx.slot.findUnique({
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

      // Verificar que el evento esté activo (fail fast antes de bloquear)
      if (slot.squad.event.status === EventStatus.FINISHED) {
        throw new Error('No puedes apuntarte a un evento finalizado');
      }
      if (slot.squad.event.status === EventStatus.INACTIVE) {
        throw new Error('No puedes apuntarte a un evento inactivo. El evento debe estar activo.');
      }

      // Obtener usuario a asignar
      const userToAssign = await tx.user.findUnique({
        where: { id: userId }
      });

      if (!userToAssign) {
        throw new Error('Usuario no encontrado');
      }

      // Verificar reserva de clan en la escuadra
      if (slot.squad.reservedForClanId) {
        if (userToAssign.clanId !== slot.squad.reservedForClanId) {
          if (assignerRole !== UserRole.ADMIN) {
            throw new Error('Esta escuadra está reservada para otro clan');
          }
        }
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
      const existingSlot = await tx.slot.findFirst({
        where: {
          userId: userId,
          squad: {
            eventId: slot.squad.eventId
          }
        }
      });

      // Bloquear todos los slots afectados en orden determinista (evita deadlocks)
      const slotsToLock = [slotId];
      if (existingSlot && existingSlot.id !== slotId) {
        slotsToLock.push(existingSlot.id);
      }
      slotsToLock.sort();

      for (const lockId of slotsToLock) {
        await tx.$queryRaw`SELECT id FROM "Slot" WHERE id = ${lockId} FOR UPDATE`;
      }

      // Re-verificar estado del slot después de adquirir el bloqueo
      // (puede haber cambiado mientras esperábamos el lock)
      const lockedSlot = await tx.slot.findUnique({
        where: { id: slotId },
        select: { status: true }
      });

      if (!lockedSlot || lockedSlot.status === SlotStatus.OCCUPIED) {
        throw new Error('Este slot ya está ocupado');
      }

      // Liberar el slot anterior si existe
      if (existingSlot && existingSlot.id !== slotId) {
        await tx.slot.update({
          where: { id: existingSlot.id },
          data: {
            userId: null,
            status: SlotStatus.FREE
          }
        });
      }

      // Asignar el nuevo slot
      const result = await tx.slot.update({
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

      // Audit log dentro de la transacción
      await tx.auditLog.create({
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

      return result;
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
    const { updatedSlot, previousUserId } = await prisma.$transaction(async (tx) => {
      // Bloquear la fila del slot para evitar modificaciones concurrentes
      await tx.$queryRaw`SELECT id FROM "Slot" WHERE id = ${slotId} FOR UPDATE`;

      const slot = await tx.slot.findUnique({
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

      // Verificar que el evento esté activo (solo se puede desapuntar en eventos ACTIVE)
      if (slot.squad.event.status === EventStatus.FINISHED) {
        throw new Error('No puedes desapuntarte de un evento finalizado');
      }
      if (slot.squad.event.status === EventStatus.INACTIVE) {
        throw new Error('No puedes desapuntarte de un evento inactivo. El evento debe estar activo.');
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

      const prevUserId = slot.userId;

      const result = await tx.slot.update({
        where: { id: slotId },
        data: {
          userId: null,
          status: SlotStatus.FREE
        }
      });

      // Audit log dentro de la transacción
      await tx.auditLog.create({
        data: {
          action: 'SLOT_UNASSIGNED',
          entity: 'Slot',
          entityId: slotId,
          userId: requestUserId,
          eventId: slot.squad.eventId,
          details: JSON.stringify({
            unassignedUserId: prevUserId,
            slotRole: slot.role
          })
        }
      });

      return { updatedSlot: result, previousUserId: prevUserId };
    });

    logger.info('Slot unassigned', { slotId, userId: previousUserId, requestUserId });

    return updatedSlot;
  }

  // Marcar ausencia (libera el slot y crea registro de ausencia)
  async markAbsence(
    eventId: string,
    userId: string,
    reason?: string
  ) {
    // Lecturas de validación fuera de la transacción
    const event = await prisma.event.findUnique({
      where: { id: eventId }
    });

    if (!event) {
      throw new Error('Evento no encontrado');
    }

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

    // Escrituras atómicas dentro de la transacción
    const result = await prisma.$transaction(async (tx) => {
      // Crear registro de ausencia
      const absence = await tx.absence.create({
        data: {
          userId,
          eventId,
          reason
        }
      });

      // Si tenía un slot, liberarlo
      if (slot) {
        await tx.slot.update({
          where: { id: slot.id },
          data: {
            userId: null,
            status: SlotStatus.FREE
          }
        });
      }

      // Audit log
      await tx.auditLog.create({
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

      return { absence, slotFreed: !!slot };
    });

    if (slot) {
      logger.info('Slot freed due to absence', { slotId: slot.id, userId });
    }
    logger.info('Absence marked', { eventId, userId });

    return result;
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

  // Eliminar escuadra (soft delete con cascade manual)
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

    // Cascade: soft-delete los slots antes de la escuadra
    // El middleware convierte deleteMany → updateMany con deletedAt
    await prisma.slot.deleteMany({
      where: { squadId }
    });

    // Soft-delete la escuadra (middleware convierte delete → update con deletedAt)
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

  async adminAssignSlot(slotId: string, userId: string, assignedBy: string) {
    const { result, hadExistingSlot, existingSlotId } = await prisma.$transaction(async (tx) => {
      // Leer slot con información completa (snapshot dentro de la transacción)
      const slot = await tx.slot.findUnique({
        where: { id: slotId },
        include: {
          squad: {
            include: {
              event: true,
            },
          },
        },
      });

      if (!slot) {
        throw new Error('Slot no encontrado');
      }

      // Verificar que el evento no esté finalizado ni inactivo (fail fast)
      if (slot.squad.event.status === 'FINISHED') {
        throw new Error('No se puede asignar usuarios a un evento finalizado');
      }
      if (slot.squad.event.status === 'INACTIVE') {
        throw new Error('No se puede asignar usuarios a un evento inactivo');
      }

      // Verificar que el usuario existe y está activo
      const user = await tx.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new Error('Usuario no encontrado');
      }

      if (user.status !== 'ACTIVE') {
        throw new Error('El usuario no está activo');
      }

      // Verificar reserva de clan en la escuadra
      // adminAssignSlot es llamado por ADMIN y CLAN_LEADER
      // ADMIN puede forzar, CLAN_LEADER no puede asignar a escuadra reservada de otro clan
      if (slot.squad.reservedForClanId && user.clanId !== slot.squad.reservedForClanId) {
        // Verificar quién está haciendo la asignación
        const assigner = await tx.user.findUnique({
          where: { id: assignedBy },
          select: { role: true }
        });
        if (assigner?.role !== UserRole.ADMIN) {
          throw new Error('Esta escuadra está reservada para otro clan');
        }
      }

      // Buscar si el usuario ya tiene un slot en este evento
      const existingSlot = await tx.slot.findFirst({
        where: {
          userId: userId,
          squad: {
            eventId: slot.squad.eventId,
          },
        },
      });

      // Bloquear todos los slots afectados en orden determinista (evita deadlocks)
      const slotsToLock = [slotId];
      if (existingSlot && existingSlot.id !== slotId) {
        slotsToLock.push(existingSlot.id);
      }
      slotsToLock.sort();

      for (const lockId of slotsToLock) {
        await tx.$queryRaw`SELECT id FROM "Slot" WHERE id = ${lockId} FOR UPDATE`;
      }

      // Re-verificar estado del slot después de adquirir el bloqueo
      const lockedSlot = await tx.slot.findUnique({
        where: { id: slotId },
        select: { status: true },
      });

      if (!lockedSlot || lockedSlot.status !== 'FREE') {
        throw new Error('El slot ya está ocupado');
      }

      // Liberar el slot anterior si existe
      if (existingSlot && existingSlot.id !== slotId) {
        await tx.slot.update({
          where: { id: existingSlot.id },
          data: {
            userId: null,
            status: 'FREE',
          },
        });
      }

      // Asignar el nuevo slot
      const updatedSlot = await tx.slot.update({
        where: { id: slotId },
        data: {
          userId: userId,
          status: 'OCCUPIED',
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
      });

      // Registrar en audit log dentro de la transacción
      await tx.auditLog.create({
        data: {
          action: existingSlot ? 'SLOT_MOVED' : 'SLOT_ADMIN_ASSIGNED',
          entity: 'SLOT',
          entityId: slotId,
          userId: assignedBy,
          details: JSON.stringify({
            slotId,
            assignedUserId: userId,
            eventId: slot.squad.eventId,
            eventName: slot.squad.event.name,
            ...(existingSlot && { previousSlotId: existingSlot.id }),
          }),
        },
      });

      return {
        result: updatedSlot,
        hadExistingSlot: !!existingSlot,
        existingSlotId: existingSlot?.id,
      };
    });

    logger.info(
      hadExistingSlot ? 'Slot moved by admin/leader' : 'Slot assigned by admin/leader',
      {
        slotId,
        userId,
        assignedBy,
        ...(existingSlotId && { previousSlotId: existingSlotId }),
      }
    );

    return result;
  }

  async adminUnassignSlot(slotId: string, unassignedBy: string) {
    const { updatedSlot, previousUserId } = await prisma.$transaction(async (tx) => {
      // Bloquear la fila del slot para evitar modificaciones concurrentes
      await tx.$queryRaw`SELECT id FROM "Slot" WHERE id = ${slotId} FOR UPDATE`;

      const slot = await tx.slot.findUnique({
        where: { id: slotId },
        include: {
          user: {
            select: {
              id: true,
              nickname: true,
            },
          },
          squad: {
            include: {
              event: {
                select: {
                  id: true,
                  name: true,
                  status: true,
                },
              },
            },
          },
        },
      });

      if (!slot) {
        throw new Error('Slot no encontrado');
      }

      // Verificar que el evento no esté finalizado
      if (slot.squad.event.status === 'FINISHED') {
        throw new Error('No se puede modificar un evento finalizado');
      }

      if (slot.status !== 'OCCUPIED' || !slot.userId) {
        throw new Error('El slot ya está libre');
      }

      const prevUserId = slot.userId;
      const prevUserNickname = slot.user?.nickname;

      // Liberar el slot
      const result = await tx.slot.update({
        where: { id: slotId },
        data: {
          userId: null,
          status: 'FREE',
        },
      });

      // Registrar en audit log dentro de la transacción
      await tx.auditLog.create({
        data: {
          action: 'SLOT_ADMIN_UNASSIGNED',
          entity: 'SLOT',
          entityId: slotId,
          userId: unassignedBy,
          details: JSON.stringify({
            slotId,
            unassignedUserId: prevUserId,
            unassignedUserNickname: prevUserNickname,
            eventId: slot.squad.event.id,
            eventName: slot.squad.event.name,
          }),
        },
      });

      return { updatedSlot: result, previousUserId: prevUserId };
    });

    logger.info('Slot unassigned by admin/leader', {
      slotId,
      unassignedUserId: previousUserId,
      unassignedBy,
    });

    return updatedSlot;
  }

  // Reservar escuadra para un clan
  async reserveSquad(
    squadId: string,
    clanId: string | null,
    requestUserId: string
  ) {
    // Buscar squad con evento
    const squad = await prisma.squad.findUnique({
      where: { id: squadId },
      include: {
        event: {
          include: {
            creator: {
              select: { id: true, clanId: true }
            }
          }
        }
      }
    });

    if (!squad) {
      throw new Error('Escuadra no encontrada');
    }

    // Verificar que el evento esté activo
    if (squad.event.status === EventStatus.FINISHED) {
      throw new Error('No se puede reservar escuadras en un evento finalizado');
    }
    if (squad.event.status === EventStatus.INACTIVE) {
      throw new Error('No se puede reservar escuadras en un evento inactivo');
    }

    // Si clanId no es null, verificar que el clan existe
    if (clanId) {
      const clan = await prisma.clan.findUnique({ where: { id: clanId } });
      if (!clan) {
        throw new Error('Clan no encontrado');
      }
    }

    // Actualizar reserva
    const updatedSquad = await prisma.squad.update({
      where: { id: squadId },
      data: { reservedForClanId: clanId },
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
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        action: clanId ? 'SQUAD_RESERVED' : 'SQUAD_RESERVATION_REMOVED',
        entity: 'Squad',
        entityId: squadId,
        userId: requestUserId,
        eventId: squad.eventId,
        details: JSON.stringify({
          squadName: squad.name,
          clanId,
          clanName: updatedSquad.reservedForClan?.name || null,
        }),
      },
    });

    logger.info(clanId ? 'Squad reserved for clan' : 'Squad reservation removed', {
      squadId,
      clanId,
      userId: requestUserId,
    });

    return updatedSquad;
  }
}

export const slotService = new SlotService();