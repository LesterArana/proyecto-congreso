import { useEffect, useState } from 'react';
import { api } from '../api'; // usa tu axios instance que ya agrega baseURL; añade header si tu requireAdmin lo necesita

export default function AdminAttendanceReport() {
  const [rows, setRows] = useState([]);
  const [msg, setMsg] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState('');
  const [detail, setDetail] = useState(null);

  async function loadSummary() {
    setLoading(true); setMsg(null);
    try {
      const res = await api.get('/reports/attendance', {
        // headers: { 'x-admin-key': import.meta.env.VITE_ADMIN_KEY } // si tu axios no lo incluye ya
      });
      setRows(res.data.rows || []);
    } catch (e) {
      setMsg('Error cargando resumen.');
    } finally {
      setLoading(false);
    }
  }

  async function loadDetail() {
    if (!selectedId) return;
    setLoading(true); setMsg(null);
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
    <div style={{ maxWidth: 960, margin: '20px auto', padding: 16 }}>
      <h2>Reporte de Asistencia</h2>
      {loading && <p>Cargando...</p>}
      {msg && <p style={{ color: '#991b1b' }}>{msg}</p>}

      <div style={{ overflowX: 'auto', marginTop: 12 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f3f4f6' }}>
              <th style={th}>ID</th>
              <th style={th}>Actividad</th>
              <th style={th}>Fecha</th>
              <th style={th}>Inscritos</th>
              <th style={th}>Asistencias</th>
              <th style={th}>%</th>
              <th style={th}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.activityId}>
                <td style={td}>{r.activityId}</td>
                <td style={td}>{r.title}</td>
                <td style={td}>{r.date ? new Date(r.date).toLocaleString() : '-'}</td>
                <td style={td}>{r.totalRegistrations}</td>
                <td style={td}>{r.totalAttendances}</td>
                <td style={td}>{(r.attendanceRate * 100).toFixed(1)}%</td>
                <td style={td}>
                  <button onClick={() => { setSelectedId(r.activityId); setDetail(null); }} style={btn}>
                    Ver detalle
                  </button>
                  <a href={`${api.defaults.baseURL}/reports/attendance/activities/${r.activityId}.csv`} style={{ ...btn, marginLeft: 8 }}>
                    Descargar CSV
                  </a>
                </td>
              </tr>
            ))}
            {rows.length === 0 && !loading && <tr><td style={td} colSpan={7}>Sin datos</td></tr>}
          </tbody>
        </table>
      </div>

      {selectedId && (
        <div style={{ marginTop: 24 }}>
          <h3>Detalle actividad #{selectedId}</h3>
          <button onClick={loadDetail} style={btn}>Cargar detalle</button>
          {detail && (
            <div style={{ marginTop: 12 }}>
              <div style={{ marginBottom: 8 }}>
                <b>{detail.activity?.title}</b> — {detail.activity?.date ? new Date(detail.activity.date).toLocaleString() : '-'}
              </div>
              <div style={{ marginBottom: 8 }}>
                Inscritos: {detail.totals?.totalRegistrations} | Asistencias: {detail.totals?.totalAttendances} | %: {(detail.totals?.attendanceRate * 100).toFixed(1)}%
              </div>
              <div style={{ maxHeight: 400, overflowY: 'auto', border: '1px solid #eee', borderRadius: 8 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#f3f4f6' }}>
                      <th style={th}>RegID</th>
                      <th style={th}>Nombre</th>
                      <th style={th}>Correo</th>
                      <th style={th}>Tipo</th>
                      <th style={th}>Asistió</th>
                      <th style={th}>Check-in</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detail.items.map(it => (
                      <tr key={it.registrationId}>
                        <td style={td}>{it.registrationId}</td>
                        <td style={td}>{it.userName}</td>
                        <td style={td}>{it.userEmail}</td>
                        <td style={td}>{it.userType}</td>
                        <td style={td}>{it.attended ? 'Sí' : 'No'}</td>
                        <td style={td}>{it.checkinAt ? new Date(it.checkinAt).toLocaleString() : '-'}</td>
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
  );
}

const th = { textAlign: 'left', padding: '8px', borderBottom: '1px solid #e5e7eb' };
const td = { padding: '8px', borderBottom: '1px solid #f3f4f6' };
const btn = { background: '#2563eb', color: '#fff', padding: '6px 10px', border: 'none', borderRadius: 8, cursor: 'pointer', textDecoration: 'none', display: 'inline-block' };
