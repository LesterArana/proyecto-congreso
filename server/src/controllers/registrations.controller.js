// server/src/controllers/registrations.controller.js
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { generateQrPng } from '../utils/qr.js';
import { sendMail } from '../utils/mailer.js';

const prisma = new PrismaClient();

/* =========================
 *  Helper: normaliza rutas guardadas a URL pública servida desde /public
 * ========================= */
function toPublicUrl(p) {
  if (!p) return null;
  const norm = String(p).replace(/\\/g, '/');
  const idx = norm.lastIndexOf('/public/');
  if (idx !== -1) return norm.substring(idx + '/public'.length); // -> /qrs/... | /diplomas/...
  return norm.startsWith('/') ? norm : `/${norm}`;               // ya era relativa; asegurar '/'
}

/* =========================
 *  Usuarios externos
 * ========================= */
const externalUserSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  school: z.string().min(2),
});

export const createExternalUser = async (req, res, next) => {
  try {
    const data = externalUserSchema.parse(req.body);
    const user = await prisma.user.create({
      data: { name: data.name, email: data.email, type: 'EXTERNAL', school: data.school },
    });
    res.status(201).json(user);
  } catch (err) {
    next(err);
  }
};

/* =========================
 *  Actividades
 * ========================= */
export const listActivities = async (req, res, next) => {
  try {
    const activities = await prisma.activity.findMany({ orderBy: { date: 'asc' } });
    res.json(activities);
  } catch (err) {
    next(err);
  }
};

/* Resumen con cupos disponibles */
export const activitiesSummary = async (req, res, next) => {
  try {
    const activities = await prisma.activity.findMany({
      orderBy: { date: 'asc' },
      include: { _count: { select: { registrations: true } } },
    });

    const data = activities.map((a) => ({
      id: a.id,
      kind: a.kind,
      title: a.title,
      description: a.description,
      date: a.date,
      capacity: a.capacity,
      registered: a._count.registrations,
      available: Math.max(0, a.capacity - a._count.registrations),
    }));

    res.json(data);
  } catch (err) {
    next(err);
  }
};

/* =========================
 *  Inscripciones
 * ========================= */
export const createRegistration = async (req, res, next) => {
  try {
    // datos esperados: name, email, school?, activityId
    const schema = z.object({
      name: z.string().min(2),
      email: z.string().email(),
      school: z.string().optional(),
      activityId: z.number().int().positive(),
    });
    const data = schema.parse(req.body);

    // 1) asegurar usuario (si no existe, lo crea como EXTERNAL)
    let user = await prisma.user.findUnique({ where: { email: data.email } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          name: data.name,
          email: data.email,
          type: 'EXTERNAL',
          school: data.school || null,
        },
      });
    }

    // 2) validar actividad
    const activity = await prisma.activity.findUnique({ where: { id: data.activityId } });
    if (!activity) return res.status(404).json({ message: 'Actividad no encontrada' });

    // 3) evitar duplicados (mismo user + misma activity)
    const exists = await prisma.registration.findFirst({
      where: { userId: user.id, activityId: data.activityId },
    });
    if (exists) return res.status(409).json({ message: 'Ya estás inscrito en esta actividad' });

    // 4) validar CUPOS
    const inscritos = await prisma.registration.count({ where: { activityId: data.activityId } });
    if (inscritos >= activity.capacity) {
      return res.status(409).json({ message: 'Cupo lleno para esta actividad' });
    }

    // 5) crear inscripción
    const reg = await prisma.registration.create({
      data: { userId: user.id, activityId: data.activityId, status: 'PENDING' },
    });

    // =========================
    // 6) Generar QR + enviar correo (sin romper si falla)
    // =========================
    let qrPublicPath = null;
    let emailPreview = null;
    let emailMode = null;
    let emailError = null;

    try {
      const payload = JSON.stringify({
        regId: reg.id,
        user: { id: user.id, name: user.name, email: user.email },
        activity: { id: activity.id, title: activity.title, date: activity.date },
        issuedAt: new Date().toISOString(),
      });

      const fileName = `reg-${reg.id}.png`;
      qrPublicPath = await generateQrPng(payload, fileName); // p.ej. /qrs/reg-12.png

      // guardar ruta del QR en DB (ruta relativa servida desde /public)
      await prisma.registration.update({
        where: { id: reg.id },
        data: { qrCodePath: qrPublicPath },
      });

      // correo
      const when = new Date(activity.date).toLocaleString();
      const html = `
        <h2>Inscripción confirmada</h2>
        <p>Hola <b>${user.name}</b>, tu inscripción fue creada para:</p>
        <ul>
          <li><b>Actividad:</b> ${activity.title}</li>
          <li><b>Fecha y hora:</b> ${when}</li>
        </ul>
        <p>Adjuntamos tu <b>código QR</b>. También puedes abrirlo aquí: <a href="${qrPublicPath}">${qrPublicPath}</a></p>
        <hr/>
        <small>Congreso Tech</small>
      `;

      const sent = await sendMail({
        to: user.email,
        subject: `Inscripción — ${activity.title}`,
        html,
        attachments: [
          { filename: fileName, path: `public/qrs/${fileName}`, contentType: 'image/png' },
        ],
      });

      emailPreview = sent.preview || null;
      emailMode = sent.mode || null;     // "smtp" | "ethereal" | "stream" | "error"
      emailError = sent.error || null;   // null si OK; texto si hubo problema
    } catch (auxErr) {
      console.error('QR/Email error:', auxErr?.message || auxErr);
      emailError = auxErr?.message || String(auxErr);
    }

    // Respuesta (aunque falle mail/qr, la inscripción ya existe)
    return res.status(201).json({
      message: 'Inscripción creada',
      registrationId: reg.id,
      qr: qrPublicPath,       // ej: /qrs/reg-12.png
      emailPreview,           // URL si modo ethereal
      emailMode,              // info del modo de envío
      emailError,             // null si todo bien
    });
  } catch (err) {
    next(err);
  }
};


