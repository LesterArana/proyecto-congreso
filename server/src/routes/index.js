import { Router } from 'express';
import { requireAdmin } from '../middlewares/admin.middleware.js';

import {
  createExternalUser,
  listActivities,
  activitiesSummary,
  createRegistration,
  checkin,
  listAttendancesByActivity,
  listRegistrationsByActivity,
  exportRegistrationsCsv,
  listRegistrationsByEmail,
  getActivityById,
} from '../controllers/registrations.controller.js';

import {
  listActivitiesAdmin,
  getActivityAdmin,
  createActivity,
  updateActivity,
  deleteActivity,
} from '../controllers/activities.controller.js';

import diplomasRoutes from './diplomas.routes.js';
import reportsRoutes from './reports.routes.js';
import winnersRoutes from './winners.routes.js';

const router = Router();

// --- Rutas básicas ---
router.get('/health', (req, res) => res.json({ ok: true }));

// --- Actividades (público) ---
router.get('/activities', listActivities);
router.get('/activities/summary', activitiesSummary);
router.get('/activities/:id', getActivityById);

// --- Registro y check-in ---
router.post('/registrations', createRegistration);
router.post('/checkin', checkin);

// --- Registros por actividad ---
router.get('/activities/:id/registrations', requireAdmin, listRegistrationsByActivity);
router.get('/activities/:id/registrations.csv', requireAdmin, exportRegistrationsCsv);

// --- Asistencias ---
router.get('/activities/:id/attendances', listAttendancesByActivity);

// --- Registros por email ---
router.get('/registrations/by-email', listRegistrationsByEmail);

// --- Admin ping ---
router.get('/admin/ping', requireAdmin, (req, res) => res.json({ ok: true }));

// --- Actividades (admin) ---
router.get('/admin/activities', listActivitiesAdmin);
router.get('/admin/activities/:id', getActivityAdmin);
router.post('/admin/activities', requireAdmin, createActivity);
router.put('/admin/activities/:id', requireAdmin, updateActivity);
router.delete('/admin/activities/:id', requireAdmin, deleteActivity);

// --- Diplomas ---
router.use('/diplomas', diplomasRoutes);

router.use('/reports', reportsRoutes);

router.use('/winners', winnersRoutes);


export default router;
