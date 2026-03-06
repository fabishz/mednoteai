import { TemplateService } from '../services/template.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const list = asyncHandler(async (_req, res) => {
  const data = await TemplateService.list();
  res.json({ success: true, data });
});

export const create = asyncHandler(async (req, res) => {
  const data = await TemplateService.create(req.validated.body);
  res.status(201).json({
    success: true,
    message: 'Template created successfully',
    data
  });
});

export const update = asyncHandler(async (req, res) => {
  const data = await TemplateService.update(req.validated.params.id, req.validated.body);
  res.json({
    success: true,
    message: 'Template updated successfully',
    data
  });
});

export const remove = asyncHandler(async (req, res) => {
  await TemplateService.delete(req.validated.params.id);
  res.json({
    success: true,
    message: 'Template deleted successfully',
    data: { id: req.validated.params.id }
  });
});
