import { useEffect, useState } from "react";
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

export default function AdminDashboard() {
  const [activities, setActivities] = useState([]);
  const [loadingActs, setLoadingActs] = useState(true);

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

  return (
    <div className="min-h-screen bg-umgBlue text-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white text-slate-800 rounded-3xl shadow-lg border border-white/20 p-6 sm:p-8">
          <div className="flex items-center gap-4 mb-4">
            <img
              src="/public/logo-umg.jpg"
              alt="UMG"
              className="w-10 h-10 rounded-full object-cover"
              loading="lazy"
            />
            <div>
              <h2 className="text-balance text-[clamp(1.5rem,2.5vw,2rem)] font-bold text-umgBlue m-0">
                Panel de Administración
              </h2>
              <p className="text-slate-600 m-0">
                Congreso de Tecnología — Universidad Mariano Gálvez de Guatemala
              </p>
            </div>
          </div>

          <div className="grid gap-4 grid-cols-[repeat(auto-fill,minmax(220px,1fr))] mb-8">
            <CardLink to="/checkin" emoji="🎥" title="Check-in" desc="Escanea códigos QR para registrar asistencia."/>
            <CardLink to="/admin/activities" emoji="📋" title="Inscripciones" desc="Gestiona actividades e inscripciones."/>
            <CardLink to="/admin/reports" emoji="📊" title="Reportes" desc="Asistencia y exportación CSV."/>
            <CardLink to="/admin/diplomas" emoji="🏆" title="Diplomas" desc="Genera y envía diplomas."/>
            <CardLink to="/admin/winners" emoji="🥇" title="Resultados" desc="Publica ganadores."/>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-3">
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
              <ul className="list-disc pl-5 text-slate-700 leading-relaxed">
                {activities.slice(0, 6).map((a) => (
                  <li key={a.id} className="mb-1">
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
        </div>
      </div>
    </div>
  );
}
