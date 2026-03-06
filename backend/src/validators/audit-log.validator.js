import { z } from 'zod';
import { AuditAction } from '../constants/audit.js';

export const listAuditLogsSchema = z.object({
  query: z.object({
    page: z.preprocess((val) => Number(val || 1), z.number().int().min(1)).default(1),
    limit: z.preprocess((val) => Number(val || 20), z.number().int().min(1).max(100)).default(20),
    userId: z.string().uuid().optional(),
    action: z.enum(Object.values(AuditAction)).optional(),
    dateFrom: z.string().datetime().optional(),
    dateTo: z.string().datetime().optional()
  })
});
