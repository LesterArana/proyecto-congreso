// server/src/routes/reports.routes.js
import { Router } from 'express';
import { requireAdmin } from '../middlewares/admin.middleware.js';
import {
  attendanceSummary,
  attendanceByActivity,
  attendanceByActivityCsv,
} from '../controllers/reports.controller.js';

const router = Router();

// Todo el módulo de reportes protegido para admin
router.get('/attendance', requireAdmin, attendanceSummary);
router.get('/attendance/activities/:id', requireAdmin, attendanceByActivity);
router.get('/attendance/activities/:id.csv', requireAdmin, attendanceByActivityCsv);

export default router;
