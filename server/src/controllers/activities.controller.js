// server/src/controllers/activities.controller.js
import { PrismaClient } from "@prisma/client";
import { z } from "zod";

const prisma = new PrismaClient();

const activitySchema = z.object({
  kind: z.string().min(2),           // "CONFERENCE" | "WORKSHOP" | "COMPETITION" si usas enum
  title: z.string().min(2),
  description: z.string().optional().default(""),
  date: z.preprocess((v) => (typeof v === "string" ? new Date(v) : v), z.date()),
  capacity: z.number().int().positive(),
});

// GET /api/activities  (ya lo tienes, lo mantenemos en registrations.controller si prefieres)
export const listActivitiesAdmin = async (req, res, next) => {
  try {
    const acts = await prisma.activity.findMany({
      orderBy: { date: "asc" },
      include: { _count: { select: { registrations: true } } },
    });
    res.json(acts);
  } catch (err) { next(err); }
};

// GET /api/activities/:id  (ya lo tienes como getActivityById)
export const getActivityAdmin = async (req, res, next) => {
  try {
    const id = Number(req.params.id) || 0;
    const a = await prisma.activity.findUnique({
      where: { id },
      include: { _count: { select: { registrations: true } } },
    });
    if (!a) return res.status(404).json({ message: "Actividad no encontrada" });
    res.json(a);
  } catch (err) { next(err); }
};

// POST /api/activities
export const createActivity = async (req, res, next) => {
  try {
    // date esperado en ISO o en formato de <input type="datetime-local"> convertido a ISO en el front
    const data = activitySchema.parse({
      ...req.body,
      capacity: Number(req.body.capacity),
    });
    const created = await prisma.activity.create({ data });
    res.status(201).json(created);
  } catch (err) { next(err); }
};

// PUT /api/activities/:id
export const updateActivity = async (req, res, next) => {
  try {
    const id = Number(req.params.id) || 0;
    const data = activitySchema.partial().parse({
      ...req.body,
      capacity: req.body.capacity !== undefined ? Number(req.body.capacity) : undefined,
    });
    const updated = await prisma.activity.update({ where: { id }, data });
    res.json(updated);
  } catch (err) { next(err); }
};

// DELETE /api/activities/:id
export const deleteActivity = async (req, res, next) => {
  try {
    const id = Number(req.params.id) || 0;
    // Regla: si tiene inscripciones, bloquear borrado (puedes cambiarlo)
    const count = await prisma.registration.count({ where: { activityId: id } });
    if (count > 0) {
      return res.status(409).json({ message: "No se puede borrar: la actividad tiene inscripciones." });
    }
    await prisma.activity.delete({ where: { id } });
    res.json({ ok: true });
  } catch (err) { next(err); }
};
