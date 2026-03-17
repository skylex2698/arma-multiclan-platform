import {
  FeedbackStatus,
  FeedbackType,
} from '@prisma/client';
import { prisma } from '../index';

type CreateFeedbackInput = {
  type: FeedbackType;
  title: string;
  description: string;
  pagePath?: string;
  userId: string;
  clanId?: string | null;
};

type FeedbackFilters = {
  type?: FeedbackType;
  status?: FeedbackStatus;
};

type ReviewFeedbackInput = {
  status: FeedbackStatus;
  adminNote?: string | null;
  reviewedBy: string;
};

export class FeedbackService {
  async createFeedback(input: CreateFeedbackInput) {
    return prisma.feedbackItem.create({
      data: {
        type: input.type,
        title: input.title,
        description: input.description,
        pagePath: input.pagePath || null,
        userId: input.userId,
        clanId: input.clanId || null,
      },
      include: {
        user: {
          select: {
            id: true,
            nickname: true,
            email: true,
          },
        },
        clan: {
          select: {
            id: true,
            name: true,
            tag: true,
          },
        },
      },
    });
  }

  async getFeedbackItems(filters: FeedbackFilters = {}) {
    const where = {
      ...(filters.type ? { type: filters.type } : {}),
      ...(filters.status ? { status: filters.status } : {}),
    };

    const items = await prisma.feedbackItem.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            nickname: true,
            email: true,
          },
        },
        clan: {
          select: {
            id: true,
            name: true,
            tag: true,
          },
        },
        reviewer: {
          select: {
            id: true,
            nickname: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return {
      items,
      count: items.length,
    };
  }

  async reviewFeedbackItem(id: string, input: ReviewFeedbackInput) {
    const existing = await prisma.feedbackItem.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existing) {
      throw new Error('Reporte no encontrado');
    }

    return prisma.feedbackItem.update({
      where: { id },
      data: {
        status: input.status,
        adminNote: input.adminNote ?? null,
        reviewedBy: input.reviewedBy,
        reviewedAt: new Date(),
      },
      include: {
        user: {
          select: {
            id: true,
            nickname: true,
            email: true,
          },
        },
        clan: {
          select: {
            id: true,
            name: true,
            tag: true,
          },
        },
        reviewer: {
          select: {
            id: true,
            nickname: true,
          },
        },
      },
    });
  }
}

export const feedbackService = new FeedbackService();
