import { Request, Response } from 'express';
import { attendanceService } from '../services/attendance.service';
import { successResponse, errorResponse } from '../utils/responses';
import { logger } from '../utils/logger';

class AttendanceController {
  // GET /api/events/:id/attendance
  async getEventAttendance(req: Request, res: Response) {
    try {
      if (!req.user) return errorResponse(res, 'No autenticado', 401);

      const eventId = req.params.id as string;
      const result = await attendanceService.getEventAttendance(eventId);

      return successResponse(res, result, 'Asistencia obtenida correctamente');
    } catch (error: any) {
      logger.error('Error in getEventAttendance', error);
      return errorResponse(res, error.message || 'Error al obtener asistencia', 500);
    }
  }

  // POST /api/events/:id/attendance
  async saveEventAttendance(req: Request, res: Response) {
    try {
      if (!req.user) return errorResponse(res, 'No autenticado', 401);

      const eventId = req.params.id as string;
      const { entries } = req.body;

      if (!entries || !Array.isArray(entries) || entries.length === 0) {
        return errorResponse(res, 'Datos de asistencia incompletos', 400);
      }

      // Validate each entry
      const validStatuses = ['PRESENT', 'ABSENT_JUSTIFIED', 'NO_SHOW'];
      for (const entry of entries) {
        if (!entry.userId || !entry.status) {
          return errorResponse(res, 'Cada entrada debe tener userId y status', 400);
        }
        if (!validStatuses.includes(entry.status)) {
          return errorResponse(res, `Estado de asistencia no válido: ${entry.status}`, 400);
        }
      }

      const result = await attendanceService.saveEventAttendance(
        eventId,
        entries,
        req.user.id,
        req.user.role,
        req.user.clanId || null
      );

      const message =
        result.blockedUsers.length > 0
          ? `Asistencia guardada. ${result.blockedUsers.length} usuario(s) bloqueado(s) automáticamente por ausencias reiteradas.`
          : 'Asistencia guardada correctamente';

      return successResponse(res, result, message);
    } catch (error: any) {
      logger.error('Error in saveEventAttendance', error);
      return errorResponse(res, error.message || 'Error al guardar asistencia', 500);
    }
  }

  // GET /api/users/:userId/reliability
  async getUserReliability(req: Request, res: Response) {
    try {
      if (!req.user) return errorResponse(res, 'No autenticado', 401);

      const userId = req.params.userId as string;
      const reliability = await attendanceService.getUserReliability(userId);

      return successResponse(res, { reliability }, 'Fiabilidad obtenida correctamente');
    } catch (error: any) {
      logger.error('Error in getUserReliability', error);
      return errorResponse(res, error.message || 'Error al obtener fiabilidad', 500);
    }
  }
}

export const attendanceController = new AttendanceController();
