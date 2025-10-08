// server/src/utils/diplomas.js
import fs from 'fs/promises';
import path from 'path';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

// Convierte una ruta relativa del /public a URL pública
export function toPublicUrl(rel) {
  if (!rel) return null;
  const norm = String(rel).replace(/\\/g, '/');
  return norm.startsWith('/') ? norm : `/${norm}`;
}

// Asegura carpeta y escribe archivo
export async function writeFileEnsuringDir(absPath, buffer) {
  await fs.mkdir(path.dirname(absPath), { recursive: true });
  await fs.writeFile(absPath, buffer);
}

/**
 * generateDiplomaPDF(input)
 * Acepta dos formatos:
 *  A) { user: {name,email}, activity: {title,date} }
 *  B) { userName, userEmail, activityTitle, activityDate }
 * Devuelve Buffer (PDF real).
 */
export async function generateDiplomaPDF(input) {
  const userName =
    input?.userName ??
    input?.user?.name ??
    'Participante';
  const userEmail =
    input?.userEmail ??
    input?.user?.email ??
    '';
  const activityTitle =
    input?.activityTitle ??
    input?.activity?.title ??
    'Actividad';
  const activityDate =
    input?.activityDate ??
    input?.activity?.date ??
    new Date();

  const when =
    activityDate instanceof Date
      ? activityDate
      : new Date(activityDate);

  // Crea un documento PDF
  const pdfDoc = await PDFDocument.create();
  // Tamaño A4: 595 x 842 aprox.
  const page = pdfDoc.addPage([595.28, 841.89]);
  const { width, height } = page.getSize();

  // Fuentes
  const fontTitle = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontText = await pdfDoc.embedFont(StandardFonts.Helvetica);

  // Colores
  const primary = rgb(0.145, 0.388, 0.921);   // #2563eb aprox
  const dark = rgb(0.2, 0.2, 0.2);

  // Marco decorativo
  const margin = 32;
  page.drawRectangle({
    x: margin,
    y: margin,
    width: width - margin * 2,
    height: height - margin * 2,
    borderWidth: 2,
    color: rgb(1, 1, 1),
    borderColor: primary,
  });

  // Helper para centrar texto
  function drawCentered(text, y, size, font, color = dark) {
    const textWidth = font.widthOfTextAtSize(text, size);
    const x = (width - textWidth) / 2;
    page.drawText(text, { x, y, size, font, color });
  }

  // Contenido
  let cursorY = height - 140;

  drawCentered('Diploma de participación', cursorY, 28, fontTitle, primary);
  cursorY -= 40;

  drawCentered('Otorgado a:', cursorY, 14, fontText);
  cursorY -= 24;

  drawCentered(userName, cursorY, 22, fontTitle);
  cursorY -= 22;

  if (userEmail) {
    cursorY -= 6;
    drawCentered(`(${userEmail})`, cursorY, 12, fontText, rgb(0.35, 0.35, 0.35));
    cursorY -= 12;
  }

  cursorY -= 18;
  drawCentered('Por su participación en:', cursorY, 14, fontText);
  cursorY -= 24;

  drawCentered(activityTitle, cursorY, 18, fontTitle);
  cursorY -= 28;

  const dateStr = when.toLocaleString();
  drawCentered(`Fecha: ${dateStr}`, cursorY, 12, fontText);
  cursorY -= 60;

  drawCentered('— Congreso de Tecnología —', cursorY, 12, fontText, rgb(0.35, 0.35, 0.35));

  // Exporta a Buffer
  const bytes = await pdfDoc.save(); // Uint8Array
  return Buffer.from(bytes);
}
