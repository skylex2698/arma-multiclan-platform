import { prisma } from '../index';
import { logger } from '../utils/logger';
import { AttendanceStatus, EventStatus, UserRole } from '@prisma/client';

class AttendanceService {
  /**
   * Get attendance records for a finished event.
   * If records already exist, return them.
   * If not, pre-populate from occupied slots + existing absences.
   */
  async getEventAttendance(eventId: string) {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        squads: {
          where: { deletedAt: null },
          include: {
            slots: {
              where: { status: 'OCCUPIED', deletedAt: null },
              include: {
                user: {
                  select: {
                    id: true,
                    nickname: true,
                    clanId: true,
                    avatarUrl: true,
                    clan: { select: { id: true, name: true, tag: true } },
                  },
                },
              },
            },
          },
          orderBy: { order: 'asc' },
        },
        absences: true,
        attendances: {
          include: {
            user: {
              select: {
                id: true,
                nickname: true,
                clanId: true,
                avatarUrl: true,
                clan: { select: { id: true, name: true, tag: true } },
              },
            },
          },
        },
      },
    });

    if (!event) throw new Error('Evento no encontrado');
    if (event.status !== EventStatus.FINISHED) {
      throw new Error('Solo se puede ver la asistencia de eventos finalizados');
    }

    // If attendance records already exist, return them
    if (event.attendances.length > 0) {
      return {
        attendances: event.attendances,
        summary: this.calculateSummary(event.attendances),
      };
    }

    // Pre-populate from occupied slots + absence records
    const absenceUserIds = new Set(event.absences.map((a) => a.userId));
    const prePopulated = [];

    for (const squad of event.squads) {
      for (const slot of squad.slots) {
        if (slot.user) {
          prePopulated.push({
            userId: slot.user.id,
            user: slot.user,
            slotId: slot.id,
            squadName: squad.name,
            slotRole: slot.role,
            status: absenceUserIds.has(slot.user.id) ? ('ABSENT_JUSTIFIED' as const) : null,
            note: null,
          });
        }
      }
    }

    return {
      attendances: [],
      prePopulated,
      summary: null,
    };
  }

  /**
   * Bulk save/update attendance for a finished event.
   */
  async saveEventAttendance(
    eventId: string,
    entries: Array<{
      userId: string;
      status: AttendanceStatus;
      slotId?: string | null;
      note?: string;
    }>,
    markedBy: string,
    markerRole: UserRole,
    markerClanId: string | null
  ) {
    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) throw new Error('Evento no encontrado');
    if (event.status !== EventStatus.FINISHED) {
      throw new Error('Solo se puede registrar asistencia en eventos finalizados');
    }

    // ClanLeader can only mark their own clan members
    if (markerRole === UserRole.CLAN_LEADER && markerClanId) {
      const userIds = entries.map((e) => e.userId);
      const users = await prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, clanId: true },
      });
      const nonClanUsers = users.filter((u) => u.clanId !== markerClanId);
      if (nonClanUsers.length > 0) {
        throw new Error('Solo puedes marcar asistencia de miembros de tu clan');
      }
    }

    const result = await prisma.$transaction(async (tx) => {
      const savedAttendances = [];
      const noShowUserIds: string[] = [];

      for (const entry of entries) {
        const attendance = await tx.attendance.upsert({
          where: {
            userId_eventId: {
              userId: entry.userId,
              eventId,
            },
          },
          update: {
            status: entry.status,
            slotId: entry.slotId ?? null,
            note: entry.note ?? null,
            markedBy,
          },
          create: {
            userId: entry.userId,
            eventId,
            status: entry.status,
            slotId: entry.slotId ?? null,
            note: entry.note ?? null,
            markedBy,
          },
          include: {
            user: {
              select: {
                id: true,
                nickname: true,
                clanId: true,
                avatarUrl: true,
                clan: { select: { id: true, name: true, tag: true } },
              },
            },
          },
        });

        savedAttendances.push(attendance);

        if (entry.status === AttendanceStatus.NO_SHOW) {
          noShowUserIds.push(entry.userId);
        }
      }

      // Auto-block check for NO_SHOW users
      const blockedUsers: string[] = [];
      for (const userId of noShowUserIds) {
        const blocked = await this.checkAndAutoBlock(tx, userId, eventId);
        if (blocked) blockedUsers.push(userId);
      }

      // Audit log
      await tx.auditLog.create({
        data: {
          action: 'ATTENDANCE_RECORDED',
          entity: 'Event',
          entityId: eventId,
          userId: markedBy,
          eventId,
          details: JSON.stringify({
            entriesCount: entries.length,
            present: entries.filter((e) => e.status === 'PRESENT').length,
            noShow: entries.filter((e) => e.status === 'NO_SHOW').length,
            justifiedAbsent: entries.filter((e) => e.status === 'ABSENT_JUSTIFIED').length,
            blockedUsers,
          }),
        },
      });

      return { attendances: savedAttendances, blockedUsers };
    });

    logger.info('Attendance recorded', {
      eventId,
      markedBy,
      count: entries.length,
      blockedUsers: result.blockedUsers,
    });

    return {
      attendances: result.attendances,
      summary: this.calculateSummary(result.attendances),
      blockedUsers: result.blockedUsers,
    };
  }

  /**
   * Check if user has 3+ NO_SHOW in their last 10 attended events.
   * If so, set blockedUntil = now + 7 days.
   */
  private async checkAndAutoBlock(
    tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
    userId: string,
    currentEventId: string
  ): Promise<boolean> {
    const recentAttendances = await tx.attendance.findMany({
      where: { userId },
      include: {
        event: { select: { scheduledDate: true } },
      },
      orderBy: { event: { scheduledDate: 'desc' } },
      take: 10,
    });

    const noShowCount = recentAttendances.filter(
      (a) => a.status === AttendanceStatus.NO_SHOW
    ).length;

    if (noShowCount >= 3) {
      const blockedUntil = new Date();
      blockedUntil.setDate(blockedUntil.getDate() + 7);

      await tx.user.update({
        where: { id: userId },
        data: { blockedUntil },
      });

      await tx.auditLog.create({
        data: {
          action: 'USER_AUTO_BLOCKED',
          entity: 'User',
          entityId: userId,
          userId,
          details: JSON.stringify({
            reason: `${noShowCount} no-shows en últimos 10 eventos`,
            blockedUntil: blockedUntil.toISOString(),
            triggerEventId: currentEventId,
          }),
        },
      });

      logger.warn('User auto-blocked for no-shows', {
        userId,
        noShowCount,
        blockedUntil,
      });

      return true;
    }

    return false;
  }

  /**
   * Calculate reliability score for a user.
   * Formula: PRESENT / (PRESENT + NO_SHOW) * 100
   * Justified absences don't penalize.
   */
  async getUserReliability(userId: string) {
    const attendances = await prisma.attendance.findMany({
      where: { userId },
      select: { status: true },
    });

    const present = attendances.filter((a) => a.status === AttendanceStatus.PRESENT).length;
    const noShow = attendances.filter((a) => a.status === AttendanceStatus.NO_SHOW).length;
    const justifiedAbsent = attendances.filter(
      (a) => a.status === AttendanceStatus.ABSENT_JUSTIFIED
    ).length;
    const denominator = present + noShow;
    const score = denominator > 0 ? Math.round((present / denominator) * 100) : null;

    // Recent no-shows for last 10 events
    const recentAttendances = await prisma.attendance.findMany({
      where: { userId },
      include: { event: { select: { scheduledDate: true } } },
      orderBy: { event: { scheduledDate: 'desc' } },
      take: 10,
    });
    const recentNoShows = recentAttendances.filter(
      (a) => a.status === AttendanceStatus.NO_SHOW
    ).length;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { blockedUntil: true },
    });

    return {
      userId,
      totalEvents: attendances.length,
      present,
      noShow,
      justifiedAbsent,
      score,
      recentNoShows,
      blockedUntil: user?.blockedUntil || null,
    };
  }

  /**
   * Get reliability scores for multiple users (batch).
   */
  async getBulkReliability(userIds: string[]) {
    const attendances = await prisma.attendance.groupBy({
      by: ['userId', 'status'],
      where: { userId: { in: userIds } },
      _count: { status: true },
    });

    const map = new Map<string, { present: number; noShow: number; justified: number }>();
    for (const row of attendances) {
      if (!map.has(row.userId)) {
        map.set(row.userId, { present: 0, noShow: 0, justified: 0 });
      }
      const entry = map.get(row.userId)!;
      if (row.status === AttendanceStatus.PRESENT) entry.present = row._count.status;
      else if (row.status === AttendanceStatus.NO_SHOW) entry.noShow = row._count.status;
      else if (row.status === AttendanceStatus.ABSENT_JUSTIFIED)
        entry.justified = row._count.status;
    }

    const results: Record<string, number | null> = {};
    for (const uid of userIds) {
      const entry = map.get(uid);
      if (!entry) {
        results[uid] = null;
        continue;
      }
      const denom = entry.present + entry.noShow;
      results[uid] = denom > 0 ? Math.round((entry.present / denom) * 100) : null;
    }

    return results;
  }

  private calculateSummary(
    attendances: Array<{ status: AttendanceStatus | string }>
  ) {
    return {
      present: attendances.filter((a) => a.status === 'PRESENT').length,
      noShow: attendances.filter((a) => a.status === 'NO_SHOW').length,
      justifiedAbsent: attendances.filter((a) => a.status === 'ABSENT_JUSTIFIED').length,
      total: attendances.length,
    };
  }
}

export const attendanceService = new AttendanceService();
