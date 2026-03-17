import { api } from './api';
import type {
  ApiResponse,
  FeedbackItem,
  FeedbackStatus,
  FeedbackType,
} from '../types';

export const feedbackService = {
  create: async (data: {
    type: FeedbackType;
    title: string;
    description: string;
    pagePath?: string;
  }): Promise<{ item: FeedbackItem }> => {
    const response = await api.post<ApiResponse<{ item: FeedbackItem }>>(
      '/feedback',
      data
    );
    return response.data.data;
  },

  getAll: async (filters?: {
    type?: FeedbackType;
    status?: FeedbackStatus;
  }): Promise<{ items: FeedbackItem[]; count: number }> => {
    const params = new URLSearchParams();

    if (filters?.type) {
      params.append('type', filters.type);
    }

    if (filters?.status) {
      params.append('status', filters.status);
    }

    const suffix = params.toString() ? `?${params.toString()}` : '';
    const response = await api.get<
      ApiResponse<{ items: FeedbackItem[]; count: number }>
    >(`/feedback${suffix}`);
    return response.data.data;
  },

  updateStatus: async (
    id: string,
    data: { status: FeedbackStatus; adminNote?: string }
  ): Promise<{ item: FeedbackItem }> => {
    const response = await api.patch<ApiResponse<{ item: FeedbackItem }>>(
      `/feedback/${id}/status`,
      data
    );
    return response.data.data;
  },
};
