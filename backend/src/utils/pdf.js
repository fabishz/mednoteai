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
