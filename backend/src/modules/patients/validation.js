import { z } from 'zod';

export const createPatientSchema = z.object({
  body: z.object({
    fullName: z.string().min(2),
    age: z.number().int().min(0).max(130),
    gender: z.string().min(1),
    phone: z.string().min(5)
  })
});

export const patientIdSchema = z.object({
  params: z.object({
    id: z.string().uuid()
  })
});
