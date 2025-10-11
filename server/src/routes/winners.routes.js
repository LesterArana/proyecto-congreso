// server/src/routes/winners.routes.js
import { Router } from "express";
import { requireAuthAdmin } from "../middlewares/auth.middleware.js";
import {
  createWinner,
  updateWinner,
  deleteWinner,
  listWinners, // maneja query ?activityId=
} from "../controllers/winners.controller.js";

const router = Router();

// GET público (lista completa o por actividad)
router.get("/", listWinners);

// Mutaciones protegidas por JWT ADMIN
router.post("/", requireAuthAdmin, createWinner);
router.put("/:id", requireAuthAdmin, updateWinner);
router.delete("/:id", requireAuthAdmin, deleteWinner);

export default router;
