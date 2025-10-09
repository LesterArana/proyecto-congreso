// server/src/controllers/activities.controller.js
import { PrismaClient } from "@prisma/client";
import { z } from "zod";

const prisma = new PrismaClient();

// Acepta SOLO los 2 valores del enum Prisma
const ActivityKindEnum = z.enum(["TALLER", "COMPETENCIA"]);

// Convierte strings de <input type="datetime-local"> a Date válida
const dateFromInput = z
  .string()
  .min(10)
  .transform((v) => {
    // Soporta "2025-10-01T10:00" (local) y ISO completos
    const d = new Date(v);
    if (isNaN(d.getTime())) throw new Error("Fecha inválida");
    return d;
  });

const activitySchema = z.object({
  kind: ActivityKindEnum,
  title: z.string().min(2, "Título muy corto"),
  description: z.string().optional().default(""),
  date: z.union([dateFromInput, z.date()]), // admite Date directa o string
  capacity: z
    .number({ invalid_type_error: "Capacidad debe ser numérica" })
    .int("Capacidad debe ser entera")
    .positive("Capacidad debe ser > 0"),
});

/* ========================
   LISTAR (público/admin)
======================== */
export const listActivitiesAdmin = async (req, res, next) => {
  try {
    const acts = await prisma.activity.findMany({
      orderBy: { date: "asc" },
      include: { _count: { select: { registrations: true } } },
    });
    res.json(acts);
  } catch (err) {
    next(err);
  }
};

export const getActivityAdmin = async (req, res, next) => {
  try {
    const id = Number(req.params.id) || 0;
    const a = await prisma.activity.findUnique({
      where: { id },
      include: { _count: { select: { registrations: true } } },
    });
    if (!a) return res.status(404).json({ message: "Actividad no encontrada" });
    res.json(a);
  } catch (err) {
    next(err);
  }
};

/* ========================
   CREAR
======================== */
export const createActivity = async (req, res) => {
  try {
    console.log("[createActivity] raw body:", req.body);

    const parsed = activitySchema.safeParse({
      ...req.body,
      capacity: typeof req.body.capacity === "string" ? Number(req.body.capacity) : req.body.capacity,
    });

    if (!parsed.success) {
      console.warn("[createActivity] validation issues:", parsed.error.issues);
      return res.status(400).json({
        message: "Datos inválidos",
        issues: parsed.error.issues.map((i) => `${i.path?.join(".") || ""}: ${i.message}`),
      });
    }

    const data = parsed.data;
    console.log("[createActivity] parsed:", data);

    const created = await prisma.activity.create({ data });
    return res.status(201).json(created);
  } catch (err) {
    console.error("createActivity error:", err);
    return res.status(500).json({
      message: "Error guardando actividad",
      detail: err?.meta || err?.message || String(err),
    });
  }
};


/* ========================
   ACTUALIZAR
======================== */
export const updateActivity = async (req, res) => {
  try {
    const id = Number(req.params.id) || 0;

    // Validación parcial (solo lo que venga)
    const partialSchema = activitySchema.partial();
    const parsed = partialSchema.safeParse({
      ...req.body,
      capacity:
        req.body.capacity !== undefined
          ? Number(req.body.capacity)
          : undefined,
    });

    if (!parsed.success) {
      return res.status(400).json({
        message: "Datos inválidos",
        issues: parsed.error.issues.map((i) => i.message),
      });
    }

    const updated = await prisma.activity.update({
      where: { id },
      data: parsed.data,
    });
    res.json(updated);
  } catch (err) {
    console.error("updateActivity error:", err);
    return res.status(500).json({
      message: "Error actualizando actividad",
      detail: err?.meta || err?.message || String(err),
    });
  }
};

/* ========================
   BORRAR
======================== */
export const deleteActivity = async (req, res) => {
  try {
    const id = Number(req.params.id) || 0;
    const count = await prisma.registration.count({ where: { activityId: id } });
    if (count > 0) {
      return res
        .status(409)
        .json({ message: "No se puede borrar: tiene inscripciones." });
    }
    await prisma.activity.delete({ where: { id } });
    res.json({ ok: true });
  } catch (err) {
    console.error("deleteActivity error:", err);
    return res.status(500).json({
      message: "Error borrando actividad",
      detail: err?.meta || err?.message || String(err),
    });
  }
};
