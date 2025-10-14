import { useEffect, useMemo, useState } from "react";
import { api } from "../api";
import WinnerCard from "../components/WinnerCard";

export default function Results() {
  const [items, setItems] = useState([]);
  const [year, setYear] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);
  const [logoError, setLogoError] = useState(false);

  // Base pública robusta para /public (funciona en dev/prod)
  const PUBLIC_BASE = useMemo(() => {
    const fromEnv = process.env.REACT_APP_PUBLIC_BASE_URL;
    if (fromEnv) return fromEnv.replace(/\/$/, "");
    const fromApi = api?.defaults?.baseURL || "http://localhost:4000/api";
    return fromApi.replace(/\/api\/?$/, "");
  }, []);

  // Cambia a .png si tu archivo real es PNG
  const logoUrl = `${PUBLIC_BASE}/public/logo-umg.jpg`;

  // Derivar años desde los datos
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
      const list = res.data?.items || [];

      // Ordenar: por fecha desc, luego por place asc
      list.sort((a, b) => {
        const da = a.activity?.date ? new Date(a.activity.date).getTime() : 0;
        const db = b.activity?.date ? new Date(b.activity.date).getTime() : 0;
        if (db !== da) return db - da;
        const pa = a.place ?? 999;
        const pb = b.place ?? 999;
        return pa - pb;
      });

      setItems(list);

      if (!list.length) {
        setMsg({ ok: true, text: "No hay ganadores publicados aún." });
      }
    } catch (_e) {
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
        {/* Encabezado institucional */}
        <section className="bg-white text-slate-800 rounded-2xl shadow-soft border border-white/20 p-6 mb-4">
          <div className="flex items-center gap-4 md:gap-6">
            {!logoError ? (
              <img
                src={logoUrl}
                alt="Escudo UMG"
                className="w-16 h-16 md:w-20 md:h-20 rounded-xl object-cover border border-slate-200"
                onError={() => setLogoError(true)}
              />
            ) : (
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-xl border border-rose-300 bg-rose-50 text-rose-800 text-xs flex items-center justify-center p-2">
                No se pudo cargar<br />/public/logo-umg.jpg
              </div>
            )}
            <div>
              <div className="text-xs uppercase tracking-wide text-slate-500">
                Universidad Mariano Gálvez de Guatemala
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-umgBlue m-0">
                Resultados oficiales — Congreso de Tecnología
              </h1>
              <p className="text-slate-600 mt-1 mb-0">
                Consulta a los ganadores por actividad y filtra por año.
              </p>
            </div>
          </div>
        </section>

        {/* Contenido principal */}
        <div className="bg-white text-slate-800 rounded-2xl shadow-soft border border-white/20 p-6">
          {/* Filtros */}
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center mb-4">
            <select
              value={year}
              onChange={(e) => setYear(e.target.value)}
              title="Filtrar por año (opcional)"
              className="rounded-xl border border-slate-300 px-3 py-2 focus:border-umgBlue focus:ring-umgBlue outline-none"
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

        {/* Pie institucional */}
        <div className="text-center text-white/80 text-xs mt-6">
          © {new Date().getFullYear()} Universidad Mariano Gálvez de Guatemala — Congreso de Tecnología
        </div>
      </div>
    </div>
  );
}
