import { generateNote, getNote } from './service.js';
import { buildNotePdf } from '../../utils/pdf.js';

export async function generate(req, res, next) {
  try {
    const note = await generateNote(req.user.id, req.validated.body);
    res.status(201).json({ success: true, data: { id: note.id, structuredOutput: note.structuredOutput } });
  } catch (err) {
    next(err);
  }
}

export async function pdf(req, res, next) {
  try {
    const note = await getNote(req.user.id, req.validated.params.id);
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
  } catch (err) {
    next(err);
  }
}
