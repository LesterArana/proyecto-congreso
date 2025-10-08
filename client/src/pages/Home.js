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

  const heroBtn = {
    background: "#2563eb", color: "#fff", border: "none",
    borderRadius: 10, padding: "10px 14px", textDecoration: "none"
  };

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: 16 }}>
      {/* HERO */}
      <section style={{
        background: "#f8fafc", border: "1px solid #eef2ff",
        padding: 20, borderRadius: 14, marginBottom: 16
      }}>
        <h2 style={{ margin: 0 }}>Congreso de Tecnología</h2>
        <p style={{ color: "#334155" }}>
          Únete a talleres, competencias y charlas con invitados. Consulta la agenda y regístrate.
        </p>
        <div style={{ display: "flex", gap: 8 }}>
          <Link to="/register" style={heroBtn}>Inscribirme</Link>
          <Link to="/results" style={{ ...heroBtn, background: "#6b7280" }}>Resultados</Link>
        </div>
      </section>

      {/* AGENDA */}
      <section style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <h3 style={{ margin: 0 }}>Agenda</h3>
          <button onClick={loadAgenda} style={{ border: "1px solid #ddd", borderRadius: 8, background: "#fff", padding: "6px 10px" }}>
            Recargar
          </button>
        </div>

        {msgAgenda && (
          <div style={{
            padding: 10, borderRadius: 8,
            background: msgAgenda.ok ? "#dcfce7" : "#fee2e2",
            color: msgAgenda.ok ? "#065f46" : "#991b1b",
            marginBottom: 12
          }}>
            {msgAgenda.text}
          </div>
        )}

        {agenda.length > 0 ? (
          <AgendaWidget agenda={agenda} />
        ) : (
          <p style={{ color: "#6b7280" }}>Aún no hay agenda publicada.</p>
        )}
      </section>

      {/* PONENTES */}
      <section style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <h3 style={{ margin: 0 }}>Ponentes invitados</h3>
          <button onClick={loadSpeakers} style={{ border: "1px solid #ddd", borderRadius: 8, background: "#fff", padding: "6px 10px" }}>
            Recargar
          </button>
        </div>

        {msgSpeakers && (
          <div style={{
            padding: 10, borderRadius: 8,
            background: msgSpeakers.ok ? "#dcfce7" : "#fee2e2",
            color: msgSpeakers.ok ? "#065f46" : "#991b1b",
            marginBottom: 12
          }}>
            {msgSpeakers.text}
          </div>
        )}

        {speakers.length > 0 ? (
          <div style={{
            display: "grid",
            gap: 12,
            gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
          }}>
            {speakers.map((s) => <SpeakerCard key={s.id} s={s} />)}
          </div>
        ) : (
          <p style={{ color: "#6b7280" }}>Pronto publicaremos a los ponentes.</p>
        )}
      </section>

      {/* INFO EXTRA */}
      <section style={{ marginTop: 20 }}>
        <h3>Preguntas frecuentes</h3>
        <ul>
          <li>¿Cómo me inscribo? → Ve a <Link to="/register">Inscripciones</Link>.</li>
          <li>¿Dónde veo resultados? → Visita <Link to="/results">Resultados</Link>.</li>
          <li>¿Habrá constancias? → Sí, se generan diplomas para asistentes (admin).</li>
        </ul>
      </section>
    </div>
  );
}
