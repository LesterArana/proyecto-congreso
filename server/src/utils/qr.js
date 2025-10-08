// server/src/utils/qr.js
import QRCode from 'qrcode';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

export async function generateQrPng(payload, fileName) {
  const __dirname = path.dirname(fileURLToPath(import.meta.url)); // .../server/src/utils
  const outDir = path.resolve(__dirname, '..', '..', 'public', 'qrs'); // 👈 sube dos niveles
  await fs.mkdir(outDir, { recursive: true });
  const outPath = path.join(outDir, fileName);

  const png = await QRCode.toBuffer(payload, { errorCorrectionLevel: 'M', type: 'png', width: 512 });
  await fs.writeFile(outPath, png);

  // ruta pública servida por express.static('/public')
  return `/qrs/${fileName}`;
}
