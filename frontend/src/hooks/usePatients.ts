/**
 * src/hooks/usePatients.ts
 * 
 * React Query hooks for patients management
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { patientsService, CreatePatientRequest, Patient, PaginatedPatients } from '@/services/patients';

// Query keys
export const patientKeys = {
  all: ['patients'] as const,
  lists: () => [...patientKeys.all, 'list'] as const,
  list: (filters: { page?: number; limit?: number }) => 
    [...patientKeys.lists(), filters] as const,
  details: () => [...patientKeys.all, 'detail'] as const,
  detail: (id: string) => [...patientKeys.details(), id] as const,
  search: (query: string) => [...patientKeys.all, 'search', query] as const,
};

/**
 * Hook to get paginated list of patients
 */
export function usePatients(page: number = 1, limit: number = 10) {
  return useQuery({
    queryKey: patientKeys.list({ page, limit }),
    queryFn: () => patientsService.getPatients(page, limit),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Hook to get a single patient by ID
 */
export function usePatient(patientId: string) {
  return useQuery({
    queryKey: patientKeys.detail(patientId),
    queryFn: () => patientsService.getPatientById(patientId),
    enabled: !!patientId,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook to create a new patient
 */
export function useCreatePatient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreatePatientRequest) => patientsService.createPatient(data),
    onSuccess: () => {
      // Invalidate patients list to refetch
      queryClient.invalidateQueries({ queryKey: patientKeys.lists() });
    },
  });
}

/**
 * Hook to delete a patient
 */
export function useDeletePatient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (patientId: string) => patientsService.deletePatient(patientId),
    onSuccess: () => {
      // Invalidate patients list to refetch
      queryClient.invalidateQueries({ queryKey: patientKeys.lists() });
    },
  });
}

/**
 * Hook to search patients
 */
export function useSearchPatients(query: string) {
  return useQuery({
    queryKey: patientKeys.search(query),
    queryFn: () => patientsService.searchPatients(query),
    enabled: query.length >= 2, // Only search when query is at least 2 characters
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}
