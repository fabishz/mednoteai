/**
 * src/services/mockApi.ts
 * 
 * Mock API layer for development and testing
 * Can be enabled via environment variable
 */

import { User } from './auth';
import { Note, PaginatedNotes } from './notes';
import { Patient, PaginatedPatients } from './patients';

// Mock data
const mockUser: User = {
  id: 'usr_001',
  name: 'Dr. Sarah Mitchell',
  email: 'sarah.mitchell@clinic.org',
  clinicName: 'Riverside Medical Group',
};

const mockPatients: Patient[] = [
  {
    id: 'pat_001',
    firstName: 'John',
    lastName: 'Doe',
    dateOfBirth: '1985-03-15',
    gender: 'male',
    email: 'john.doe@email.com',
    phone: '+1-555-0101',
    address: {
      street: '123 Main St',
      city: 'Springfield',
      state: 'IL',
      zipCode: '62701',
    },
    emergencyContact: {
      name: 'Jane Doe',
      relationship: 'Spouse',
      phone: '+1-555-0102',
    },
    medicalRecordNumber: 'MRN-001',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'pat_002',
    firstName: 'Emily',
    lastName: 'Johnson',
    dateOfBirth: '1992-07-22',
    gender: 'female',
    email: 'emily.johnson@email.com',
    phone: '+1-555-0201',
    medicalRecordNumber: 'MRN-002',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const mockNotes: Note[] = [
  {
    id: 'note_001',
    patientId: 'pat_001',
    patientName: 'John Doe',
    structuredOutput: {
      subjective: 'Patient presents with persistent headaches for 2 weeks. No associated fever or visual changes.',
      objective: 'Vital signs stable. Neurological exam normal. No focal deficits.',
      assessment: 'Tension-type headache, likely stress-related',
      plan: '1. OTC pain management\n2. Stress reduction techniques\n3. Follow up in 2 weeks if no improvement',
    },
    rawInput: 'Patient has been having headaches for 2 weeks...',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// Simulate network delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Mock API functions
export const mockApi = {
  auth: {
    login: async (email: string, password: string) => {
      await delay(800);
      if (email && password.length >= 6) {
        return {
          user: mockUser,
          accessToken: 'mock_access_token_' + Date.now(),
          refreshToken: 'mock_refresh_token_' + Date.now(),
          expiresIn: 3600,
        };
      }
      throw new Error('Invalid credentials');
    },

    register: async (data: { name: string; email: string; password: string; clinicName: string }) => {
      await delay(1000);
      return {
        user: { ...mockUser, name: data.name, email: data.email, clinicName: data.clinicName },
        accessToken: 'mock_access_token_' + Date.now(),
        refreshToken: 'mock_refresh_token_' + Date.now(),
        expiresIn: 3600,
      };
    },

    getCurrentUser: async () => {
      await delay(300);
      return mockUser;
    },

    logout: async () => {
      await delay(200);
    },
  },

  patients: {
    getPatients: async (page: number = 1, limit: number = 10): Promise<PaginatedPatients> => {
      await delay(500);
      const start = (page - 1) * limit;
      const end = start + limit;
      const patients = mockPatients.slice(start, end);
      
      return {
        patients,
        pagination: {
          page,
          limit,
          total: mockPatients.length,
          pages: Math.ceil(mockPatients.length / limit),
        },
      };
    },

    getPatientById: async (id: string): Promise<Patient> => {
      await delay(300);
      const patient = mockPatients.find(p => p.id === id);
      if (!patient) throw new Error('Patient not found');
      return patient;
    },

    createPatient: async (data: Omit<Patient, 'id' | 'createdAt' | 'updatedAt'>): Promise<Patient> => {
      await delay(600);
      const newPatient: Patient = {
        ...data,
        id: 'pat_' + Date.now(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      mockPatients.push(newPatient);
      return newPatient;
    },

    deletePatient: async (id: string): Promise<void> => {
      await delay(400);
      const index = mockPatients.findIndex(p => p.id === id);
      if (index !== -1) mockPatients.splice(index, 1);
    },
  },

  notes: {
    getNotes: async (page: number = 1, limit: number = 10, patientId?: string): Promise<PaginatedNotes> => {
      await delay(500);
      let filtered = mockNotes;
      if (patientId) {
        filtered = mockNotes.filter(n => n.patientId === patientId);
      }
      
      const start = (page - 1) * limit;
      const end = start + limit;
      const notes = filtered.slice(start, end);
      
      return {
        notes,
        pagination: {
          page,
          limit,
          total: filtered.length,
          pages: Math.ceil(filtered.length / limit),
        },
      };
    },

    getNoteById: async (id: string): Promise<Note> => {
      await delay(300);
      const note = mockNotes.find(n => n.id === id);
      if (!note) throw new Error('Note not found');
      return note;
    },

    generateNote: async (data: { rawInput: string; patientId?: string }): Promise<Note> => {
      await delay(2000); // Simulate AI processing time
      const newNote: Note = {
        id: 'note_' + Date.now(),
        patientId: data.patientId || 'pat_001',
        structuredOutput: {
          subjective: 'AI-generated subjective based on: ' + data.rawInput.substring(0, 50) + '...',
          objective: 'AI-generated objective assessment',
          assessment: 'AI-generated assessment',
          plan: 'AI-generated plan',
        },
        rawInput: data.rawInput,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      mockNotes.push(newNote);
      return newNote;
    },
  },
};

// Check if mock API should be used
export function shouldUseMockApi(): boolean {
  return import.meta.env.VITE_ENABLE_MOCK_API === 'true';
}
