// server/src/routes/index.js
import { Router } from "express";
import { requireAuthAdmin } from "../middlewares/auth.middleware.js";

// ===== Controlador PÚBLICO
import {
  listActivities,            // pública
  activitiesSummary,         // pública
  createRegistration,
  checkin,
  listAttendancesByActivity,
  listRegistrationsByActivity,
  exportRegistrationsCsv,
  listRegistrationsByEmail,
  getActivityById,           // pública
} from "../controllers/registrations.controller.js";

// ===== Controlador ADMIN de actividades
import {
  listActivitiesAdmin,
  getActivityAdmin,
  createActivity,
  updateActivity,
  deleteActivity,
} from "../controllers/activities.controller.js";

// ===== Subrutas de otros módulos
import diplomasRoutes from "./diplomas.routes.js";
import winnersRoutes from "./winners.routes.js";
import reportsRoutes from "./reports.routes.js";
import siteRoutes from "./site.routes.js";

const router = Router();

// Health
router.get("/health", (req, res) => res.json({ ok: true }));

/* =========================
 * RUTAS PÚBLICAS
 * ========================= */
router.get("/activities", listActivities);
router.get("/activities/summary", activitiesSummary);
router.get("/activities/:id", getActivityById);

router.post("/registrations", createRegistration);
router.post("/checkin", checkin);

router.get("/registrations/by-email", listRegistrationsByEmail);
router.get("/activities/:id/attendances", listAttendancesByActivity);

/* =========================
 * RUTAS ADMIN (CSV y registros por actividad)
 * ========================= */
router.get("/activities/:id/registrations.csv", requireAuthAdmin, exportRegistrationsCsv);
router.get("/activities/:id/registrations", requireAuthAdmin, listRegistrationsByActivity);

/* =========================
 * RUTAS ADMIN (NAMESPACE /admin/activities)
 * ========================= */
router.get("/admin/activities", requireAuthAdmin, listActivitiesAdmin);
router.get("/admin/activities/:id", requireAuthAdmin, getActivityAdmin);
router.post("/admin/activities", requireAuthAdmin, createActivity);
router.put("/admin/activities/:id", requireAuthAdmin, updateActivity);
router.delete("/admin/activities/:id", requireAuthAdmin, deleteActivity);

/* =========================
 * MÓDULOS
 * ========================= */
router.use("/diplomas", diplomasRoutes); // ya protegidas adentro
router.use("/winners", winnersRoutes);   // ya protegidas adentro
router.use("/reports", reportsRoutes);   // ya protegidas adentro
router.use("/site", siteRoutes);         // público

// Ping admin
router.get("/admin/ping", requireAuthAdmin, (req, res) => res.json({ ok: true }));

export default router;
