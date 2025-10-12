// server/src/utils/diplomas.js
import fsp from 'fs/promises';
import path from 'path';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

/** Convierte una ruta relativa del /public a URL pública */
export function toPublicUrl(rel) {
  if (!rel) return null;
  const norm = String(rel).replace(/\\/g, '/');
  return norm.startsWith('/') ? norm : `/${norm}`;
}

/** Asegura carpeta y escribe archivo */
export async function writeFileEnsuringDir(absPath, buffer) {
  await fsp.mkdir(path.dirname(absPath), { recursive: true });
  await fsp.writeFile(absPath, buffer);
}

/**
 * generateDiplomaPDF(input)
 * Acepta:
 *  A) { user: {name,email}, activity: {title,date} }
 *  B) { userName, userEmail, activityTitle, activityDate }
 * Devuelve Buffer (PDF).
 */
export async function generateDiplomaPDF(input) {
  const userName =
    input?.userName ?? input?.user?.name ?? 'Participante';
  const userEmail =
    input?.userEmail ?? input?.user?.email ?? '';
  const activityTitle =
    input?.activityTitle ?? input?.activity?.title ?? 'Actividad';
  const activityDate =
    input?.activityDate ?? input?.activity?.date ?? new Date();

  const when = activityDate instanceof Date ? activityDate : new Date(activityDate);

  // Documento A4
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]); // A4
  const { width, height } = page.getSize();

  // Fuentes estándar
  const fontTitle = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontText  = await pdfDoc.embedFont(StandardFonts.Helvetica);

  // Paleta UMG-ish
  const primary = rgb(0.039, 0.227, 0.510); // #0a3a82 aprox
  const accent  = rgb(0.000, 0.290, 0.678); // #004aad aprox
  const dark    = rgb(0.13, 0.14, 0.16);
  const soft    = rgb(0.90, 0.91, 0.92);

  // Helpers
  const drawCentered = (text, y, size, font, color = dark) => {
    const textWidth = font.widthOfTextAtSize(text, size);
    const x = (width - textWidth) / 2;
    page.drawText(text, { x, y, size, font, color });
  };
  const wrapTextCentered = (text, size, font, maxWidth) => {
    const words = String(text ?? '').split(/\s+/);
    const lines = [];
    let line = '';
    for (const w of words) {
      const test = line ? `${line} ${w}` : w;
      if (font.widthOfTextAtSize(test, size) <= maxWidth) {
        line = test;
      } else {
        if (line) lines.push(line);
        line = w;
      }
    }
    if (line) lines.push(line);
    return lines;
  };

  // ===== Fondos decorativos =====
  const outerMargin = 24;
  page.drawRectangle({
    x: outerMargin,
    y: outerMargin,
    width: width - outerMargin * 2,
    height: height - outerMargin * 2,
    borderWidth: 3,
    borderColor: primary,
    color: rgb(1, 1, 1),
  });

  const innerMargin = 36;
  page.drawRectangle({
    x: innerMargin,
    y: innerMargin,
    width: width - innerMargin * 2,
    height: height - innerMargin * 2,
    borderWidth: 1,
    borderColor: soft,
    color: rgb(1, 1, 1),
  });

  // Banda superior
  const bandH = 40;
  page.drawRectangle({
    x: innerMargin + 6,
    y: height - innerMargin - bandH - 6,
    width: width - (innerMargin + 6) * 2,
    height: bandH,
    color: rgb(0.96, 0.97, 0.98),
  });

  // ===== Logo (opcional) =====
  try {
    const logoAbs = path.resolve(process.cwd(), 'server', 'public', 'logo-umg.jpg');
    const logoBytes = await fsp.readFile(logoAbs);
    const logo = await pdfDoc.embedPng(logoBytes);
    const logoW = 80;
    const logoH = (logoW / logo.width) * logo.height;
    const x = (width - logoW) / 2;
    const y = height - innerMargin - bandH - 6 + (bandH - logoH) / 2 + 4;
    page.drawImage(logo, { x, y, width: logoW, height: logoH });
  } catch {
    // Si no existe el logo, simplemente se omite
  }

  // ===== Encabezado =====
  let cursorY = height - innerMargin - 70;
  drawCentered('Universidad Mariano Gálvez de Guatemala', cursorY, 14, fontTitle, primary);
  cursorY -= 18;
  drawCentered('Congreso de Tecnología UMG 2025', cursorY, 11, fontTitle, primary);

  // Título principal
  cursorY -= 34;
  drawCentered('DIPLOMA DE PARTICIPACIÓN', cursorY, 24, fontTitle, primary);

  // Separador
  cursorY -= 10;
  page.drawRectangle({
    x: width * 0.22,
    y: cursorY,
    width: width * 0.56,
    height: 1.2,
    color: soft,
  });
  cursorY -= 16;

  // “Otorgado a”
  drawCentered('Otorgado a', cursorY, 12, fontText, rgb(0.35, 0.35, 0.38));
  cursorY -= 18;

  // Nombre del participante (envuelto si es largo)
  {
    const lines = wrapTextCentered(userName || 'Participante', 20, fontTitle, width * 0.78);
    for (const ln of lines) {
      drawCentered(ln, cursorY, 20, fontTitle, dark);
      cursorY -= 22;
    }
  }

  // Email (si existe)
  if (userEmail) {
    drawCentered(`(${userEmail})`, cursorY, 11, fontText, rgb(0.40, 0.42, 0.46));
    cursorY -= 20;
  } else {
    cursorY -= 8;
  }

  // Texto intermedio
  drawCentered('Por su participación en la actividad', cursorY, 12, fontText, rgb(0.35, 0.35, 0.38));
  cursorY -= 18;

  // Título de la actividad (envuelto si es largo)
  {
    const lines = wrapTextCentered(activityTitle || 'Actividad', 16, fontTitle, width * 0.78);
    for (const ln of lines) {
      drawCentered(ln, cursorY, 16, fontTitle, accent);
      cursorY -= 18;
    }
  }

  // Fecha en es-GT / America/Guatemala
  const dateStr = when.toLocaleDateString('es-GT', {
    timeZone: 'America/Guatemala',
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: '2-digit',
  });
  cursorY -= 6;
  drawCentered(`Celebrada el ${dateStr}`, cursorY, 11, fontText, rgb(0.40, 0.42, 0.46));
  cursorY -= 26;

  // Sello simple (círculo)
  const cx = width / 2;
  const cy = cursorY - 4;
  page.drawEllipse({
    x: cx,
    y: cy,
    xScale: 26,
    yScale: 26,
    borderColor: primary,
    borderWidth: 2,
    color: rgb(1, 1, 1),
  });
  // Texto “UMG” dentro
  const sealText = 'UMG';
  const sealSize = 11.5;
  const sealWidth = fontTitle.widthOfTextAtSize(sealText, sealSize);
  page.drawText(sealText, {
    x: cx - sealWidth / 2,
    y: cy - 4,
    size: sealSize,
    font: fontTitle,
    color: primary,
  });
  cursorY -= 64;

  // ===== Firmas =====
  const leftX  = width * 0.14;
  const rightX = width * 0.58;
  const lineW  = width * 0.28;
  const baseY  = 140;

  // Líneas
  page.drawRectangle({ x: leftX,  y: baseY, width: lineW, height: 1, color: soft });
  page.drawRectangle({ x: rightX, y: baseY, width: lineW, height: 1, color: soft });

  // Textos firma
  page.drawText('Coordinación Congreso', {
    x: leftX, y: baseY + 6, size: 10, font: fontTitle, color: dark,
  });
  page.drawText('Decanato', {
    x: rightX + lineW - fontTitle.widthOfTextAtSize('Decanato', 10),
    y: baseY + 6, size: 10, font: fontTitle, color: dark,
  });

  // Footer legal
  const footer = 'Este diploma es válido sin firma manuscrita al ser emitido digitalmente por la Universidad Mariano Gálvez de Guatemala.';
  const footerSize = 9;
  const footerWidth = fontText.widthOfTextAtSize(footer, footerSize);
  page.drawText(footer, {
    x: (width - footerWidth) / 2,
    y: 90,
    size: footerSize,
    font: fontText,
    color: rgb(0.60, 0.62, 0.66),
  });

  // Exportar
  const bytes = await pdfDoc.save();
  return Buffer.from(bytes);
}
