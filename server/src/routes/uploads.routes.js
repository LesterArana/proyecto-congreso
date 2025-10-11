// server/src/routes/upload.routes.js
import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const router = Router();

// __dirname para ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carpeta destino: /server/public/winners
const PUBLIC_DIR = path.resolve(__dirname, "..", "..", "public");
const WINNERS_DIR = path.join(PUBLIC_DIR, "winners");

// Asegura que exista
fs.mkdirSync(WINNERS_DIR, { recursive: true });

// Configuración Multer
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, WINNERS_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || "").toLowerCase();
    const base = path.basename(file.originalname || "foto", ext)
      .toLowerCase()
      .replace(/[^a-z0-9_-]/gi, "-");
    const name = `${Date.now()}-${base}${ext || ".jpg"}`;
    cb(null, name);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

// POST /api/uploads/winner-photo
router.post("/winner-photo", upload.single("photo"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No se recibió archivo 'photo'." });
  }
  // URL pública para el cliente
  const url = `/public/winners/${req.file.filename}`;
  return res.json({ ok: true, url, filename: req.file.filename });
});

export default router;
