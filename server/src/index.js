// server/src/index.js
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

import router from './routes/index.js';
import { errorHandler } from './middlewares/error.middleware.js';

const app = express();

// Para poder usar __dirname en ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middlewares base
app.use(cors());
app.use(express.json());

// Servir estáticos desde /public (ej: QR, diplomas, etc.)
app.use(express.static(path.resolve(__dirname, '..', 'public')));

// Rutas de la API
app.use('/api', router);

// Manejador de errores (siempre al final de las rutas)
app.use(errorHandler);

// Levantar servidor
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`✅ API running on http://localhost:${PORT}`);
});
