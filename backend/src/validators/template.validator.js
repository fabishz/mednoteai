import { z } from 'zod';

export const templateIdSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid template ID')
  })
});

export const createTemplateSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Template name must be at least 2 characters').max(120),
    content: z.string().min(1, 'Template content is required').max(50000)
  })
});

export const updateTemplateSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid template ID')
  }),
  body: z.object({
    name: z.string().min(2, 'Template name must be at least 2 characters').max(120).optional(),
    content: z.string().min(1, 'Template content is required').max(50000).optional()
  }).refine((value) => Object.keys(value).length > 0, {
    message: 'At least one field must be provided for update'
  })
});
