import { PatientService } from '../services/patient.service.js';
import { PatientExportService } from '../services/patient-export.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { buildPatientExportPdf } from '../utils/pdf.js';

export const create = asyncHandler(async (req, res) => {
    const patient = await PatientService.create(req.user.id, req.validated.body);
    res.status(201).json({
        success: true,
        message: 'Patient created successfully',
        data: patient
    });
});

export const list = asyncHandler(async (req, res) => {
    const result = await PatientService.list(req.user.id, req.validated.query);
    res.json(result);
});

export const search = asyncHandler(async (req, res) => {
    const data = await PatientService.search(req.user, req.validated.query.q);
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

export const restore = asyncHandler(async (req, res) => {
    const patient = await PatientService.restorePatient(req.validated.params.id);
    res.json({
        success: true,
        message: 'Patient restored successfully',
        data: patient
    });
});

export const permanentRemove = asyncHandler(async (req, res) => {
    const patient = await PatientService.permanentDelete(req.user.id, req.validated.params.id);
    res.json({
        success: true,
        message: 'Patient permanently anonymized',
        data: {
            id: patient.id,
            anonymizedAt: patient.anonymizedAt
        }
    });
});

export const exportData = asyncHandler(async (req, res) => {
    const { id } = req.validated.params;
    const { format } = req.validated.query;

    const payload = await PatientExportService.exportPatientData({
        actorUser: req.user,
        patientId: id,
        format
    });

    if (format === 'pdf') {
        const doc = buildPatientExportPdf(payload);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=patient-${id}-export.pdf`);
        doc.pipe(res);
        doc.end();
        return;
    }

    res.json({
        success: true,
        data: payload
    });
});
