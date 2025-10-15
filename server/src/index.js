// server/src/index.js
import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

import apiRouter from "./routes/index.js";
import authRoutes from "./routes/auth.routes.js";
import uploadsRoutes from "./routes/uploads.routes.js";
import { errorHandler } from "./middlewares/error.middleware.js";
import { requireAuthAdmin } from "./middlewares/auth.middleware.js";

const app = express();

// __dirname en ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PUBLIC_DIR = path.resolve(__dirname, "..", "public");

app.use(cors());
app.use(express.json());

// estáticos
app.use("/public", express.static(PUBLIC_DIR));

// health check (útil para Railway)
app.get("/health", (_req, res) => res.json({ ok: true }));

// auth (login, etc.)
app.use("/api/auth", authRoutes);

// uploads protegidos por JWT ADMIN
app.use("/api/uploads", requireAuthAdmin, uploadsRoutes);

// resto de API
app.use("/api", apiRouter);

// manejador de errores (siempre al final)
app.use(errorHandler);

// 🔴 IMPORTANTE: PORT y HOST para PaaS
const PORT = process.env.PORT || 4000;
const HOST = "0.0.0.0";

app.listen(PORT, HOST, () => {
  console.log(`✅ API running on http://${HOST}:${PORT}`);
  console.log(`📁 Static files: http://${HOST}:${PORT}/public`);
});
