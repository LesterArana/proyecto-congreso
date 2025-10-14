import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import AgendaWidget from "../components/AgendaWidget";
import SpeakerCard from "../components/SpeakerCard";

export default function Home() {
  const [agenda, setAgenda] = useState([]);
  const [speakers, setSpeakers] = useState([]);
  const [msgAgenda, setMsgAgenda] = useState(null);
  const [msgSpeakers, setMsgSpeakers] = useState(null);
  const [logoError, setLogoError] = useState(false);

  // Base pública robusta para /public (dev/prod)
  const PUBLIC_BASE = useMemo(() => {
    const fromEnv = process.env.REACT_APP_PUBLIC_BASE_URL;
    if (fromEnv) return fromEnv.replace(/\/$/, "");
    const fromApi = api?.defaults?.baseURL || "http://localhost:4000/api";
    return fromApi.replace(/\/api\/?$/, "");
  }, []);

  // Cambia a .png si tu archivo real es PNG
  const logoUrl = `${PUBLIC_BASE}/public/logo-umg.jpg`;

  async function loadAgenda() {
    setMsgAgenda(null);
    try {
      const r = await api.get("/site/agenda");
      setAgenda(r.data || []);
    } catch {
      setMsgAgenda({ ok: false, text: "No se pudo cargar la agenda (usaré ejemplo)." });
      setAgenda([]);
    }
  }

  async function loadSpeakers() {
    setMsgSpeakers(null);
    try {
      const r = await api.get("/site/speakers");
      setSpeakers(r.data || []);
    } catch {
      setMsgSpeakers({ ok: false, text: "No se pudo cargar ponentes (usaré ejemplo)." });
      setSpeakers([]);
    }
  }

  useEffect(() => {
    loadAgenda();
    loadSpeakers();
  }, []);

  return (
    <div className="min-h-screen bg-umgBlue text-white">
      <div className="max-w-[1100px] mx-auto px-4 py-8">
        {/* HERO / Encabezado institucional */}
        <section className="rounded-2xl border border-white/20 shadow-soft p-6 bg-white text-slate-800">
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
                Congreso de Tecnología — UMG
              </h1>
              <p className="text-slate-600 mt-1 mb-0">
                Talleres, competencias y conferencias. Regístrate, recibe tu QR y obtén tu diploma.
              </p>

              {/* Chips de info */}
              <div className="flex flex-wrap gap-2 mt-3">
                <div className="bg-slate-100 border border-slate-200 rounded-lg px-3 py-2">📍 Campus Central</div>
                <div className="bg-slate-100 border border-slate-200 rounded-lg px-3 py-2">📅 12–14 de noviembre</div>
                <div className="bg-slate-100 border border-slate-200 rounded-lg px-3 py-2">🎓 Estudiantes y egresados</div>
              </div>

              {/* CTAs */}
              <div className="mt-4 flex gap-3">
                <Link
                  to="/register"
                  className="inline-flex items-center rounded-xl bg-umgBlue text-white px-4 py-2 font-semibold hover:brightness-110"
                >
                  Inscribirme
                </Link>
                <Link
                  to="/results"
                  className="inline-flex items-center rounded-xl bg-[--umg-red] text-white px-4 py-2 font-semibold hover:brightness-105"
                >
                  Resultados
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* AGENDA */}
        <section className="mt-6">
          <div className="bg-white text-slate-800 rounded-2xl shadow-soft border border-white/20 p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-umgBlue m-0">Agenda</h3>
              <button
                onClick={loadAgenda}
                className="inline-flex items-center rounded-xl border px-3 py-2 hover:bg-slate-50"
              >
                Recargar
              </button>
            </div>

            {msgAgenda && (
              <div
                className={`mt-3 rounded-xl px-3 py-2 ${
                  msgAgenda.ok
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : "bg-rose-50 text-rose-700 border border-rose-200"
                }`}
              >
                {msgAgenda.text}
              </div>
            )}

            <div className="mt-3">
              {agenda.length > 0 ? (
                <AgendaWidget agenda={agenda} />
              ) : (
                <p className="text-slate-600">Aún no hay agenda publicada.</p>
              )}
            </div>
          </div>
        </section>

        {/* PONENTES */}
        <section className="mt-6">
          <div className="bg-white text-slate-800 rounded-2xl shadow-soft border border-white/20 p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-umgBlue m-0">Ponentes invitados</h3>
              <button
                onClick={loadSpeakers}
                className="inline-flex items-center rounded-xl border px-3 py-2 hover:bg-slate-50"
              >
                Recargar
              </button>
            </div>

            {msgSpeakers && (
              <div
                className={`mt-3 rounded-xl px-3 py-2 ${
                  msgSpeakers.ok
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : "bg-rose-50 text-rose-700 border border-rose-200"
                }`}
              >
                {msgSpeakers.text}
              </div>
            )}

            <div className="mt-3">
              {speakers.length > 0 ? (
                <div className="grid gap-3 grid-cols-[repeat(auto-fill,minmax(260px,1fr))]">
                  {speakers.map((s) => (
                    <SpeakerCard key={s.id} s={s} />
                  ))}
                </div>
              ) : (
                <p className="text-slate-600">Pronto publicaremos a los ponentes.</p>
              )}
            </div>
          </div>
        </section>

        {/* INFO EXTRA */}
        <section className="mt-6">
          <div className="bg-white text-slate-800 rounded-2xl shadow-soft border border-white/20 p-6">
            <h3 className="text-xl font-bold text-umgBlue">Preguntas frecuentes</h3>
            <ul className="text-slate-700 list-disc pl-5 mt-2">
              <li>
                ¿Cómo me inscribo? → Ve a{" "}
                <Link to="/register" className="text-umgBlue underline">Inscripciones</Link>.
              </li>
              <li>
                ¿Dónde veo resultados? → Visita{" "}
                <Link to="/results" className="text-umgBlue underline">Resultados</Link>.
              </li>
              <li>¿Habrá constancias? → Sí, se generan diplomas para asistentes (admin).</li>
            </ul>
          </div>
        </section>

        {/* Pie institucional */}
        <div className="text-center text-white/80 text-xs mt-6">
          © {new Date().getFullYear()} Universidad Mariano Gálvez de Guatemala — Congreso de Tecnología
        </div>
      </div>
    </div>
  );
}
