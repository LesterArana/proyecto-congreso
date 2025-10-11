// server/src/routes/reports.routes.js
import { Router } from 'express';
import { requireAuthAdmin } from '../middlewares/auth.middleware.js';
import {
  attendanceSummary,
  attendanceByActivity,
  attendanceByActivityCsv,
} from '../controllers/reports.controller.js';

const router = Router();

// ✅ Todo el módulo de reportes protegido para admin autenticado (JWT)
router.get('/attendance', requireAuthAdmin, attendanceSummary);
router.get('/attendance/activities/:id', requireAuthAdmin, attendanceByActivity);
router.get('/attendance/activities/:id.csv', requireAuthAdmin, attendanceByActivityCsv);

export default router;
