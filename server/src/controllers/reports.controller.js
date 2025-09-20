// server/src/controllers/reports.controller.js
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

/**
 * GET /api/reports/attendance
 * Devuelve consolidado por actividad:
 * - activityId, title, date
 * - totalRegistrations, totalAttendances, attendanceRate (0..1)
 */
export async function attendanceSummary(req, res) {
  try {
    // 1) Conteo total de inscripciones por actividad
    const regs = await prisma.registration.groupBy({
      by: ['activityId'],
      _count: { _all: true },
    });

    // 2) Conteo de asistencias por actividad (registration con attendance != null)
    const att = await prisma.registration.groupBy({
      by: ['activityId'],
      where: { attendance: { isNot: null } },
      _count: { _all: true },
    });

    // 3) Traer actividades para título/fecha
    const activityIds = Array.from(new Set(regs.map(r => r.activityId).concat(att.map(a => a.activityId))));
    const activities = await prisma.activity.findMany({
      where: { id: { in: activityIds.length ? activityIds : [-1] } },
      select: { id: true, title: true, date: true },
    });
    const activityMap = new Map(activities.map(a => [a.id, a]));

    // 4) Unir datos
    const attMap = new Map(att.map(a => [a.activityId, a._count._all]));
    const rows = regs.map(r => {
      const a = activityMap.get(r.activityId);
      const totalRegs = r._count._all;
      const totalAtt = attMap.get(r.activityId) || 0;
      const rate = totalRegs > 0 ? totalAtt / totalRegs : 0;
      return {
        activityId: r.activityId,
        title: a?.title || `Actividad ${r.activityId}`,
        date: a?.date || null,
        totalRegistrations: totalRegs,
        totalAttendances: totalAtt,
        attendanceRate: rate,
      };
    }).sort((x, y) => (x.date || '').toString().localeCompare((y.date || '').toString()));

    return res.json({ rows, generatedAt: new Date().toISOString() });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Error generando resumen de asistencia' });
  }
}

/**
 * GET /api/reports/attendance/activities/:id
 * Detalle por actividad:
 * - Totales (regs/att/porcentaje)
 * - Lista de inscripciones con asistencia (true/false) y timestamps
 */
export async function attendanceByActivity(req, res) {
  try {
    const activityId = parseInt(req.params.id, 10);
    if (Number.isNaN(activityId)) return res.status(400).json({ error: 'activityId inválido' });

    // Actividad
    const activity = await prisma.activity.findUnique({
      where: { id: activityId },
      select: { id: true, title: true, date: true },
    });
    if (!activity) return res.status(404).json({ error: 'Actividad no encontrada' });

    // Inscripciones con usuario y (si hay) asistencia
    const regs = await prisma.registration.findMany({
      where: { activityId },
      include: {
        user: { select: { id: true, name: true, email: true, type: true, school: true } },
        attendance: true, // { id, registrationId, checkinAt } | null
      },
      orderBy: { createdAt: 'asc' },
    });

    const totalRegistrations = regs.length;
    const totalAttendances = regs.filter(r => r.attendance !== null).length;
    const attendanceRate = totalRegistrations ? totalAttendances / totalRegistrations : 0;

    const items = regs.map(r => ({
      registrationId: r.id,
      userId: r.userId,
      userName: r.user?.name || '',
      userEmail: r.user?.email || '',
      userType: r.user?.type || null,
      userSchool: r.user?.school || null,
      qrCodePath: r.qrCodePath || null,
      status: r.status,
      attended: !!r.attendance,
      checkinAt: r.attendance?.checkinAt || null,
      createdAt: r.createdAt,
    }));

    return res.json({
      activity,
      totals: { totalRegistrations, totalAttendances, attendanceRate },
      items,
      generatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Error generando detalle de asistencia' });
  }
}

/**
 * GET /api/reports/attendance/activities/:id.csv
 * Exporta CSV simple (encabezados + filas)
 */
export async function attendanceByActivityCsv(req, res) {
  try {
    const activityId = parseInt(req.params.id, 10);
    if (Number.isNaN(activityId)) return res.status(400).json({ error: 'activityId inválido' });

    const regs = await prisma.registration.findMany({
      where: { activityId },
      include: { user: true, attendance: true, activity: { select: { title: true } } },
      orderBy: { createdAt: 'asc' },
    });

    const header = [
      'registrationId',
      'activityId',
      'activityTitle',
      'userId',
      'userName',
      'userEmail',
      'userType',
      'userSchool',
      'status',
      'attended',
      'checkinAt',
      'registeredAt',
    ].join(',');

    const rows = regs.map(r => ([
      r.id,
      r.activityId,
      csvSafe(r.activity?.title || ''),
      r.userId,
      csvSafe(r.user?.name || ''),
      csvSafe(r.user?.email || ''),
      r.user?.type || '',
      csvSafe(r.user?.school || ''),
      r.status,
      r.attendance ? '1' : '0',
      r.attendance?.checkinAt ? new Date(r.attendance.checkinAt).toISOString() : '',
      r.createdAt ? new Date(r.createdAt).toISOString() : '',
    ].join(',')));

    const csv = [header, ...rows].join('\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="attendance_activity_${activityId}.csv"`);
    return res.send(csv);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Error exportando CSV' });
  }
}

function csvSafe(val) {
  const s = String(val ?? '');
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}
