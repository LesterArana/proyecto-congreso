// server/src/routes/winners.routes.js
import { Router } from 'express';
import { requireAdmin } from '../middlewares/admin.middleware.js';
import {
  createWinner,
  updateWinner,
  deleteWinner,
  listWinners,
  listWinnersByActivity,
} from '../controllers/winners.controller.js';

const router = Router();

// Consulta pública
router.get('/', listWinners);
router.get('/activity/:id', listWinnersByActivity);

// Mutaciones (solo admin)
router.post('/', requireAdmin, createWinner);
router.put('/:id', requireAdmin, updateWinner);
router.delete('/:id', requireAdmin, deleteWinner);

export default router;
