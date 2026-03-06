import { asyncHandler } from '../utils/asyncHandler.js';
import { RetentionService } from '../services/retention.service.js';

export const getPolicy = asyncHandler(async (req, res) => {
  const policy = await RetentionService.getPolicy(req.user);
  res.json({ success: true, data: policy });
});

export const updatePolicy = asyncHandler(async (req, res) => {
  const policy = await RetentionService.updatePolicy(req.user, req.validated.body);
  res.json({
    success: true,
    message: 'Retention policy updated successfully',
    data: policy
  });
});
