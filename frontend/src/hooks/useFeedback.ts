import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { FeedbackStatus, FeedbackType } from '../types';
import { feedbackService } from '../services/feedbackService';

export function useCreateFeedback() {
  return useMutation({
    mutationFn: (data: {
      type: FeedbackType;
      title: string;
      description: string;
      pagePath?: string;
    }) => feedbackService.create(data),
  });
}

export function useFeedbackItems(filters?: {
  type?: FeedbackType;
  status?: FeedbackStatus;
}) {
  return useQuery({
    queryKey: ['feedback', filters],
    queryFn: () => feedbackService.getAll(filters),
  });
}

export function useUpdateFeedbackStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      status,
      adminNote,
    }: {
      id: string;
      status: FeedbackStatus;
      adminNote?: string;
    }) => feedbackService.updateStatus(id, { status, adminNote }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feedback'] });
    },
  });
}
