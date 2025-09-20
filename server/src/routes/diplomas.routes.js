// server/src/routes/diplomas.routes.js
import { Router } from 'express';
import { requireAdmin } from '../middlewares/admin.middleware.js';
import {
  generateForRegistration,
  generateForActivity,
  getByRegistration,
} from '../controllers/diplomas.controller.js';

const router = Router();

// Solo Admin puede GENERAR
router.post('/generate/:registrationId', requireAdmin, generateForRegistration);
router.post('/generate/activity/:activityId', requireAdmin, generateForActivity);

// Consulta pública (para que el front pueda verificar si existe)
router.get('/by-registration/:registrationId', getByRegistration);

export default router;
