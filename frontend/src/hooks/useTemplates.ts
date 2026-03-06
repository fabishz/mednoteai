import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  CreateTemplateRequest,
  Template,
  templatesService,
  UpdateTemplateRequest
} from '@/services/templates';

export const templateKeys = {
  all: ['templates'] as const,
  list: () => [...templateKeys.all, 'list'] as const,
};

export function useTemplates() {
  return useQuery({
    queryKey: templateKeys.list(),
    queryFn: () => templatesService.listTemplates(),
    staleTime: 60 * 1000,
  });
}

export function useCreateTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateTemplateRequest) => templatesService.createTemplate(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: templateKeys.list() });
    }
  });
}

export function useUpdateTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateTemplateRequest }) =>
      templatesService.updateTemplate(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: templateKeys.list() });
    }
  });
}

export function useDeleteTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => templatesService.deleteTemplate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: templateKeys.list() });
    }
  });
}
