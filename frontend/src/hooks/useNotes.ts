/**
 * src/hooks/useNotes.ts
 * 
 * React Query hooks for notes management
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notesService, GenerateNoteRequest, Note, PaginatedNotes } from '@/services/notes';

// Query keys
export const noteKeys = {
  all: ['notes'] as const,
  lists: () => [...noteKeys.all, 'list'] as const,
  list: (filters: { page?: number; limit?: number; patientId?: string }) => 
    [...noteKeys.lists(), filters] as const,
  details: () => [...noteKeys.all, 'detail'] as const,
  detail: (id: string) => [...noteKeys.details(), id] as const,
};

/**
 * Hook to get paginated list of notes
 */
export function useNotes(page: number = 1, limit: number = 10, patientId?: string) {
  return useQuery({
    queryKey: noteKeys.list({ page, limit, patientId }),
    queryFn: () => notesService.getNotes(page, limit, patientId),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
  });
}

/**
 * Hook to get a single note by ID
 */
export function useNote(noteId: string) {
  return useQuery({
    queryKey: noteKeys.detail(noteId),
    queryFn: () => notesService.getNoteById(noteId),
    enabled: !!noteId,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook to generate a new AI note
 */
export function useGenerateNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: GenerateNoteRequest) => notesService.generateNote(request),
    onSuccess: () => {
      // Invalidate notes list to refetch
      queryClient.invalidateQueries({ queryKey: noteKeys.lists() });
    },
  });
}

/**
 * Hook to download note as PDF
 */
export function useDownloadNotePdf() {
  return useMutation({
    mutationFn: (noteId: string) => notesService.downloadNotePdf(noteId),
  });
}
