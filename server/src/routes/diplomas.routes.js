// server/src/routes/diplomas.routes.js
import { Router } from 'express';
import { requireAuthAdmin } from '../middlewares/auth.middleware.js';
import {
  getDiplomaByRegistration,
  generateDiplomaForRegistration,
  generateDiplomasForActivity, // ⬅️ este nombre está correcto
} from '../controllers/diplomas.controller.js';

const router = Router();

// Público: consultar si existe diploma para una inscripción
router.get('/by-registration/:regId', getDiplomaByRegistration);

// Admin: generar 1 diploma (y enviar por correo)
router.post('/generate/:regId', requireAuthAdmin, generateDiplomaForRegistration);

// Admin: generar en lote por actividad (y enviar correos)
router.post('/generate/activity/:activityId', requireAuthAdmin, generateDiplomasForActivity);

export default router;
