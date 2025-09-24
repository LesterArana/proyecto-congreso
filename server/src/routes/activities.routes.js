import { Router } from "express";
import * as controller from "../controllers/activities.controller.js";

const router = Router();

// Obtener todas las actividades
router.get("/", controller.getAll);

// Resumen con cupos disponibles
router.get("/summary", controller.getSummary);

export default router;
