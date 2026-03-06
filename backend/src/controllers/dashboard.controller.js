import { DashboardService } from '../services/dashboard.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const stats = asyncHandler(async (req, res) => {
  if (!req.user?.clinicId) {
    throw Object.assign(new Error('Missing clinic context'), { status: 400, code: 'BAD_REQUEST' });
  }

  const data = await DashboardService.getStats(req.user.clinicId);
  res.json({
    success: true,
    data,
  });
});
