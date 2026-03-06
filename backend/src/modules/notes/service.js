import { prisma } from '../../config/prisma.js';
import { generateStructuredNote } from '../../utils/aiClient.js';

async function ensurePatient(doctorId, patientId) {
  const patient = await prisma.patient.findFirst({ where: { id: patientId, doctorId } });
  if (!patient) {
    throw Object.assign(new Error('Patient not found'), { status: 404 });
  }
  return patient;
}

export async function generateNote(doctorId, { patientId, rawInputText }) {
  await ensurePatient(doctorId, patientId);
  const structuredOutput = await generateStructuredNote(rawInputText);

  const note = await prisma.medicalNote.create({
    data: {
      doctorId,
      patientId,
      rawInputText,
      structuredOutput
    }
  });

  return note;
}

export async function getNote(doctorId, id) {
  const note = await prisma.medicalNote.findFirst({
    where: { id, doctorId },
    include: { doctor: true, patient: true }
  });
  if (!note) {
    throw Object.assign(new Error('Note not found'), { status: 404 });
  }
  return note;
}
