// server/src/routes/site.routes.js
import { Router } from "express";
import { getAgenda, getSpeakers } from "../controllers/site.controller.js";

const router = Router();

// públicos
router.get("/agenda", getAgenda);
router.get("/speakers", getSpeakers);

export default router;
