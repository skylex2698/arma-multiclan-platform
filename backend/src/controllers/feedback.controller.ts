import { FeedbackStatus, FeedbackType } from '@prisma/client';
import type { Request, Response } from 'express';
import { feedbackService } from '../services/feedback.service';
import { errorResponse, successResponse } from '../utils/responses';
import { logger } from '../utils/logger';

const MAX_TITLE_LENGTH = 120;
const MAX_DESCRIPTION_LENGTH = 2000;
const MAX_PAGE_PATH_LENGTH = 500;

const sanitizeText = (value: unknown) =>
  typeof value === 'string' ? value.trim() : '';

export class FeedbackController {
  async createFeedback(req: Request, res: Response) {
    try {
      if (!req.user) {
        return errorResponse(res, 'No autenticado', 401);
      }

      const type = req.body.type as FeedbackType;
      const title = sanitizeText(req.body.title);
      const description = sanitizeText(req.body.description);
      const rawPagePath = sanitizeText(req.body.pagePath);
      const pagePath = rawPagePath || undefined;

      if (!Object.values(FeedbackType).includes(type)) {
        return errorResponse(res, 'Tipo de feedback invalido', 400);
      }

      if (!title) {
        return errorResponse(res, 'El titulo es obligatorio', 400);
      }

      if (title.length > MAX_TITLE_LENGTH) {
        return errorResponse(
          res,
          `El titulo no puede superar ${MAX_TITLE_LENGTH} caracteres`,
          400
        );
      }

      if (!description) {
        return errorResponse(res, 'La descripcion es obligatoria', 400);
      }

      if (description.length > MAX_DESCRIPTION_LENGTH) {
        return errorResponse(
          res,
          `La descripcion no puede superar ${MAX_DESCRIPTION_LENGTH} caracteres`,
          400
        );
      }

      if (pagePath && pagePath.length > MAX_PAGE_PATH_LENGTH) {
        return errorResponse(
          res,
          `La ruta reportada no puede superar ${MAX_PAGE_PATH_LENGTH} caracteres`,
          400
        );
      }

      const item = await feedbackService.createFeedback({
        type,
        title,
        description,
        pagePath,
        userId: req.user.id,
        clanId: req.user.clanId,
      });

      return successResponse(
        res,
        { item },
        'Feedback enviado correctamente',
        201
      );
    } catch (error: any) {
      logger.error('Error in createFeedback', error);
      return errorResponse(
        res,
        error.message || 'Error al enviar feedback',
        500
      );
    }
  }

  async getFeedbackItems(req: Request, res: Response) {
    try {
      const type = req.query.type as FeedbackType | undefined;
      const status = req.query.status as FeedbackStatus | undefined;

      if (type && !Object.values(FeedbackType).includes(type)) {
        return errorResponse(res, 'Tipo de feedback invalido', 400);
      }

      if (status && !Object.values(FeedbackStatus).includes(status)) {
        return errorResponse(res, 'Estado de feedback invalido', 400);
      }

      const result = await feedbackService.getFeedbackItems({ type, status });

      return successResponse(
        res,
        result,
        'Feedback obtenido correctamente'
      );
    } catch (error: any) {
      logger.error('Error in getFeedbackItems', error);
      return errorResponse(
        res,
        error.message || 'Error al obtener feedback',
        500
      );
    }
  }

  async reviewFeedbackItem(req: Request, res: Response) {
    try {
      if (!req.user) {
        return errorResponse(res, 'No autenticado', 401);
      }

      const id = req.params.id as string;
      const status = req.body.status as FeedbackStatus;
      const adminNote = sanitizeText(req.body.adminNote) || null;

      if (!Object.values(FeedbackStatus).includes(status)) {
        return errorResponse(res, 'Estado de feedback invalido', 400);
      }

      if (adminNote && adminNote.length > MAX_DESCRIPTION_LENGTH) {
        return errorResponse(
          res,
          `La nota interna no puede superar ${MAX_DESCRIPTION_LENGTH} caracteres`,
          400
        );
      }

      const item = await feedbackService.reviewFeedbackItem(id, {
        status,
        adminNote,
        reviewedBy: req.user.id,
      });

      return successResponse(
        res,
        { item },
        'Feedback actualizado correctamente'
      );
    } catch (error: any) {
      logger.error('Error in reviewFeedbackItem', error);
      const statusCode = error.message === 'Reporte no encontrado' ? 404 : 500;
      return errorResponse(
        res,
        error.message || 'Error al actualizar feedback',
        statusCode
      );
    }
  }
}

export const feedbackController = new FeedbackController();
