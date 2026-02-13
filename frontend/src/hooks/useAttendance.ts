import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { attendanceService } from '../services/attendanceService';
import type { AttendanceStatus } from '../types';

export function useEventAttendance(eventId: string) {
  return useQuery({
    queryKey: ['attendance', eventId],
    queryFn: () => attendanceService.getEventAttendance(eventId),
    enabled: !!eventId,
  });
}

export function useSaveAttendance(eventId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (
      entries: Array<{
        userId: string;
        status: AttendanceStatus;
        slotId?: string | null;
        note?: string;
      }>
    ) => attendanceService.saveEventAttendance(eventId, entries),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance', eventId] });
      queryClient.invalidateQueries({ queryKey: ['event', eventId] });
    },
  });
}

export function useUserReliability(userId: string) {
  return useQuery({
    queryKey: ['reliability', userId],
    queryFn: () => attendanceService.getUserReliability(userId),
    enabled: !!userId,
  });
}
