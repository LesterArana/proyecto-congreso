import fs from 'fs';
import path from 'path';
import QRCode from 'qrcode';

const QR_DIR = path.resolve('public', 'qrs');

export async function ensureQrDir() {
  if (!fs.existsSync(QR_DIR)) fs.mkdirSync(QR_DIR, { recursive: true });
  return QR_DIR;
}

export async function generateQrPng(text, fileName) {
  await ensureQrDir();
  const filePath = path.join(QR_DIR, fileName);
  await QRCode.toFile(filePath, text, { width: 360, margin: 1 });
  return `/qrs/${fileName}`; // ruta pública
}
