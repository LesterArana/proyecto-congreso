// server/src/routes/uploads.routes.js
import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { requireAuthAdmin } from "../middlewares/auth.middleware.js";


const router = Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PUBLIC_DIR = path.resolve(__dirname, "..", "..", "public");
const WINNERS_DIR = path.join(PUBLIC_DIR, "winners");

// Asegura carpeta
fs.mkdirSync(WINNERS_DIR, { recursive: true });
console.log("[UPLOAD] WINNERS_DIR =", WINNERS_DIR);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, WINNERS_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || "").toLowerCase();
    const base = path
      .basename(file.originalname || "foto", ext)
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

// ✅ Protegido por JWT ADMIN
// POST /api/uploads/winner-photo  (form-data: photo=<file>)
router.post("/winner-photo", requireAuthAdmin, upload.single("photo"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No se recibió archivo 'photo'." });
  }
  const url = `/public/winners/${req.file.filename}`;
  return res.json({ ok: true, url, filename: req.file.filename });
});

export default router;
