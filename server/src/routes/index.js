// server/src/routes/index.js
import { Router } from "express";
import { requireAdmin } from "../middlewares/admin.middleware.js";

// ===== Controlador PÚBLICO (ya tienes estas funcs ahí)
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

// ===== Controlador ADMIN de actividades (tu archivo nuevo)
import {
  listActivitiesAdmin,
  getActivityAdmin,
  createActivity,
  updateActivity,
  deleteActivity,
} from "../controllers/activities.controller.js";

// ===== Rutas de otros módulos
import diplomasRoutes from "./diplomas.routes.js";
import winnersRoutes from "./winners.routes.js";
import reportsRoutes from "./reports.routes.js";

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
router.post("/checkin", checkin); // si quieres, luego lo protegemos

router.get("/registrations/by-email", listRegistrationsByEmail);
router.get("/activities/:id/attendances", listAttendancesByActivity);

// CSV y registros por actividad (ADMIN)
router.get("/activities/:id/registrations.csv", requireAdmin, exportRegistrationsCsv);
router.get("/activities/:id/registrations", requireAdmin, listRegistrationsByActivity);

/* =========================
 * RUTAS ADMIN (NAMESPACE /admin/activities)
 * ========================= */
router.get("/admin/activities", requireAdmin, listActivitiesAdmin);
router.get("/admin/activities/:id", requireAdmin, getActivityAdmin);
router.post("/admin/activities", requireAdmin, createActivity);
router.put("/admin/activities/:id", requireAdmin, updateActivity);
router.delete("/admin/activities/:id", requireAdmin, deleteActivity);

/* =========================
 * MÓDULOS
 * ========================= */
router.use("/diplomas", diplomasRoutes);
router.use("/winners", winnersRoutes);
router.use("/reports", reportsRoutes);

router.get("/admin/ping", requireAdmin, (req, res) => res.json({ ok: true }));


export default router;
