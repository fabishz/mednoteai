/**
 * src/services/patients.ts
 * 
 * Patients service for API integration
 * Handles patient CRUD operations and management
 */

import { apiClient, ApiError } from './api/client';

export interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: 'male' | 'female' | 'other';
  email?: string;
  phone?: string;
  address?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
  emergencyContact?: {
    name: string;
    relationship: string;
    phone: string;
  };
  medicalRecordNumber?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePatientRequest {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: 'male' | 'female' | 'other';
  email?: string;
  phone?: string;
  address?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
  emergencyContact?: {
    name: string;
    relationship: string;
    phone: string;
  };
  medicalRecordNumber?: string;
}

export interface PaginatedPatients {
  patients: Patient[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export class PatientsService {
  /**
   * Create a new patient
   */
  async createPatient(data: CreatePatientRequest): Promise<Patient> {
    try {
      const response = await apiClient.post<any>('/patients', data);
      return response.data.data;
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(error.message || 'Failed to create patient');
      }
      throw error;
    }
  }

  /**
   * Get paginated list of patients
   */
  async getPatients(page: number = 1, limit: number = 10): Promise<PaginatedPatients> {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });

      const response = await apiClient.get<any>(`/patients?${params.toString()}`);
      return response.data.data;
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(error.message || 'Failed to fetch patients');
      }
      throw error;
    }
  }

  /**
   * Get a single patient by ID
   */
  async getPatientById(patientId: string): Promise<Patient> {
    try {
      const response = await apiClient.get<any>(`/patients/${patientId}`);
      return response.data.data;
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(error.message || 'Failed to fetch patient');
      }
      throw error;
    }
  }

  /**
   * Delete a patient (soft delete)
   */
  async deletePatient(patientId: string): Promise<void> {
    try {
      await apiClient.delete<any>(`/patients/${patientId}`);
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(error.message || 'Failed to delete patient');
      }
      throw error;
    }
  }

  /**
   * Search patients by name or MRN
   */
  async searchPatients(query: string): Promise<Patient[]> {
    try {
      const response = await apiClient.get<any>(`/patients/search?q=${encodeURIComponent(query)}`);
      return response.data.data;
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(error.message || 'Failed to search patients');
      }
      throw error;
    }
  }
}

export const patientsService = new PatientsService();
