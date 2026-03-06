import { z } from 'zod';

export const generateNoteSchema = z.object({
    body: z.object({
        patientId: z.string().uuid('Invalid patient ID'),
        rawInputText: z.string().min(10, 'Input text must be at least 10 characters')
    })
});

export const noteIdSchema = z.object({
    params: z.object({
        id: z.string().uuid('Invalid note ID')
    })
});

export const listNotesSchema = z.object({
    query: z.object({
        page: z.preprocess((val) => Number(val || 1), z.number().int().min(1)).default(1),
        limit: z.preprocess((val) => Number(val || 20), z.number().int().min(1).max(100)).default(20),
        patientId: z.string().uuid().optional()
    })
});