// --- CHECK-IN (robusto) ---
export const checkin = async (req, res, next) => {
  try {
    // Acepta regId (string o number) o qrPayload
    const schema = z.object({
      regId: z.coerce.number().int().positive().optional(), // <-- coerce a number
      qrPayload: z.string().optional(),
    }).refine(v => v.regId || v.qrPayload, {
      message: 'Debes enviar regId o qrPayload',
      path: ['regId', 'qrPayload'],
    });

    const data = schema.parse(req.body);

    // Si viene el payload del QR, extraer regId
    let regId = data.regId ?? null;
    if (!regId && data.qrPayload) {
      try {
        const parsed = JSON.parse(data.qrPayload);
        if (typeof parsed.regId === 'number') regId = parsed.regId;
        else return res.status(400).json({ message: 'qrPayload sin regId válido' });
      } catch {
        return res.status(400).json({ message: 'qrPayload inválido (no JSON)' });
      }
    }

    // Buscar la inscripción + datos útiles (sin incluir Attendance)
    const reg = await prisma.registration.findUnique({
      where: { id: regId },
      include: {
        user: true,
        activity: true,
      },
    });
    if (!reg) return res.status(404).json({ message: 'Inscripción no encontrada' });

    // Consultar asistencia por la FK única (evita depender de include)
    const existingAtt = await prisma.attendance.findUnique({
      where: { registrationId: reg.id },
    });

    if (existingAtt) {
      return res.status(200).json({
        message: 'Ya estaba chequeado',
        alreadyChecked: true,
        checkinAt: existingAtt.checkinAt,
        registrationId: reg.id,
        user: { id: reg.user.id, name: reg.user.name, email: reg.user.email },
        activity: { id: reg.activity.id, title: reg.activity.title, date: reg.activity.date },
      });
    }

    // Crear asistencia y actualizar estado
    const att = await prisma.attendance.create({
      data: { registrationId: reg.id },
    });

    await prisma.registration.update({
      where: { id: reg.id },
      data: { status: 'CHECKED_IN' },
    });

    return res.status(201).json({
      message: 'Check-in registrado',
      registrationId: reg.id,
      checkinAt: att.checkinAt,
      user: { id: reg.user.id, name: reg.user.name, email: reg.user.email },
      activity: { id: reg.activity.id, title: reg.activity.title, date: reg.activity.date },
    });
  } catch (err) {
    next(err);
  }
};

