import { api } from './api';
import type {
  ApiResponse,
  AttendanceResponse,
  SaveAttendanceResponse,
  AttendanceStatus,
  NotionSyncSummary,
  ReliabilityScore,
} from '../types';

export const attendanceService = {
  // Get attendance for a finished event
  getEventAttendance: async (eventId: string): Promise<AttendanceResponse> => {
    const response = await api.get<ApiResponse<AttendanceResponse>>(
      `/events/${eventId}/attendance`
    );
    return response.data.data;
  },

  // Save/update attendance (bulk)
  saveEventAttendance: async (
    eventId: string,
    entries: Array<{
      userId: string;
      status: AttendanceStatus;
      slotId?: string | null;
      note?: string;
    }>
  ): Promise<SaveAttendanceResponse> => {
    const response = await api.post<ApiResponse<SaveAttendanceResponse>>(
      `/events/${eventId}/attendance`,
      { entries }
    );
    return response.data.data;
  },

  syncEventToNotion: async (eventId: string): Promise<NotionSyncSummary> => {
    const response = await api.post<ApiResponse<NotionSyncSummary>>(
      `/events/${eventId}/notion/sync`
    );
    return response.data.data;
  },

  // Get reliability score for a user
  getUserReliability: async (
    userId: string
  ): Promise<{ reliability: ReliabilityScore }> => {
    const response = await api.get<ApiResponse<{ reliability: ReliabilityScore }>>(
      `/users/${userId}/reliability`
    );
    return response.data.data;
  },
};
