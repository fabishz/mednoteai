import { AIService } from '../services/ai.service.js';
import { NoteService } from '../services/note.service.js';
import { buildNotePdf } from '../utils/pdf.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const generate = asyncHandler(async (req, res) => {
    const note = await AIService.generateNote(req.user.id, req.validated.body);
    res.status(201).json({
        success: true,
        message: 'Note generated successfully',
        data: { id: note.id, structuredOutput: note.structuredOutput }
    });
});

export const list = asyncHandler(async (req, res) => {
    const result = await NoteService.list(req.user.id, req.validated.query);
    res.json(result);
});

export const getById = asyncHandler(async (req, res) => {
    const note = await NoteService.getById(req.user.id, req.validated.params.id);
    res.json({
        success: true,
        data: note
    });
});

export const pdf = asyncHandler(async (req, res) => {
    const note = await NoteService.getById(req.user.id, req.validated.params.id);
    const doc = buildNotePdf({
        clinicName: note.doctor.clinicName,
        doctorName: note.doctor.name,
        createdAt: note.createdAt,
        structuredOutput: note.structuredOutput
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=note-${note.id}.pdf`);

    doc.pipe(res);
    doc.end();
});
