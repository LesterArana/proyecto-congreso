// server/src/controllers/diplomas.controller.js
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import path from 'path';
import { fileURLToPath } from 'url';

import { generateDiplomaPDF, toPublicUrl, writeFileEnsuringDir } from '../utils/diplomas.js';
import { sendMail } from '../utils/mailer.js';

const prisma = new PrismaClient();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

/* =========================================================
 * GET /api/diplomas/by-registration/:regId   (público)
 *  - Devuelve 404 si no existe diploma aún
 * ========================================================= */
export async function getDiplomaByRegistration(req, res) {
  try {
    const regId = Number(req.params.regId);
    if (!regId) return res.status(400).json({ error: 'registrationId inválido' });

    const diploma = await prisma.diploma.findFirst({
      where: { user: { registrations: { some: { id: regId } } } }, // por si acaso
    });

    // Mejor: buscar por FK exacta (userId + activityId de la inscripción)
    const reg = await prisma.registration.findUnique({
      where: { id: regId },
      include: { user: true, activity: true },
    });
    if (!reg) return res.status(404).json({ error: 'Inscripción no encontrada' });

    const dip = await prisma.diploma.findFirst({
      where: { userId: reg.userId, activityId: reg.activityId },
    });

    if (!dip) return res.status(404).json({ error: 'Aún no hay diploma para esta inscripción' });

    return res.json({
      diploma: dip,
      downloadUrl: toPublicUrl(dip.pdfPath),
    });
  } catch (err) {
    console.error('getDiplomaByRegistration:', err);
    return res.status(500).json({ error: 'Error obteniendo diploma' });
  }
}

/* =========================================================
 * POST /api/diplomas/generate/:regId   (ADMIN)
 *  - Genera/actualiza diploma y ENVÍA por correo el PDF
 * ========================================================= */
export async function generateDiplomaForRegistration(req, res) {
  try {
    const regId = Number(req.params.regId);
    if (!regId) return res.status(400).json({ error: 'registrationId inválido' });

    const reg = await prisma.registration.findUnique({
      where: { id: regId },
      include: { user: true, activity: true },
    });
    if (!reg) return res.status(404).json({ error: 'Inscripción no encontrada' });

    // (Opcional) exigir asistencia:
    // if (reg.status !== 'CHECKED_IN') return res.status(409).json({ error: 'Solo asistentes pueden recibir diploma' });

    // 1) Generar/actualizar PDF
    const fileName = `diploma-u${reg.userId}-a${reg.activityId}.pdf`;
    const pdfRelPath = path.join('diplomas', fileName);        // se guardará en /public/diplomas
    const pdfAbsPath = path.resolve(__dirname, '..', 'public', 'diplomas', fileName);

    const pdfBuffer = await generateDiplomaPDF({
      userName: reg.user.name,
      userEmail: reg.user.email,
      activityTitle: reg.activity.title,
      activityDate: reg.activity.date,
    });
    // Asegurar carpeta y escribir archivo
    await writeFileEnsuringDir(pdfAbsPath, pdfBuffer); // si no usas Bun, reemplaza por fs/promises.writeFile

    // upsert diploma
    const existing = await prisma.diploma.findFirst({
      where: { userId: reg.userId, activityId: reg.activityId },
    });
    let record;
    if (existing) {
      record = await prisma.diploma.update({
        where: { id: existing.id },
        data: { pdfPath: pdfRelPath },
      });
    } else {
      record = await prisma.diploma.create({
        data: { userId: reg.userId, activityId: reg.activityId, pdfPath: pdfRelPath },
      });
    }

    // 2) Enviar correo con el PDF adjunto (no romper si falla)
    let emailError = null;
    try {
      const html = `
        <h2>Diploma de participación</h2>
        <p>Hola <b>${reg.user.name}</b>,</p>
        <p>Adjuntamos tu <b>diploma</b> por la actividad:</p>
        <ul>
          <li><b>${reg.activity.title}</b></li>
          <li>${new Date(reg.activity.date).toLocaleString()}</li>
        </ul>
        <p>También puedes descargarlo desde tu perfil en <i>Mis inscripciones</i>.</p>
        <hr/>
        <small>Congreso de Tecnología</small>
      `;
      await sendMail({
        to: reg.user.email,
        subject: `Diploma — ${reg.activity.title}`,
        html,
        attachments: [
          { filename: fileName, path: pdfAbsPath, contentType: 'application/pdf' },
        ],
      });
    } catch (e) {
      console.error('✉️  Error enviando diploma:', e?.message || e);
      emailError = e?.message || String(e);
    }

    return res.status(201).json({
      message: 'Diploma generado',
      diploma: record,
      downloadUrl: toPublicUrl(record.pdfPath),
      emailError,  // null si ok
    });
  } catch (err) {
    console.error('generateDiplomaForRegistration:', err);
    return res.status(500).json({ error: 'Error generando diploma' });
  }
}

