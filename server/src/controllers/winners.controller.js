// server/src/controllers/winners.controller.js
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

/* =========================
 * Validaciones
 * ========================= */
const createWinnerSchema = z.object({
  activityId: z.coerce.number().int().positive(),
  userId:     z.coerce.number().int().positive(),
  place:      z.coerce.number().int().min(1).max(10),
  description: z.string().trim().optional().nullable(),
  photoUrl:    z.string().trim().optional().nullable(),
});

const updateWinnerSchema = z.object({
  place:       z.coerce.number().int().min(1).max(10).optional(),
  description: z.string().trim().optional().nullable(),
  photoUrl:    z.string().trim().optional().nullable(),
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
      return res.status(400).json({
        error: 'Datos inválidos',
        details: parsed.error.issues,
      });
    }

    const { activityId, userId, place, description, photoUrl } = parsed.data;

    // Validar existencia de FK
    const [act, usr] = await Promise.all([
      prisma.activity.findUnique({ where: { id: activityId } }),
      prisma.user.findUnique({ where: { id: userId } }),
    ]);
    if (!act) return res.status(404).json({ error: 'Actividad no encontrada', activityId });
    if (!usr) return res.status(404).json({ error: 'Usuario no encontrado', userId });

    // Evitar duplicado de "place" por actividad
    const dup = await prisma.winner.findFirst({ where: { activityId, place } });
    if (dup) {
      return res.status(409).json({ error: `Ya existe un ganador para el lugar ${place} en esta actividad.` });
    }

    const w = await prisma.winner.create({
      data: {
        activityId,
        userId,
        place,
        description: (description ?? '').trim() || null,
        photoUrl: (photoUrl ?? '').trim() || null,
      },
    });

    // Traer info para la respuesta (sin usar include por si el client no lo expone)
    const [act2, usr2] = await Promise.all([
      prisma.activity.findUnique({ where: { id: w.activityId }, select: { id: true, title: true, kind: true, date: true } }),
      prisma.user.findUnique({ where: { id: w.userId }, select: { id: true, name: true, email: true, type: true, school: true } }),
    ]);

    return res.status(201).json({
  message: 'Ganador creado',
  winner: {
    id: w.id,
    place: w.place,
    description: w.description,
    photoUrl: absPublicUrl(req, w.photoUrl), // ✅ ahora genera URL completa
    createdAt: w.createdAt,
    activity: act2,
    user: usr2,
  },
});
  } catch (err) {
    console.error('createWinner error:', err);
    // expón un poco de detalle para depurar rápido en dev
    return res.status(500).json({
      error: 'Error creando ganador',
      detail: err?.code ? `${err.code}: ${err.message}` : String(err?.message || err),
    });
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

    // Actualiza SOLO con los valores crudos
    const w = await prisma.winner.update({
      where: { id },
      data: {
        place: parsed.data.place ?? current.place,
        description: parsed.data.description ?? current.description,
        photoUrl: parsed.data.photoUrl ?? current.photoUrl,
      },
      include: { activity: true, user: true },
    });

    // Decora la URL antes de responder
    const resp = mapWinner(w);
    resp.photoUrl = absPublicUrl(req, resp.photoUrl);

    return res.json({ message: 'Ganador actualizado', winner: resp });
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

    // 1) Construir filtro base
    let where = {};
    if (activityId) where.activityId = activityId;

    // 2) Si viene year, filtra por fecha de la actividad mediante IDs (sin include)
    if (Number.isInteger(year)) {
      const gte = new Date(Date.UTC(year, 0, 1));
      const lt  = new Date(Date.UTC(year + 1, 0, 1));
      const acts = await prisma.activity.findMany({
        where: { date: { gte, lt } },
        select: { id: true },
      });
      const ids = acts.map(a => a.id);
      // si no hay actividades para ese año, respondemos vacío
      if (ids.length === 0) return res.json({ items: [] });
      where.activityId = activityId ? activityId : { in: ids };
    }

    // 3) Traer ganadores sin include
    const winners = await prisma.winner.findMany({
      where,
      orderBy: [{ activityId: 'asc' }, { place: 'asc' }, { createdAt: 'asc' }],
      take: limit,
    });

    if (winners.length === 0) return res.json({ items: [] });

    // 4) Cargar actividades y usuarios relacionados en lote
    const activityIds = [...new Set(winners.map(w => w.activityId))];
    const userIds = [...new Set(winners.map(w => w.userId))];

    const [activities, users] = await Promise.all([
      prisma.activity.findMany({
        where: { id: { in: activityIds } },
        select: { id: true, title: true, kind: true, date: true },
      }),
      prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, name: true, email: true, type: true, school: true },
      }),
    ]);

    const actMap = new Map(activities.map(a => [a.id, a]));
    const userMap = new Map(users.map(u => [u.id, u]));

    // 5) Armar respuesta final similar a mapWinner()
    const items = winners.map(w => ({
      id: w.id,
      place: w.place,
      description: w.description,
      photoUrl: absPublicUrl(req, w.photoUrl),
      createdAt: w.createdAt,
      activity: actMap.get(w.activityId) || null,
      user: userMap.get(w.userId) || null,
    }));

    return res.json({ items });
  } catch (err) {
    console.error('listWinners fatal2:', err);
    return res.status(500).json({ error: 'Error listando ganadores', detail: String(err?.message || err) });
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
      items: winners.map(w => ({
  ...mapWinner(w),
  photoUrl: absPublicUrl(req, w.photoUrl), })),
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Error listando ganadores por actividad' });
  }
}

function absPublicUrl(req, url) {
  if (!url) return url;
  if (!url.startsWith("/public")) return url;
  const base = process.env.PUBLIC_BASE_URL || `${req.protocol}://${req.get("host")}`;
  return base + url;
}