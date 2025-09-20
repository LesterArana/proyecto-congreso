// client/src/pages/AdminActivity.js
import { useEffect, useState } from "react";
import { api } from "../api";
import { useParams, useNavigate } from "react-router-dom";

export default function AdminActivity() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [activity, setActivity] = useState(null);
  const [regs, setRegs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState(null); // mensajes suaves en UI

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setMsg(null);

    Promise.all([
      api.get(`/activities`),                     // público
      api.get(`/activities/${id}/registrations`)  // protegido (x-admin-key)
    ])
      .then(([actsRes, regsRes]) => {
        if (!mounted) return;
        const a = actsRes.data.find(x => String(x.id) === String(id));
        setActivity(a || null);
        setRegs(regsRes.data || []);
      })
      .catch((err) => {
        if (!mounted) return;
        const status = err?.response?.status;
        const text = err?.response?.data?.message || err?.message || "Error cargando inscripciones";
        setMsg(text);
        // si no autorizado, manda a login admin
        if (status === 401) {
          navigate("/admin-login", { replace: true });
        }
      })
      .finally(() => mounted && setLoading(false));

    return () => { mounted = false; };
  }, [id, navigate]);

  const exportCsv = async () => {
    try {
      setMsg(null);
      // Usar api (con interceptor) + blob; así viaja x-admin-key
      const res = await api.get(`/activities/${id}/registrations.csv`, {
        responseType: "blob"
      });
      const blob = new Blob([res.data], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const ts = new Date().toISOString().slice(0,19).replace(/[:T]/g,"-");
      a.download = `actividad-${id}-inscripciones-${ts}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      const status = err?.response?.status;
      const text = err?.response?.data?.message || "No se pudo exportar el CSV";
      setMsg(text);
      if (status === 401) navigate("/admin-login", { replace: true });
    }
  };

  if (loading) return <div style={{ padding: 16 }}>Cargando...</div>;

  return (
    <div style={{ maxWidth: 960, margin: "0 auto", padding: 16 }}>
      <h2>Admin — Actividad #{id}</h2>

      {activity && (
        <p>
          <b>{activity.kind}</b>: {activity.title} — {new Date(activity.date).toLocaleString()}
        </p>
      )}

      <div style={{ marginTop: 12, marginBottom: 12 }}>
        <button
          onClick={exportCsv}
          style={{ background:"#0ea5e9", color:"#fff", padding:"8px 12px", borderRadius:8, border:"none", cursor:"pointer" }}
        >
          Exportar CSV
        </button>
      </div>

      {msg && (
        <div style={{ marginBottom: 12, padding: 10, borderRadius: 8, background: "#fee2e2", color: "#991b1b" }}>
          {msg}
        </div>
      )}

      <table width="100%" cellPadding={8} style={{ borderCollapse:"collapse" }}>
        <thead>
          <tr style={{ background:"#f3f4f6" }}>
            <th align="left">Reg.ID</th>
            <th align="left">Estado</th>
            <th align="left">Fecha</th>
            <th align="left">Nombre</th>
            <th align="left">Correo</th>
            <th align="left">Colegio</th>
            <th align="left">QR</th>
          </tr>
        </thead>
        <tbody>
          {regs.map(r => (
            <tr key={r.id} style={{ borderTop:"1px solid #eee" }}>
              <td>{r.id}</td>
              <td>{r.status}</td>
              <td>{new Date(r.createdAt).toLocaleString()}</td>
              <td>{r.user.name}</td>
              <td>{r.user.email}</td>
              <td>{r.user.school || "-"}</td>
              <td>{r.qr ? <a href={r.qr} target="_blank" rel="noreferrer">Ver</a> : "-"}</td>
            </tr>
          ))}
          {regs.length === 0 && (
            <tr><td colSpan={7} align="center" style={{ color:"#6b7280" }}>Sin inscripciones aún</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