// --- Asistencias por actividad ---
export const listAttendancesByActivity = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id) || id <= 0) {
      return res.status(400).json({ message: 'activityId inválido' });
    }

    // Trae asistencias cuyo registration.activityId = id
    const rows = await prisma.attendance.findMany({
      where: { registration: { activityId: id } },
      include: {
        registration: {
          include: { user: true },
        },
      },
      orderBy: { checkinAt: 'desc' },
    });

    // Respuesta limpia
    const data = rows.map(r => ([
      {
        id: r.id,
        checkinAt: r.checkinAt,
        user: {
          id: r.registration.user.id,
          name: r.registration.user.name,
          email: r.registration.user.email,
        },
        registrationId: r.registrationId,
      }
    ])).flat();

    res.json(data);
  } catch (err) {
    next(err);
  }
};

export const listRegistrationsByActivity = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ message: 'activityId inválido' });

    const regs = await prisma.registration.findMany({
      where: { activityId: id },
      include: { user: true },
      orderBy: { createdAt: 'desc' },
    });

    const data = regs.map(r => ({
      id: r.id,
      status: r.status,          // PENDING / CHECKED_IN
      createdAt: r.createdAt,
      user: { id: r.user.id, name: r.user.name, email: r.user.email, school: r.user.school },
      qr: r.qrCodePath || null,
    }));

    res.json(data);
  } catch (err) { next(err); }
};

export const exportRegistrationsCsv = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ message: 'activityId inválido' });

    const regs = await prisma.registration.findMany({
      where: { activityId: id },
      include: { user: true },
      orderBy: { createdAt: 'desc' },
    });

    const rows = [
      ['registrationId','status','createdAt','name','email','school','qr'],
      ...regs.map(r => [
        r.id,
        r.status,
        r.createdAt.toISOString(),
        r.user.name,
        r.user.email,
        r.user.school || '',
        r.qrCodePath || ''
      ])
    ];

    const csv = rows.map(cols =>
      cols.map(v => {
        const s = String(v ?? '');
        return /[",\n]/.test(s) ? `"${s.replace(/"/g,'""')}"` : s;
      }).join(',')
    ).join('\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="activity-${id}-registrations.csv"`);
    res.status(200).send('\uFEFF' + csv); // BOM para Excel
  } catch (err) { next(err); }
};

/* =========================
 *  Inscripciones por email (ENRIQUECIDA con diplomaUrl + qr normalizado)
 * ========================= */
export const listRegistrationsByEmail = async (req, res, next) => {
  try {
    const schema = z.object({ email: z.string().email() });
    const parsed = schema.safeParse({ email: req.query.email });
    if (!parsed.success) return res.status(400).json({ message: 'Email inválido' });
    const { email } = parsed.data;

    // Usuario
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.json({ email, registrations: [] });

    // Inscripciones de ese usuario (incluye actividad y asistencia)
    const regs = await prisma.registration.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      include: { activity: true, attendance: true },
    });

    if (!regs.length) return res.json({ email, registrations: [] });

    // Diplomas existentes para (userId, activityId)
    const activityIds = Array.from(new Set(regs.map(r => r.activityId)));
    const diplomas = await prisma.diploma.findMany({
      where: { userId: user.id, activityId: { in: activityIds } },
      select: { activityId: true, pdfPath: true },
    });
    const diplomaByActivity = new Map(diplomas.map(d => [d.activityId, d.pdfPath]));

    // Respuesta enriquecida
    const data = regs.map(r => ({
      id: r.id,
      status: r.status,
      createdAt: r.createdAt,
      attended: !!r.attendance,
      attendedAt: r.attendance?.checkinAt || null,
      qr: toPublicUrl(r.qrCodePath) || null,
      diplomaUrl: toPublicUrl(diplomaByActivity.get(r.activityId)) || null,
      activity: {
        id: r.activity.id,
        title: r.activity.title,
        kind: r.activity.kind,
        date: r.activity.date,
      },
    }));

    res.json({ email, registrations: data });
  } catch (err) { next(err); }
};

export const getActivityById = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ message: 'activityId inválido' });

    const activity = await prisma.activity.findUnique({
      where: { id },
      include: { _count: { select: { registrations: true } } },
    });
    if (!activity) return res.status(404).json({ message: 'Actividad no encontrada' });

    const available = Math.max(0, activity.capacity - activity._count.registrations);

    res.json({
      id: activity.id,
      kind: activity.kind,
      title: activity.title,
      description: activity.description,
      date: activity.date,
      capacity: activity.capacity,
      registered: activity._count.registrations,
      available,
    });
  } catch (err) {
    next(err);
  }
};
