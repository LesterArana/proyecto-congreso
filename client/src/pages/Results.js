import { useEffect, useState } from "react";
import { api } from "../api";

export default function Results() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState(null);
  const [year, setYear] = useState(""); // opcional filtro por año

  async function load() {
    try {
      setLoading(true);
      setMsg(null);
      const url = year ? `/winners?year=${encodeURIComponent(year)}` : "/winners";
      const res = await api.get(url);
      setItems(res?.data?.items || []);
    } catch (e) {
      setMsg(e?.response?.data?.error || "Error cargando resultados.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  // Agrupar por actividad
  const groups = items.reduce((acc, w) => {
    const key = `${w.activity.id}`;
    if (!acc[key]) acc[key] = { activity: w.activity, winners: [] };
    acc[key].winners.push(w);
    return acc;
  }, {});

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", padding: 16 }}>
      <h2>Resultados</h2>

      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <input
          type="number"
          placeholder="Filtrar por año (opcional)"
          value={year}
          onChange={(e) => setYear(e.target.value)}
          style={{ padding: 8, border: "1px solid #ddd", borderRadius: 8 }}
        />
        <button
          onClick={load}
          style={{ background: "#2563eb", color: "#fff", padding: "6px 12px", border: "none", borderRadius: 8 }}
        >
          Aplicar
        </button>
      </div>

      {msg && (
        <div style={{ background: "#fee2e2", color: "#991b1b", padding: 10, borderRadius: 8, marginBottom: 12 }}>
          {msg}
        </div>
      )}

      {loading ? (
        <p>Cargando…</p>
      ) : Object.keys(groups).length === 0 ? (
        <p>No hay ganadores publicados aún.</p>
      ) : (
        <div style={{ display: "grid", gap: 24 }}>
          {Object.values(groups).map(({ activity, winners }) => (
            <section key={activity.id} style={{ border: "1px solid #eee", borderRadius: 12, padding: 16 }}>
              <header style={{ marginBottom: 8 }}>
                <h3 style={{ margin: 0 }}>
                  {activity.title}{" "}
                  <small style={{ color: "#6b7280", fontWeight: 400 }}>
                    — {new Date(activity.date).toLocaleDateString()} ({activity.kind})
                  </small>
                </h3>
              </header>

              <div style={{ display: "grid", gap: 12 }}>
                {winners
                  .sort((a, b) => a.place - b.place)
                  .map((w) => (
                    <article key={w.id} style={{ display: "flex", gap: 12, alignItems: "center" }}>
                      <div style={{
                        width: 64, height: 64, borderRadius: 8, background: "#f3f4f6",
                        display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden"
                      }}>
                        {w.photoUrl ? (
                          <img alt={w.user?.name || "Ganador"} src={w.photoUrl}
                               style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        ) : (
                          <span style={{ color: "#6b7280" }}>Sin foto</span>
                        )}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600 }}>
                          {w.place}° — {w.user?.name} <span style={{ color: "#6b7280" }}>({w.user?.email})</span>
                        </div>
                        {w.description && (
                          <div style={{ color: "#374151", fontSize: 14, marginTop: 4 }}>{w.description}</div>
                        )}
                      </div>
                    </article>
                  ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
