// client/src/pages/Results.js
import { useEffect, useMemo, useState } from "react";
import { api } from "../api";
import WinnerCard from "../components/WinnerCard";

export default function Results() {
  const [items, setItems] = useState([]);
  const [year, setYear] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);

  const yearsFromData = useMemo(() => {
    const ys = new Set();
    for (const w of items) {
      if (w.activity?.date) ys.add(new Date(w.activity.date).getFullYear());
    }
    return Array.from(ys).sort((a, b) => b - a);
  }, [items]);

  async function load() {
    setLoading(true);
    setMsg(null);
    try {
      const params = {};
      if (year) params.year = Number(year);
      const res = await api.get("/winners", { params });
      setItems(res.data?.items || []);
      if (!res.data?.items?.length) {
        setMsg({ ok: true, text: "No hay ganadores publicados aún." });
      }
    } catch (e) {
      setMsg({ ok: false, text: "Error listando ganadores" });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); /* carga inicial */ }, []); // eslint-disable-line
  useEffect(() => { load(); /* recarga al cambiar año */ }, [year]); // eslint-disable-line

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: 16 }}>
      <h2 style={{ marginBottom: 12 }}>Resultados</h2>

      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 12 }}>
        <select
          value={year}
          onChange={(e) => setYear(e.target.value)}
          style={{ padding: 8, borderRadius: 8, border: "1px solid #ddd" }}
          title="Filtrar por año (opcional)"
        >
          <option value="">Filtrar por año (opcional)</option>
          {/* Años detectados desde los datos ya cargados */}
          {yearsFromData.map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
          {/* fallback por si está vacío el listado inicial */}
          {yearsFromData.length === 0 && (
            <>
              <option value={new Date().getFullYear()}>{new Date().getFullYear()}</option>
              <option value={new Date().getFullYear() - 1}>{new Date().getFullYear() - 1}</option>
            </>
          )}
        </select>
        <button
          onClick={load}
          disabled={loading}
          style={{ background: "#2563eb", color: "#fff", padding: "8px 14px", border: "none", borderRadius: 8, cursor: "pointer" }}
        >
          {loading ? "Cargando..." : "Aplicar"}
        </button>
      </div>

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

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
        gap: 12
      }}>
        {items.map((w) => <WinnerCard key={w.id} w={w} />)}
      </div>
    </div>
  );
}
