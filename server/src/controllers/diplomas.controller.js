// server/src/controllers/diplomas.controller.js
import path from 'path';
import { fileURLToPath } from 'url';
import { PrismaClient } from '@prisma/client';
import { generateDiplomaPDF, toPublicUrl } from '../utils/diplomas.js';

const prisma = new PrismaClient();

// __dirname en ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * POST /diplomas/generate/:registrationId
 * Solo Admin (la ruta estará protegida).
 * Crea/actualiza el diploma para el par (userId, activityId) de esa inscripción.
 */
export async function generateForRegistration(req, res) {
  try {
    const registrationId = parseInt(req.params.registrationId, 10);
    if (Number.isNaN(registrationId)) {
      return res.status(400).json({ error: 'registrationId inválido' });
    }

    const registration = await prisma.registration.findUnique({
      where: { id: registrationId },
      include: { user: true, activity: true, attendance: true },
    });
    if (!registration) return res.status(404).json({ error: 'Registro no encontrado' });

    // Política opcional: exigir asistencia para generar diploma
    // if (!registration.attendance) return res.status(409).json({ error: 'Aún no tiene asistencia registrada.' });

    const absPath = await generateDiplomaPDF({
      registration,
      outDir: path.join(__dirname, '../../public/diplomas'),
    });
    const relUrl = toPublicUrl(absPath);

    // upsert: (userId, activityId)
    const existing = await prisma.diploma.findFirst({
      where: { userId: registration.userId, activityId: registration.activityId },
    });

    let diploma;
    if (!existing) {
      diploma = await prisma.diploma.create({
        data: {
          userId: registration.userId,
          activityId: registration.activityId,
          pdfPath: relUrl,
        },
      });
    } else {
      diploma = await prisma.diploma.update({
        where: { id: existing.id },
        data: { pdfPath: relUrl },
      });
    }

    return res.json({ message: 'Diploma generado', diploma, downloadUrl: relUrl });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Error generando diploma' });
  }
}

/**
 * POST /diplomas/generate/activity/:activityId?onlyAttended=true
 * Solo Admin. Genera diplomas para todas las inscripciones de una actividad.
 * Por defecto: solo para quienes tienen asistencia (onlyAttended=true).
 */
export async function generateForActivity(req, res) {
  try {
    const activityId = parseInt(req.params.activityId, 10);
    if (Number.isNaN(activityId)) return res.status(400).json({ error: 'activityId inválido' });

    const onlyAttended = String(req.query.onlyAttended ?? 'true').toLowerCase() !== 'false';

    const activity = await prisma.activity.findUnique({ where: { id: activityId } });
    if (!activity) return res.status(404).json({ error: 'Actividad no encontrada' });

    const regs = await prisma.registration.findMany({
      where: { activityId },
      include: { user: true, activity: true, attendance: true },
      orderBy: { createdAt: 'asc' },
    });

    let processed = 0;
    let created = 0;
    let updated = 0;
    let skipped = 0;
    const errors = [];

    for (const reg of regs) {
      try {
        if (onlyAttended && !reg.attendance) {
          skipped++;
          continue;
        }

        const absPath = await generateDiplomaPDF({
          registration: reg,
          outDir: path.join(__dirname, '../../public/diplomas'),
        });
        const relUrl = toPublicUrl(absPath);

        const existing = await prisma.diploma.findFirst({
          where: { userId: reg.userId, activityId: reg.activityId },
        });

        if (!existing) {
          await prisma.diploma.create({
            data: {
              userId: reg.userId,
              activityId: reg.activityId,
              pdfPath: relUrl,
            },
          });
          created++;
        } else {
          await prisma.diploma.update({
            where: { id: existing.id },
            data: { pdfPath: relUrl },
          });
          updated++;
        }

        processed++;
      } catch (e) {
        console.error('Bulk diploma error reg', reg.id, e?.message || e);
        errors.push({ registrationId: reg.id, error: e?.message || String(e) });
      }
    }

    return res.json({
      message: 'Generación por actividad finalizada',
      activityId,
      onlyAttended,
      counts: { processed, created, updated, skipped, errors: errors.length },
      errors,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Error generando diplomas por actividad' });
  }
}

/**
 * GET /diplomas/by-registration/:registrationId
 * Público (solo consulta).
 */
export async function getByRegistration(req, res) {
  try {
    const registrationId = parseInt(req.params.registrationId, 10);
    if (Number.isNaN(registrationId)) {
      return res.status(400).json({ error: 'registrationId inválido' });
    }

    const reg = await prisma.registration.findUnique({ where: { id: registrationId } });
    if (!reg) return res.status(404).json({ error: 'Registro no encontrado' });

    const diploma = await prisma.diploma.findFirst({
      where: { userId: reg.userId, activityId: reg.activityId },
    });
    if (!diploma) return res.status(404).json({ error: 'Diploma no encontrado' });

    return res.json({ diploma, downloadUrl: diploma.pdfPath });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Error obteniendo diploma' });
  }
}
