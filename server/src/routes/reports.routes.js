// server/src/routes/reports.routes.js
import { Router } from 'express';
import { requireAuthAdmin } from '../middlewares/auth.middleware.js';
import {
  attendanceSummary,
  attendanceByActivity,
  attendanceByActivityCsv,
} from '../controllers/reports.controller.js';

const router = Router();

// Todo el módulo protegido
router.get('/attendance', requireAuthAdmin, attendanceSummary);

// ⚠️ CSV PRIMERO
router.get('/attendance/activities/:id.csv', requireAuthAdmin, attendanceByActivityCsv);

// Detalle JSON con id numérico únicamente
router.get('/attendance/activities/:id(\\d+)', requireAuthAdmin, attendanceByActivity);

export default router;
