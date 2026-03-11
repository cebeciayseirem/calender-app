import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from '@/lib/api-client';
import type { EventFormData } from '@/types/event';

export function useEvents(start: string, end: string) {
  return useQuery({
    queryKey: ['events', start, end],
    queryFn: () => api.fetchEvents(start, end),
    enabled: !!start && !!end,
  });
}

export function useSearchEvents(query: string) {
  return useQuery({
    queryKey: ['events', 'search', query],
    queryFn: () => api.searchEvents(query),
    enabled: !!query,
  });
}

export function useCreateEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: EventFormData) => api.createEvent(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
  });
}

export function useUpdateEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: EventFormData }) =>
      api.updateEvent(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
  });
}

export function useDeleteEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteEvent(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
  });
}
