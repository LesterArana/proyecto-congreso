// server/src/controllers/winners.controller.js
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

/* =========================
 * Validaciones
 * ========================= */
const createWinnerSchema = z.object({
  activityId: z.number().int().positive(),
  userId: z.number().int().positive(),
  place: z.number().int().min(1).max(10),            // 1°, 2°, 3°...
  description: z.string().trim().optional().nullable(),
  // Aceptamos URL absoluta o ruta relativa servida desde /public
  photoUrl: z.string().trim().optional().nullable(),
});

const updateWinnerSchema = z.object({
  place: z.number().int().min(1).max(10).optional(),
  description: z.string().trim().optional().nullable(),
  photoUrl: z.string().trim().optional().nullable(),
});

/* =========================
 * Helper
 * ========================= */
function mapWinner(w) {
  return {
    id: w.id,
    place: w.place,
    description: w.description,
    photoUrl: w.photoUrl,
    createdAt: w.createdAt,
    activity: w.activity
      ? { id: w.activity.id, title: w.activity.title, date: w.activity.date, kind: w.activity.kind }
      : undefined,
    user: w.user
      ? { id: w.user.id, name: w.user.name, email: w.user.email, type: w.user.type, school: w.user.school }
      : undefined,
  };
}

/* =========================
 * Crear ganador (ADMIN)
 * POST /api/winners
 * ========================= */
export async function createWinner(req, res) {
  try {
    const parsed = createWinnerSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Datos inválidos', details: parsed.error.issues });
    }
    const { activityId, userId, place, description, photoUrl } = parsed.data;

    const [act, usr] = await Promise.all([
      prisma.activity.findUnique({ where: { id: activityId } }),
      prisma.user.findUnique({ where: { id: userId } }),
    ]);
    if (!act) return res.status(404).json({ error: 'Actividad no encontrada' });
    if (!usr) return res.status(404).json({ error: 'Usuario no encontrado' });

    // Evitar duplicar mismo place en la misma actividad
    const dup = await prisma.winner.findFirst({ where: { activityId, place } });
    if (dup) {
      return res.status(409).json({ error: `Ya existe un ganador para el lugar ${place} en esta actividad.` });
    }

    const w = await prisma.winner.create({
      data: { activityId, userId, place, description: description || null, photoUrl: photoUrl || null },
      include: { activity: true, user: true },
    });

    return res.status(201).json({ message: 'Ganador creado', winner: mapWinner(w) });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Error creando ganador' });
  }
}

/* =========================
 * Actualizar (ADMIN)
 * PUT /api/winners/:id
 * ========================= */
export async function updateWinner(req, res) {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ error: 'id inválido' });

    const parsed = updateWinnerSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Datos inválidos', details: parsed.error.issues });
    }

    const current = await prisma.winner.findUnique({ where: { id } });
    if (!current) return res.status(404).json({ error: 'Ganador no encontrado' });

    if (parsed.data.place && parsed.data.place !== current.place) {
      const dup = await prisma.winner.findFirst({
        where: { activityId: current.activityId, place: parsed.data.place },
      });
      if (dup) {
        return res.status(409).json({ error: `Ya existe un ganador para el lugar ${parsed.data.place} en esta actividad.` });
      }
    }

    const w = await prisma.winner.update({
      where: { id },
      data: {
        place: parsed.data.place ?? current.place,
        description: parsed.data.description ?? current.description,
        photoUrl: parsed.data.photoUrl ?? current.photoUrl,
      },
      include: { activity: true, user: true },
    });

    return res.json({ message: 'Ganador actualizado', winner: mapWinner(w) });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Error actualizando ganador' });
  }
}

/* =========================
 * Eliminar (ADMIN)
 * DELETE /api/winners/:id
 * ========================= */
export async function deleteWinner(req, res) {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ error: 'id inválido' });

    const exists = await prisma.winner.findUnique({ where: { id } });
    if (!exists) return res.status(404).json({ error: 'Ganador no encontrado' });

    await prisma.winner.delete({ where: { id } });
    return res.json({ message: 'Ganador eliminado', id });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Error eliminando ganador' });
  }
}

/* =========================
 * Listado público general
 * GET /api/winners?activityId=&year=&limit=
 * ========================= */
export async function listWinners(req, res) {
  try {
    const activityId = req.query.activityId ? Number(req.query.activityId) : undefined;
    const year = req.query.year ? Number(req.query.year) : undefined;
    const limit = req.query.limit ? Math.max(1, Math.min(500, Number(req.query.limit))) : undefined;

    const where = {};
    if (activityId) where.activityId = activityId;

    if (year) {
      const start = new Date(Date.UTC(year, 0, 1));
      const end = new Date(Date.UTC(year + 1, 0, 1));
      const acts = await prisma.activity.findMany({
        where: { date: { gte: start, lt: end } },
        select: { id: true },
      });
      where.activityId = { in: acts.map(a => a.id) };
    }

    const winners = await prisma.winner.findMany({
      where,
      include: { activity: true, user: true },
      orderBy: [{ activityId: 'asc' }, { place: 'asc' }, { createdAt: 'asc' }],
      take: limit,
    });

    return res.json({ items: winners.map(mapWinner) });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Error listando ganadores' });
  }
}

/* =========================
 * Listado público por actividad
 * GET /api/winners/activity/:id
 * ========================= */
export async function listWinnersByActivity(req, res) {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ error: 'activityId inválido' });

    const activity = await prisma.activity.findUnique({ where: { id } });
    if (!activity) return res.status(404).json({ error: 'Actividad no encontrada' });

    const winners = await prisma.winner.findMany({
      where: { activityId: id },
      include: { activity: true, user: true },
      orderBy: [{ place: 'asc' }],
    });

    return res.json({
      activity: { id: activity.id, title: activity.title, date: activity.date },
      items: winners.map(mapWinner),
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Error listando ganadores por actividad' });
  }
}
