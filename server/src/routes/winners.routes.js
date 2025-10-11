// server/src/routes/winners.routes.js
import { Router } from "express";
import { requireAdmin } from "../middlewares/admin.middleware.js";
import {
  createWinner,
  updateWinner,
  deleteWinner,
  listWinners,            // maneja query ?activityId= opcional
} from "../controllers/winners.controller.js";

const router = Router();

// Consulta pública (lista completa o por actividad con ?activityId=)
router.get("/", listWinners);

// Mutaciones (solo admin)
router.post("/", requireAdmin, createWinner);
router.put("/:id", requireAdmin, updateWinner);
router.delete("/:id", requireAdmin, deleteWinner);

export default router;
