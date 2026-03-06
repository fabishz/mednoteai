/**
 * src/services/notes.ts
 * 
 * Notes service for API integration
 * Handles note generation, retrieval, and management
 */

import { apiClient, ApiError } from './api/client';

export interface Note {
  id: string;
  patientId: string;
  patientName?: string;
  structuredOutput: {
    subjective?: string;
    objective?: string;
    assessment?: string;
    plan?: string;
  };
  rawInput: string;
  createdAt: string;
  updatedAt: string;
}

export interface GenerateNoteRequest {
  patientId?: string;
  rawInput: string;
  noteType?: 'SOAP' | 'Progress' | 'Admission' | 'Discharge';
}

export interface PaginatedNotes {
  data: Note[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export class NotesService {
  /**
   * Generate a new AI clinical note from raw input
   */
  async generateNote(request: GenerateNoteRequest): Promise<Note> {
    try {
      const response = await apiClient.post<any>('/notes/generate', request);
      return response.data.data;
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(error.message || 'Note generation failed');
      }
      throw error;
    }
  }

  /**
   * Get paginated list of notes
   */
  async getNotes(page: number = 1, limit: number = 20, patientId?: string): Promise<PaginatedNotes> {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      
      if (patientId) {
        params.append('patientId', patientId);
      }

      const response = await apiClient.get<any>(`/notes?${params.toString()}`);
      return response.data;
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(error.message || 'Failed to fetch notes');
      }
      throw error;
    }
  }

  /**
   * Get a single note by ID
   */
  async getNoteById(noteId: string): Promise<Note> {
    try {
      const response = await apiClient.get<any>(`/notes/${noteId}`);
      return response.data.data;
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(error.message || 'Failed to fetch note');
      }
      throw error;
    }
  }

  /**
   * Download note as PDF
   */
  async downloadNotePdf(noteId: string): Promise<Blob> {
    try {
      const response = await apiClient.get<any>(`/notes/${noteId}/pdf`, {
        responseType: 'blob',
      });
      return response.data;
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(error.message || 'Failed to download PDF');
      }
      throw error;
    }
  }
}

export const notesService = new NotesService();
