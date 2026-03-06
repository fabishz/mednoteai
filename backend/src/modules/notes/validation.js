import { z } from 'zod';

export const generateSchema = z.object({
  body: z.object({
    patientId: z.string().uuid(),
    rawInputText: z.string().min(10)
  })
});

export const noteIdSchema = z.object({
  params: z.object({
    id: z.string().uuid()
  })
});
