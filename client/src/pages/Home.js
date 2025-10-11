// client/src/pages/Home.js
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import AgendaWidget from "../components/AgendaWidget";
import SpeakerCard from "../components/SpeakerCard";

export default function Home() {
  const [agenda, setAgenda] = useState([]);
  const [speakers, setSpeakers] = useState([]);
  const [msgAgenda, setMsgAgenda] = useState(null);
  const [msgSpeakers, setMsgSpeakers] = useState(null);

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
        {/* HERO */}
        <section className="rounded-2xl border border-white/20 shadow-soft p-6 bg-white/5 backdrop-blur-sm">
          <h1 className="text-3xl font-extrabold">Congreso de Tecnología — UMG</h1>
          <p className="text-blue-100 mt-1">
            Talleres, competencias y conferencias. Regístrate, recibe tu QR por correo y obtén tu diploma.
          </p>

          <div className="flex flex-wrap gap-2 mt-3">
            <div className="bg-white/10 border border-white/20 rounded-lg px-3 py-2">📍 Campus Central</div>
            <div className="bg-white/10 border border-white/20 rounded-lg px-3 py-2">📅 12–14 de noviembre</div>
            <div className="bg-white/10 border border-white/20 rounded-lg px-3 py-2">🎓 Estudiantes y egresados</div>
          </div>

          <div className="mt-4 flex gap-3">
            <Link
              to="/register"
              className="inline-flex items-center rounded-xl bg-white text-umgBlue px-4 py-2 font-semibold hover:brightness-95"
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
                ¿Cómo me inscribo? → Ve a <Link to="/register" className="text-umgBlue underline">Inscripciones</Link>.
              </li>
              <li>
                ¿Dónde veo resultados? → Visita <Link to="/results" className="text-umgBlue underline">Resultados</Link>.
              </li>
              <li>¿Habrá constancias? → Sí, se generan diplomas para asistentes (admin).</li>
            </ul>
          </div>
        </section>
      </div>
    </div>
  );
}
