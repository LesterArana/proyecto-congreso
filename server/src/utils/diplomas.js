// server/src/utils/diplomas.js
import fs from 'fs';
import path from 'path';
import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';

/** Crea la carpeta si no existe */
function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

/**
 * Genera un PDF de diploma y devuelve la RUTA ABSOLUTA del archivo creado.
 * Espera un objeto `registration` que incluya: { id, user{ name|email }, activity{ title }, userId, activityId }
 */
export async function generateDiplomaPDF({ registration, outDir }) {
  const targetDir = outDir || path.join(process.cwd(), 'server', 'public', 'diplomas');
  ensureDir(targetDir);

  const fileName = `${registration.id}-${Date.now()}.pdf`;
  const outPath = path.join(targetDir, fileName);

  const participantName =
    registration?.user?.name ||
    registration?.user?.email ||
    'Participante';

  const activityName = registration?.activity?.title || `Actividad ${registration?.activityId ?? ''}`;
  const dateStr = new Date().toLocaleDateString();

  // QR con datos básicos del registro
  const payload = {
    registrationId: registration.id,
    userId: registration.userId,
    activityId: registration.activityId,
    email: registration?.user?.email || '',
  };
  const dataURL = await QRCode.toDataURL(JSON.stringify(payload));
  const qrBase64 = dataURL.split(',')[1];
  const qrBuffer = Buffer.from(qrBase64, 'base64');

  const doc = new PDFDocument({ size: 'A4', margins: { top: 50, bottom: 50, left: 50, right: 50 } });
  const stream = fs.createWriteStream(outPath);
  doc.pipe(stream);

  // Marco
  doc.rect(20, 20, doc.page.width - 40, doc.page.height - 40).stroke();

  // Encabezado
  doc.fontSize(20).text('Congreso de Tecnología', { align: 'center' }).moveDown(0.5);
  doc.fontSize(26).text('DIPLOMA DE PARTICIPACIÓN', { align: 'center' }).moveDown(1.2);

  // Cuerpo
  doc
    .fontSize(14).text('Se otorga el presente diploma a:', { align: 'center' }).moveDown(0.3)
    .fontSize(22).text(participantName, { align: 'center' }).moveDown(0.6)
    .fontSize(14).text(`Por su participación en la actividad "${activityName}".`, { align: 'center' }).moveDown(0.6)
    .text(`Fecha: ${dateStr}`, { align: 'center' }).moveDown(1.2);

  // QR centrado
  const qrSize = 110;
  doc.image(qrBuffer, doc.page.width / 2 - qrSize / 2, doc.y, { width: qrSize }).moveDown(1.2);

  // Firmas
  const y = doc.y + 100;
  doc.moveTo(80, y).lineTo(260, y).stroke();
  doc.fontSize(10).text('Coordinación Académica', 80, y + 5, { width: 180, align: 'center' });

  doc.moveTo(doc.page.width - 260, y).lineTo(doc.page.width - 80, y).stroke();
  doc.fontSize(10).text('Dirección de Carrera', doc.page.width - 260, y + 5, { width: 180, align: 'center' });

  doc.end();

  await new Promise((resolve, reject) => {
    stream.on('finish', resolve);
    stream.on('error', reject);
  });

  return outPath;
}

/**
 * Convierte una RUTA ABSOLUTA dentro de /public a una URL relativa servible por Express:
 * p.ej.  C:\...\server\public\diplomas\abc.pdf  =>  /diplomas/abc.pdf
 */
export function toPublicUrl(absPath) {
  const norm = absPath.replace(/\\/g, '/');
  const idx = norm.lastIndexOf('/public/');
  if (idx === -1) return null;
  return norm.substring(idx + '/public'.length); // -> /diplomas/archivo.pdf
}
