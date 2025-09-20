// client/src/pages/ActivityDetail.js
import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { api } from "../api";

export default function ActivityDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [a, setA] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  useEffect(() => {
    setLoading(true);
    api.get(`/activities/${id}`)
      .then(res => setA(res.data))
      .catch(e => setErr(e?.response?.data?.message || "No se pudo cargar la actividad"))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div style={{ padding: 16 }}>Cargando…</div>;
  if (err) return <div style={{ padding: 16, color: "crimson" }}>{err}</div>;
  if (!a) return null;

  const fecha = new Date(a.date).toLocaleString();

  const goRegister = () => {
    // redirige al formulario con ?activityId=...
    navigate(`/register?activityId=${a.id}`);
  };

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: 16 }}>
      <p><Link to="/">{'<'} Volver</Link></p>
      <h2 style={{ margin: "8px 0" }}>{a.kind}: {a.title}</h2>
      <p style={{ color: "#555", margin: "4px 0" }}>{fecha}</p>
      <p style={{ marginTop: 12, whiteSpace: "pre-wrap" }}>{a.description || "Sin descripción."}</p>

      <div style={{
        marginTop: 16, padding: 12, border: "1px solid #eee",
        borderRadius: 10, display: "flex", gap: 16, alignItems: "center"
      }}>
        <div><b>Cupos:</b> {a.available}/{a.capacity}</div>
        <button
          onClick={goRegister}
          disabled={a.available === 0}
          style={{
            background: a.available === 0 ? "#9ca3af" : "#2563eb",
            color: "#fff", padding: "8px 14px", border: "none", borderRadius: 8, cursor: "pointer"
          }}
        >
          {a.available === 0 ? "Cupo lleno" : "Inscribirme"}
        </button>
      </div>
    </div>
  );
}
