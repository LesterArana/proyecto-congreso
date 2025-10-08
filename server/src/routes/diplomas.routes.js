import { Router } from 'express';
import { requireAdmin } from '../middlewares/admin.middleware.js';
import {
  getDiplomaByRegistration,
  generateDiplomaForRegistration,
  generateDiplomasForActivity, // ⬅️ ESTE es el nombre correcto
} from '../controllers/diplomas.controller.js';

const router = Router();

// Público: consultar si existe diploma para una inscripción
router.get('/by-registration/:regId', getDiplomaByRegistration);

// Admin: generar 1 diploma (y enviar por correo)
router.post('/generate/:regId', requireAdmin, generateDiplomaForRegistration);

// Admin: generar en lote por actividad (y enviar correos)
router.post('/generate/activity/:activityId', requireAdmin, generateDiplomasForActivity);

export default router;
