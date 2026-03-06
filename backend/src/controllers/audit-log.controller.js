import { AuditLogService } from '../services/audit-log.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const list = asyncHandler(async (req, res) => {
  const data = await AuditLogService.list({
    actor: req.user,
    ...req.validated.query
  });

  res.json({
    success: true,
    data
  });
});
