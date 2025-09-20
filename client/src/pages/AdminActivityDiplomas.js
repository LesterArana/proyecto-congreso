import { useEffect, useState } from "react";
import { api } from "../api";

export default function AdminActivityDiplomas() {
  const [activityId, setActivityId] = useState("");
  const [rows, setRows] = useState([]);
  const [msg, setMsg] = useState(null);   // { ok: boolean, text: string } | string | null
  const [loading, setLoading] = useState(false);
  const [onlyAttended, setOnlyAttended] = useState(true);

  // Carga inscripciones; si keepMsg=true no borra el mensaje actual
  async function loadRegs({ keepMsg = false } = {}) {
    if (!activityId) return;
    setLoading(true);
    if (!keepMsg) setMsg(null);
    try {
      const res = await api.get(`/activities/${activityId}/registrations`); // x-admin-key por interceptor
      setRows(res.data || []);
    } catch (e) {
      setMsg({ ok: false, text: e?.response?.data?.error || "Error cargando inscripciones." });
    } finally {
      setLoading(false);
    }
  }

  async function genOne(regId) {
    setLoading(true);
    // no limpiamos msg aquí; lo actualizamos al final
    try {
      await api.post(`/diplomas/generate/${regId}`); // protegido por x-admin-key
      setMsg({ ok: true, text: `✅ Diploma generado para registro #${regId}.` });
      await loadRegs({ keepMsg: true }); // ⬅️ no borrar el mensaje recién puesto
    } catch (e) {
      setMsg({ ok: false, text: e?.response?.data?.error || "❌ No se pudo generar el diploma." });
    } finally {
      setLoading(false);
    }
  }

  async function genBulk() {
    if (!activityId) {
      setMsg({ ok: false, text: "Ingresa el ID de la actividad." });
      return;
    }
    setLoading(true);
    try {
      const res = await api.post(
        `/diplomas/generate/activity/${activityId}?onlyAttended=${onlyAttended}`
      );
      const c = res?.data?.counts || {};
      const processed = Number(c.processed || 0);
      const created = Number(c.created || 0);
      const updated = Number(c.updated || 0);
      const skipped = Number(c.skipped || 0);

      if (created + updated > 0) {
        setMsg({
          ok: true,
          text: `✅ Diplomas creados/actualizados: ${created + updated}. (procesados=${processed}, nuevos=${created}, actualizados=${updated}, omitidos=${skipped})`,
        });
      } else {
        const reason = onlyAttended
          ? "No hay asistentes registrados para esta actividad."
          : "No se encontró a quién generar.";
        setMsg({
          ok: false,
          text: `⚠️ No se generó ningún diploma. ${reason} (procesados=${processed}, omitidos=${skipped})`,
        });
      }

      await loadRegs({ keepMsg: true }); // ⬅️ mantener el mensaje visible
    } catch (e) {
      setMsg({ ok: false, text: e?.response?.data?.error || "❌ Error generando diplomas en lote." });
    } finally {
      setLoading(false);
    }
  }

  // (Opcional) auto-ocultar mensaje después de 5s
  useEffect(() => {
    if (!msg) return;
    const t = setTimeout(() => setMsg(null), 5000);
    return () => clearTimeout(t);
  }, [msg]);

  const th = { textAlign: 'left', padding: 8, borderBottom: '1px solid #e5e7eb' };
  const td = { padding: 8, borderBottom: '1px solid #f3f4f6' };
  const btn = { background: '#2563eb', color: '#fff', padding: '6px 10px', border: 'none', borderRadius: 8, cursor: 'pointer', textDecoration: 'none' };

  return (
    <div style={{ maxWidth: 960, margin: '20px auto', padding: 16 }}>
      <h2>Diplomas por actividad (Admin)</h2>

      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <input
          type="number"
          placeholder="Activity ID"
          value={activityId}
          onChange={(e) => setActivityId(e.target.value)}
          style={{ padding: 8, border: '1px solid #ddd', borderRadius: 8 }}
        />
        <button onClick={() => loadRegs()} style={btn} disabled={!activityId || loading}>Cargar</button>
      </div>

      <div style={{ marginBottom: 12 }}>
        <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <input type="checkbox" checked={onlyAttended} onChange={(e) => setOnlyAttended(e.target.checked)} />
          Solo asistentes
        </label>
        <button onClick={genBulk} style={{ ...btn, marginLeft: 12 }} disabled={!activityId || loading}>
          Generar diplomas (lote)
        </button>
      </div>

      {msg && (
        <div style={{
          padding: 10, borderRadius: 8,
          background: (typeof msg === 'object' ? msg.ok : false) ? '#dcfce7' : '#fee2e2',
          color: (typeof msg === 'object' ? msg.ok : false) ? '#065f46' : '#991b1b',
          marginBottom: 12
        }}>
          {typeof msg === 'string' ? msg : msg.text}
        </div>
      )}

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f3f4f6' }}>
              <th style={th}>RegID</th>
              <th style={th}>Usuario</th>
              <th style={th}>Email</th>
              <th style={th}>Estado</th>
              <th style={th}>Asistió</th>
              <th style={th}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td style={td}>{r.id}</td>
                <td style={td}>{r.user?.name}</td>
                <td style={td}>{r.user?.email}</td>
                <td style={td}>{r.status}</td>
                <td style={td}>{r.status === 'CHECKED_IN' ? 'Sí' : 'No'}</td>
                <td style={td}>
                  <button onClick={() => genOne(r.id)} style={btn} disabled={loading}>
                    Generar diploma
                  </button>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td style={td} colSpan={6}>Sin datos</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
