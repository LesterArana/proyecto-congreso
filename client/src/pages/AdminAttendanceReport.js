// client/src/pages/AdminAttendanceReport.js
import { useEffect, useState } from 'react';
import { api } from '../api';

export default function AdminAttendanceReport() {
  const [rows, setRows] = useState([]);
  const [msg, setMsg] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState('');
  const [detail, setDetail] = useState(null);

  async function loadSummary() {
    setLoading(true);
    setMsg(null);
    try {
      const res = await api.get('/reports/attendance');
      setRows(res.data.rows || []);
    } catch (e) {
      setMsg('Error cargando resumen.');
    } finally {
      setLoading(false);
    }
  }

  async function loadDetail() {
    if (!selectedId) return;
    setLoading(true);
    setMsg(null);
    try {
      const res = await api.get(`/reports/attendance/activities/${selectedId}`);
      setDetail(res.data);
    } catch (e) {
      setMsg('Error cargando detalle.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadSummary(); }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="bg-white border border-slate-200 rounded-2xl shadow-soft p-6">
          <h2 className="text-2xl font-bold text-umgBlue">Reporte de Asistencia</h2>

          {loading && <p className="text-slate-500 mt-2">Cargando...</p>}
          {msg && <p className="text-rose-700 mt-2">{msg}</p>}

          {/* Tabla resumen */}
          <div className="overflow-x-auto mt-4">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-slate-700">
                <tr>
                  <th className="text-left px-3 py-2 border-b">ID</th>
                  <th className="text-left px-3 py-2 border-b">Actividad</th>
                  <th className="text-left px-3 py-2 border-b">Fecha</th>
                  <th className="text-left px-3 py-2 border-b">Inscritos</th>
                  <th className="text-left px-3 py-2 border-b">Asistencias</th>
                  <th className="text-left px-3 py-2 border-b">%</th>
                  <th className="text-left px-3 py-2 border-b">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.activityId} className="border-b">
                    <td className="px-3 py-2">{r.activityId}</td>
                    <td className="px-3 py-2">{r.title}</td>
                    <td className="px-3 py-2">
                      {r.date ? new Date(r.date).toLocaleString() : '-'}
                    </td>
                    <td className="px-3 py-2">{r.totalRegistrations}</td>
                    <td className="px-3 py-2">{r.totalAttendances}</td>
                    <td className="px-3 py-2">
                      {(r.attendanceRate * 100).toFixed(1)}%
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => { setSelectedId(r.activityId); setDetail(null); }}
                          className="inline-flex items-center rounded-xl bg-umgBlue text-white px-3 py-1.5 hover:brightness-105"
                        >
                          Ver detalle
                        </button>
                        <a
                          href={`${api.defaults.baseURL}/reports/attendance/activities/${r.activityId}.csv`}
                          className="inline-flex items-center rounded-xl border px-3 py-1.5 hover:bg-slate-50"
                        >
                          Descargar CSV
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && !loading && (
                  <tr>
                    <td className="px-3 py-4 text-center text-slate-500" colSpan={7}>
                      Sin datos
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Detalle por actividad */}
          {selectedId && (
            <div className="mt-8">
              <div className="flex items-center gap-3">
                <h3 className="text-xl font-semibold text-umgBlue m-0">
                  Detalle actividad #{selectedId}
                </h3>
                <button
                  onClick={loadDetail}
                  className="inline-flex items-center rounded-xl bg-umgBlue text-white px-3 py-1.5 hover:brightness-105"
                >
                  Cargar detalle
                </button>
              </div>

              {detail && (
                <div className="mt-4">
                  <div className="mb-2">
                    <b>{detail.activity?.title}</b> —{' '}
                    {detail.activity?.date
                      ? new Date(detail.activity.date).toLocaleString()
                      : '-'}
                  </div>
                  <div className="mb-3">
                    Inscritos: {detail.totals?.totalRegistrations} | Asistencias:{' '}
                    {detail.totals?.totalAttendances} | %:{' '}
                    {(detail.totals?.attendanceRate * 100).toFixed(1)}%
                  </div>

                  <div className="max-h-[420px] overflow-y-auto border border-slate-200 rounded-xl">
                    <table className="min-w-full text-sm">
                      <thead className="bg-slate-50 text-slate-700 sticky top-0">
                        <tr>
                          <th className="text-left px-3 py-2 border-b">RegID</th>
                          <th className="text-left px-3 py-2 border-b">Nombre</th>
                          <th className="text-left px-3 py-2 border-b">Correo</th>
                          <th className="text-left px-3 py-2 border-b">Tipo</th>
                          <th className="text-left px-3 py-2 border-b">Asistió</th>
                          <th className="text-left px-3 py-2 border-b">Check-in</th>
                        </tr>
                      </thead>
                      <tbody>
                        {detail.items.map((it) => (
                          <tr key={it.registrationId} className="border-b">
                            <td className="px-3 py-2">{it.registrationId}</td>
                            <td className="px-3 py-2">{it.userName}</td>
                            <td className="px-3 py-2">{it.userEmail}</td>
                            <td className="px-3 py-2">{it.userType}</td>
                            <td className="px-3 py-2">{it.attended ? 'Sí' : 'No'}</td>
                            <td className="px-3 py-2">
                              {it.checkinAt ? new Date(it.checkinAt).toLocaleString() : '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
