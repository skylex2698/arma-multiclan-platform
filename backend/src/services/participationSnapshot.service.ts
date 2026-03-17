import { AttendanceStatus, Prisma, UserStatus } from '@prisma/client';

type TransactionClient = Prisma.TransactionClient;

class ParticipationSnapshotService {
  async upsertEventSnapshots(tx: TransactionClient, eventId: string) {
    const event = await tx.event.findUnique({
      where: { id: eventId },
      select: {
        id: true,
        name: true,
        scheduledDate: true,
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

    const clanId = event.creator?.clanId;
    if (!clanId) {
      await tx.participationSnapshot.deleteMany({
        where: { eventId },
      });

      return {
        clanId: null,
        eligibleSnapshotCount: 0,
      };
    }

    const attendances = await tx.attendance.findMany({
      where: { eventId },
      include: {
        user: {
          select: {
            id: true,
            nickname: true,
            clanId: true,
            status: true,
          },
        },
      },
    });

    const slotIds = Array.from(
      new Set(
        attendances
          .map((attendance) => attendance.slotId)
          .filter((slotId): slotId is string => Boolean(slotId))
      )
    );

    const slots = slotIds.length
      ? await tx.slot.findMany({
          where: {
            id: {
              in: slotIds,
            },
          },
          select: {
            id: true,
            role: true,
            squad: {
              select: {
                name: true,
              },
            },
          },
        })
      : [];

    const slotMap = new Map(
      slots.map((slot) => [
        slot.id,
        {
          role: slot.role,
          squadName: slot.squad.name,
        },
      ])
    );

    const eligibleAttendances = attendances.filter(
      (attendance) =>
        attendance.user.clanId === clanId && attendance.user.status === UserStatus.ACTIVE
    );

    const eligibleUserIds = eligibleAttendances.map((attendance) => attendance.userId);

    await tx.participationSnapshot.deleteMany({
      where: {
        clanId,
        eventId,
        ...(eligibleUserIds.length > 0
          ? {
              userId: {
                notIn: eligibleUserIds,
              },
            }
          : {}),
      },
    });

    for (const attendance of eligibleAttendances) {
      const slotInfo = attendance.slotId ? slotMap.get(attendance.slotId) : null;
      const isExportable = attendance.status === AttendanceStatus.PRESENT;

      await tx.participationSnapshot.upsert({
        where: {
          clanId_eventId_userId: {
            clanId,
            eventId,
            userId: attendance.userId,
          },
        },
        create: {
          clanId,
          eventId,
          userId: attendance.userId,
          userNickname: attendance.user.nickname,
          eventName: event.name,
          eventDate: event.scheduledDate,
          attendanceStatus: attendance.status,
          slotRole: slotInfo?.role ?? null,
          squadName: slotInfo?.squadName ?? null,
          exportedToNotion: false,
          exportedToNotionAt: null,
          notionLastSyncAt: null,
          notionLastError: null,
        },
        update: {
          userNickname: attendance.user.nickname,
          eventName: event.name,
          eventDate: event.scheduledDate,
          attendanceStatus: attendance.status,
          slotRole: slotInfo?.role ?? null,
          squadName: slotInfo?.squadName ?? null,
          exportedToNotion: false,
          exportedToNotionAt: null,
          notionLastSyncAt: null,
          notionLastError: null,
        },
      });

      if (!isExportable) {
        continue;
      }
    }

    return {
      clanId,
      eligibleSnapshotCount: eligibleAttendances.length,
    };
  }
}

export const participationSnapshotService = new ParticipationSnapshotService();
