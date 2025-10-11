// server/src/index.js
import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

import apiRouter from "./routes/index.js";
import authRoutes from "./routes/auth.routes.js";

// ⬅️ OJO: ajusta el nombre del archivo según el tuyo real:

import uploadsRoutes from "./routes/uploads.routes.js";


import { errorHandler } from "./middlewares/error.middleware.js";

import { requireAuth, requireAuthAdmin } from "./middlewares/auth.middleware.js";

const app = express();

// __dirname en ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PUBLIC_DIR = path.resolve(__dirname, "..", "public");

app.use(cors());
app.use(express.json());

// estáticos
app.use("/public", express.static(PUBLIC_DIR));

// auth (login, etc.)
app.use("/api/auth", authRoutes);

// uploads protegidos por JWT ADMIN
app.use("/api/uploads", requireAuthAdmin, uploadsRoutes);

// resto de API
app.use("/api", apiRouter);

// manejador de errores (siempre al final)
app.use(errorHandler);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`✅ API running on http://localhost:${PORT}`);
  console.log(`📁 Static files: http://localhost:${PORT}/public`);
});
