// client/src/pages/Results.js
import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "../api";

export default function Results() {
  const [search, setSearch] = useSearchParams();
  const [items, setItems] = useState([]);     // ganadores
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState(null);       // mensajes de error/ok
  const [year, setYear] = useState(search.get("year") || "");
  const [activityId, setActivityId] = useState(search.get("activityId") || "");
  const [activities, setActivities] = useState([]);

  const years = useMemo(() => {
    // sacar años posibles desde items (o últimos 5 por defecto)
    const ys = new Set(
      items
        .map((w) => w.activity?.date ? new Date(w.activity.date).getFullYear() : null)
        .filter(Boolean)
    );
    if (ys.size === 0) {
      const now = new Date().getFullYear();
      return [now, now - 1, now - 2, now - 3, now - 4];
    }
    return Array.from(ys).sort((a, b) => b - a);
  }, [items]);

  async function load() {
    setLoading(true);
    setMsg(null);
    try {
      const params = {};
      if (year) params.year = year;
      if (activityId) params.activityId = activityId;

      const res = await api.get("/winners", { params }); // { items: [...] }
      setItems(res?.data?.items || []);
      if (!res?.data?.items?.length) {
        setMsg({ ok: true, text: "No hay ganadores publicados aún." });
      }
    } catch (e) {
      setMsg({ ok: false, text: "Error listando ganadores" });
    } finally {
      setLoading(false);
    }
  }

  async function loadActivities() {
    try {
      const r = await api.get("/activities");
      setActivities(r.data || []);
    } catch {
      setActivities([]);
    }
  }

  useEffect(() => {
    loadActivities();
  }, []);

  useEffect(() => {
    // persistimos filtros en la URL
    const q = {};
    if (year) q.year = year;
    if (activityId) q.activityId = activityId;
    setSearch(q, { replace: true });
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year, activityId]);

  const card = {
    border: "1px solid #eee",
    borderRadius: 12,
    padding: 12,
    background: "#fff",
  };

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: 16 }}>
      <h2>Resultados</h2>

      {/* Filtros */}
      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 12 }}>
        <select
          value={year}
          onChange={(e) => setYear(e.target.value)}
          style={{ padding: 8, borderRadius: 8, border: "1px solid #ddd" }}
          title="Filtrar por año (opcional)"
        >
          <option value="">Filtrar por año (opcional)</option>
          {years.map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>

        <select
          value={activityId}
          onChange={(e) => setActivityId(e.target.value)}
          style={{ padding: 8, borderRadius: 8, border: "1px solid #ddd" }}
          title="Filtrar por actividad (opcional)"
        >
          <option value="">Filtrar por actividad (opcional)</option>
          {activities.map((a) => (
            <option key={a.id} value={a.id}>
              #{a.id} — {a.title}
            </option>
          ))}
        </select>

        <button
          onClick={() => { setYear(""); setActivityId(""); }}
          style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #ddd", background: "#fff" }}
        >
          Limpiar
        </button>
      </div>

      {loading && <p>Cargando…</p>}

      {msg && (
        <div style={{
          padding: 10, borderRadius: 8,
          background: msg.ok ? "#dcfce7" : "#fee2e2",
          color: msg.ok ? "#065f46" : "#991b1b",
          marginBottom: 12
        }}>
          {msg.text}
        </div>
      )}

      <div style={{ display: "grid", gap: 12 }}>
        {items.map((w) => (
          <div key={w.id} style={card}>
            <div style={{ display: "flex", gap: 12 }}>
              {/* Foto (si hay) */}
              {w.photoUrl ? (
                <img
                  src={w.photoUrl}
                  alt="Foto del ganador"
                  style={{ width: 120, height: 90, objectFit: "cover", borderRadius: 8 }}
                />
              ) : (
                <div style={{
                  width: 120, height: 90, borderRadius: 8, background: "#f3f4f6",
                  display: "flex", alignItems: "center", justifyContent: "center", color: "#9ca3af"
                }}>
                  Sin foto
                </div>
              )}

              {/* Detalle */}
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700 }}>
                  {w.place}° lugar — {w.user?.name || "Usuario"} 
                </div>
                <div style={{ color: "#6b7280", fontSize: 14 }}>
                  {w.activity?.kind}:{" "}
                  {w.activity ? (
                    <Link to={`/activity/${w.activity.id}`}>{w.activity.title}</Link>
                  ) : "Actividad"}
                  {" · "}
                  {w.activity?.date ? new Date(w.activity.date).toLocaleString() : ""}
                </div>
                {w.description && (
                  <div style={{ marginTop: 6 }}>{w.description}</div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {(!loading && !items.length) && (
        <p style={{ color: "#6b7280", marginTop: 10 }}>No hay ganadores publicados aún.</p>
      )}
    </div>
  );
}