/* =========================================================
 * POST /api/diplomas/generate/activity/:activityId?onlyAttended=true  (ADMIN)
 *  - Genera en lote y ENVÍA correos
 * ========================================================= */
export async function generateDiplomasForActivity(req, res) {
  try {
    const activityId = Number(req.params.activityId);
    if (!activityId) return res.status(400).json({ error: 'activityId inválido' });

    const onlyAttended = String(req.query.onlyAttended || 'true') === 'true';

    const regs = await prisma.registration.findMany({
      where: {
        activityId,
        ...(onlyAttended ? { status: 'CHECKED_IN' } : {}),
      },
      include: { user: true, activity: true },
      orderBy: { createdAt: 'asc' },
    });

    let processed = 0, created = 0, updated = 0, skipped = 0;
    const errors = [];

    for (const reg of regs) {
      processed++;

      try {
        const fileName = `diploma-u${reg.userId}-a${reg.activityId}.pdf`;
        const pdfRelPath = path.join('diplomas', fileName);
        const pdfAbsPath = path.resolve(__dirname, '..', 'public', 'diplomas', fileName);

        const pdfBuffer = await generateDiplomaPDF({
          userName: reg.user.name,
          userEmail: reg.user.email,
          activityTitle: reg.activity.title,
          activityDate: reg.activity.date,
        });
        await Bun.write(pdfAbsPath, pdfBuffer); // si no usas Bun, cambia por fs.writeFile

        const existing = await prisma.diploma.findFirst({
          where: { userId: reg.userId, activityId: reg.activityId },
        });

        let action = 'created';
        if (existing) {
          await prisma.diploma.update({
            where: { id: existing.id },
            data: { pdfPath: pdfRelPath },
          });
          action = 'updated';
        } else {
          await prisma.diploma.create({
            data: { userId: reg.userId, activityId: reg.activityId, pdfPath: pdfRelPath },
          });
        }

        if (action === 'created') created++; else updated++;

        // Enviar email (no bloquear lote si falla)
        try {
          const html = `
            <h2>Diploma de participación</h2>
            <p>Hola <b>${reg.user.name}</b>, adjuntamos tu diploma por la actividad:</p>
            <ul>
              <li><b>${reg.activity.title}</b></li>
              <li>${new Date(reg.activity.date).toLocaleString()}</li>
            </ul>
            <p>También puedes descargarlo desde <i>Mis inscripciones</i>.</p>
            <hr/>
            <small>Congreso de Tecnología</small>
          `;
          await sendMail({
            to: reg.user.email,
            subject: `Diploma — ${reg.activity.title}`,
            html,
            attachments: [
              { filename: fileName, path: pdfAbsPath, contentType: 'application/pdf' },
            ],
          });
        } catch (mailErr) {
          console.error(`✉️  Error email reg#${reg.id}:`, mailErr?.message || mailErr);
          errors.push({ regId: reg.id, emailError: mailErr?.message || String(mailErr) });
        }

      } catch (e) {
        skipped++;
        console.error(`❌ Error generando diploma reg#${reg.id}:`, e?.message || e);
        errors.push({ regId: reg.id, error: e?.message || String(e) });
      }
    }

    return res.json({
      message: 'Proceso de diplomas finalizado',
      counts: { processed, created, updated, skipped },
      errors,   // para ver a quién no se le pudo enviar correo o PDF
    });
  } catch (err) {
    console.error('generateDiplomasForActivity:', err);
    return res.status(500).json({ error: 'Error generando diplomas en lote' });
  }
}
