import { z } from 'zod';

export const updateRetentionPolicySchema = z.object({
  body: z.object({
    patientRecordRetentionYears: z.number().int().min(1).max(50),
    auditLogRetentionYears: z.number().int().min(1).max(50)
  })
});
