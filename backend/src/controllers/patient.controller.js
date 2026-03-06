import { PatientService } from '../services/patient.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const create = asyncHandler(async (req, res) => {
    const patient = await PatientService.create(req.user.id, req.validated.body);
    res.status(201).json({
        success: true,
        message: 'Patient created successfully',
        data: patient
    });
});

export const list = asyncHandler(async (req, res) => {
    const data = await PatientService.list(req.user.id, req.validated.query);
    res.json({
        success: true,
        data
    });
});

export const getById = asyncHandler(async (req, res) => {
    const patient = await PatientService.getById(req.validated.params.id);
    res.json({
        success: true,
        data: patient
    });
});

export const update = asyncHandler(async (req, res) => {
    const patient = await PatientService.update(req.user.id, req.validated.params.id, req.validated.body);
    res.json({
        success: true,
        message: 'Patient updated successfully',
        data: patient
    });
});

export const remove = asyncHandler(async (req, res) => {
    await PatientService.delete(req.user.id, req.validated.params.id);
    res.json({
        success: true,
        message: 'Patient deleted successfully',
        data: { id: req.validated.params.id }
    });
});
