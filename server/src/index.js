// server/src/index.js
import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

import router from "./routes/index.js";
import { errorHandler } from "./middlewares/error.middleware.js";
import { adminMiddleware } from "./middlewares/admin.middleware.js";
import uploadsRoutes from "./routes/uploads.routes.js";


const app = express();

// ESM __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PUBLIC_DIR = path.resolve(__dirname, "..", "public");

app.use(cors());
app.use(express.json());

// estáticos
app.use("/public", express.static(PUBLIC_DIR));

// endpoint de subida protegido
app.use("/api/uploads", adminMiddleware, uploadsRoutes);

// resto de API
app.use("/api", router);

// manejador de errores al final
app.use(errorHandler);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`✅ API running on http://localhost:${PORT}`);
  console.log(`📁 Static: http://localhost:${PORT}/public`);
});
