import PDFDocument from 'pdfkit';

export function buildNotePdf({ clinicName, doctorName, createdAt, structuredOutput }) {
  const doc = new PDFDocument({ margin: 50 });

  doc.fontSize(18).text(clinicName, { align: 'left' });
  doc.fontSize(12).text(`Doctor: ${doctorName}`);
  doc.fontSize(12).text(`Date: ${new Date(createdAt).toLocaleDateString()}`);
  doc.moveDown();

  const lines = structuredOutput.split(/\r?\n/);
  for (const line of lines) {
    if (line.trim().endsWith(':')) {
      doc.moveDown(0.5);
      doc.fontSize(13).text(line.trim(), { underline: true });
    } else {
      doc.fontSize(11).text(line.trim());
    }
  }

  return doc;
}

export function buildPatientExportPdf({ patientProfile, encounters, clinicalNotes, auditMetadata }) {
  const doc = new PDFDocument({ margin: 50 });

  doc.fontSize(18).text('Patient Data Export', { align: 'left' });
  doc.moveDown(0.25);
  doc.fontSize(10).text(`Generated: ${new Date(auditMetadata.generatedAt).toISOString()}`);
  doc.moveDown();

  doc.fontSize(14).text('Patient Information', { underline: true });
  doc.fontSize(11).text(`ID: ${patientProfile.id}`);
  doc.text(`Full Name: ${patientProfile.fullName}`);
  doc.text(`Age: ${patientProfile.age}`);
  doc.text(`Gender: ${patientProfile.gender}`);
  doc.text(`Phone: ${patientProfile.phone}`);
  doc.text(`Clinic ID: ${patientProfile.clinicId}`);
  doc.text(`Doctor ID: ${patientProfile.doctorId}`);
  doc.text(`Created At: ${new Date(patientProfile.createdAt).toISOString()}`);
  if (patientProfile.deletedAt) {
    doc.text(`Deleted At: ${new Date(patientProfile.deletedAt).toISOString()}`);
  }
  doc.moveDown();

  doc.fontSize(14).text('Encounter History', { underline: true });
  if (!encounters.length) {
    doc.fontSize(11).text('No encounters found');
  } else {
    encounters.forEach((encounter, index) => {
      doc.fontSize(11).text(`${index + 1}. ${encounter.id}`);
      doc.fontSize(10).text(`Created: ${new Date(encounter.createdAt).toISOString()}`);
      doc.text(`Duration (seconds): ${encounter.durationSeconds}`);
      doc.text(`Created By: ${encounter.createdBy?.name || 'Unknown'} (${encounter.createdBy?.id || 'N/A'})`);
      if (encounter.transcript) {
        doc.text(`Transcript: ${encounter.transcript}`);
      }
      doc.moveDown(0.5);
    });
  }
  doc.moveDown();

  doc.fontSize(14).text('Notes', { underline: true });
  if (!clinicalNotes.length) {
    doc.fontSize(11).text('No notes found');
  } else {
    clinicalNotes.forEach((note, index) => {
      doc.fontSize(11).text(`${index + 1}. ${note.id}`);
      doc.fontSize(10).text(`Created: ${new Date(note.createdAt).toISOString()}`);
      doc.text(`Doctor: ${note.doctor?.name || 'Unknown'} (${note.doctor?.id || 'N/A'})`);
      doc.moveDown(0.3);
      doc.fontSize(10).text(`Input: ${note.rawInputText || ''}`);
      doc.moveDown(0.2);
      doc.text(`Structured Output: ${note.structuredOutput || ''}`);
      doc.moveDown(0.5);
    });
  }

  return doc;
}
