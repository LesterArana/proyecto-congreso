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

  useEffect(() => {
    load(); // carga inicial
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    load(); // recarga al cambiar año
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year]);

  return (
    <div className="min-h-screen bg-umgBlue text-white">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="bg-white text-slate-800 rounded-2xl shadow-soft border border-white/20 p-6">
          <h2 className="text-2xl font-bold text-umgBlue mb-4">Resultados</h2>

          {/* Filtros */}
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center mb-4">
            <select
              value={year}
              onChange={(e) => setYear(e.target.value)}
              title="Filtrar por año (opcional)"
              className="rounded-xl border-slate-300 focus:border-umgBlue focus:ring-umgBlue"
            >
              <option value="">Filtrar por año (opcional)</option>
              {yearsFromData.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
              {yearsFromData.length === 0 && (
                <>
                  <option value={new Date().getFullYear()}>
                    {new Date().getFullYear()}
                  </option>
                  <option value={new Date().getFullYear() - 1}>
                    {new Date().getFullYear() - 1}
                  </option>
                </>
              )}
            </select>

            <button
              onClick={load}
              disabled={loading}
              className={`inline-flex items-center justify-center rounded-xl px-4 py-2 font-semibold ${
                loading
                  ? "bg-slate-400 text-white cursor-not-allowed"
                  : "bg-umgBlue text-white hover:brightness-105"
              }`}
            >
              {loading ? "Cargando..." : "Aplicar"}
            </button>
          </div>

          {/* Mensajes */}
          {msg && (
            <div
              className={`mb-4 rounded-xl px-3 py-2 ${
                msg.ok
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : "bg-rose-50 text-rose-700 border border-rose-200"
              }`}
            >
              {msg.text}
            </div>
          )}

          {/* Grilla de ganadores */}
          <div className="grid gap-3 grid-cols-[repeat(auto-fill,minmax(260px,1fr))]">
            {items.map((w) => (
              <WinnerCard key={w.id} w={w} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
