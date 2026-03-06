import { z } from 'zod';

export const createPatientSchema = z.object({
    body: z.object({
        fullName: z.string().min(2, 'Full name must be at least 2 characters'),
        age: z.number().int().min(0).max(130, 'Age must be between 0 and 130'),
        gender: z.enum(['male', 'female', 'other'], { errorMap: () => ({ message: 'Gender must be male, female, or other' }) }),
        phone: z.string().min(5, 'Phone number must be at least 5 characters')
    })
});

export const patientIdSchema = z.object({
    params: z.object({
        id: z.string().uuid('Invalid patient ID')
    })
});

export const updatePatientSchema = z.object({
    params: z.object({
        id: z.string().uuid('Invalid patient ID')
    }),
    body: z.object({
        fullName: z.string().min(2, 'Full name must be at least 2 characters').optional(),
        age: z.number().int().min(0).max(130, 'Age must be between 0 and 130').optional(),
        gender: z.enum(['male', 'female', 'other'], { errorMap: () => ({ message: 'Gender must be male, female, or other' }) }).optional(),
        phone: z.string().min(5, 'Phone number must be at least 5 characters').optional()
    }).refine((value) => Object.keys(value).length > 0, {
        message: 'At least one field must be provided for update'
    })
});

export const listPatientsSchema = z.object({
    query: z.object({
        page: z.preprocess((val) => Number(val || 1), z.number().int().min(1)).default(1),
        limit: z.preprocess((val) => Number(val || 20), z.number().int().min(1).max(100)).default(20)
    })
});
