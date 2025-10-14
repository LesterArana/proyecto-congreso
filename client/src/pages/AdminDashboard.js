import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";

function CardLink({ to, emoji, title, desc }) {
  return (
    <Link
      to={to}
      className="flex flex-col gap-2 p-5 bg-white/90 border border-slate-200 rounded-2xl shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-200 text-slate-800 no-underline"
    >
      <div className="text-3xl">{emoji}</div>
      <div className="font-bold text-lg text-umgBlue">{title}</div>
      <div className="text-slate-500 text-sm">{desc}</div>
    </Link>
  );
}

function Stat({ label, value, hint }) {
  return (
    <div className="flex-1 bg-white/90 border border-slate-200 rounded-2xl p-4 text-center shadow-sm">
      <div className="text-2xl font-extrabold text-umgBlue">{value}</div>
      <div className="text-slate-600 text-sm">{label}</div>
      {hint && <div className="text-slate-400 text-xs mt-1">{hint}</div>}
    </div>
  );
}

export default function AdminDashboard() {
  const [activities, setActivities] = useState([]);
  const [loadingActs, setLoadingActs] = useState(true);
  const [logoError, setLogoError] = useState(false);

  // 1) Base pública MUY defensiva
  const PUBLIC_BASE = useMemo(() => {
    // a) si defines REACT_APP_PUBLIC_BASE_URL en el frontend, úsala
    if (process.env.REACT_APP_PUBLIC_BASE_URL) {
      return process.env.REACT_APP_PUBLIC_BASE_URL.replace(/\/$/, "");
    }
    // b) intenta derivar desde axios baseURL si termina en /api
    const base = api?.defaults?.baseURL || "http://localhost:4000/api";
    if (/\/api\/?$/.test(base)) return base.replace(/\/api\/?$/, "");
    // c) último recurso
    return "http://localhost:4000";
  }, []);

  // 2) Ruta del logo — CAMBIA a .png si tu archivo real es png
  const logoUrl = `${PUBLIC_BASE}/public/logo-umg.jpg`;

  // Log de diagnóstico
  console.log("[AdminDashboard] PUBLIC_BASE =", PUBLIC_BASE);
  console.log("[AdminDashboard] logoUrl =", logoUrl);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get("/activities");
        setActivities(res.data || []);
      } catch {
        setActivities([]);
      } finally {
        setLoadingActs(false);
      }
    })();
  }, []);

  const now = Date.now();
  const total = activities.length;
  const upcoming = activities.filter(a => new Date(a.date).getTime() >= now).length;
  const finished = total - upcoming;

  return (
    <div className="min-h-screen bg-umgBlue text-white">
      {/* --- Debug banner para confirmar que el componente monta --- */}
      

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Encabezado institucional */}
        <div className="bg-white text-slate-800 rounded-3xl shadow-lg border border-white/20 p-6 md:p-8 mb-6">
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
                Panel de Administración
              </h1>
              <p className="text-slate-600 mt-1 mb-0">
                Congreso de Tecnología — Gestión de actividades, inscripciones, check-in, diplomas y reportes.
              </p>
            </div>
          </div>

          {/* Estadísticas rápidas */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6">
            <Stat label="Actividades totales" value={loadingActs ? "…" : total} />
            <Stat label="Próximas" value={loadingActs ? "…" : upcoming} />
            <Stat label="Finalizadas" value={loadingActs ? "…" : finished} />
          </div>
        </div>

        {/* Tarjetas principales */}
        <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 mb-8">
          <CardLink
            to="/checkin"
            emoji="🎥"
            title="Check-in"
            desc="Escanea códigos QR para registrar asistencia."
          />
          <CardLink
            to="/admin/activities"
            emoji="📋"
            title="Inscripciones"
            desc="Revisa y administra actividades e inscripciones."
          />
          <CardLink
            to="/admin/reports"
            emoji="📊"
            title="Reportes"
            desc="Genera reportes de asistencia y exporta CSV."
          />
          <CardLink
            to="/admin/diplomas"
            emoji="🏆"
            title="Diplomas"
            desc="Genera y envía diplomas en lote por correo."
          />
          <CardLink
            to="/admin/winners"
            emoji="🥇"
            title="Resultados"
            desc="Gestiona ganadores y publicaciones oficiales."
          />
        </div>

        {/* Accesos rápidos */}
        <div className="bg-white text-slate-800 rounded-3xl shadow-lg border border-white/20 p-6">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-xl">⚡</span>
            <h3 className="text-xl font-semibold text-umgBlue m-0">
              Accesos rápidos a actividades
            </h3>
          </div>

          {loadingActs ? (
            <div className="text-slate-500">Cargando actividades…</div>
          ) : activities.length === 0 ? (
            <div className="text-slate-500">No hay actividades registradas aún.</div>
          ) : (
            <ul className="list-disc list-inside text-slate-700 leading-relaxed">
              {activities.slice(0, 8).map((a) => (
                <li key={a.id}>
                  <Link
                    to={`/admin/activity/${a.id}`}
                    className="text-umgBlue font-medium hover:underline"
                  >
                    #{a.id} — {a.title}
                  </Link>{" "}
                  <span className="text-slate-500 text-sm">
                    ({new Date(a.date).toLocaleString()})
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Pie institucional */}
        <div className="text-center text-white/80 text-xs mt-6">
          © {new Date().getFullYear()} Universidad Mariano Gálvez de Guatemala — Congreso de Tecnología
        </div>
      </div>
    </div>
  );
}
