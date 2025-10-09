// client/src/pages/AdminDashboard.js
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";

function CardLink({ to, emoji, title, desc }) {
  return (
    <Link
      to={to}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 8,
        padding: 16,
        background: "#f9fafb",
        border: "1px solid #eee",
        borderRadius: 12,
        textDecoration: "none",
        color: "#111",
        boxShadow: "0 2px 6px rgba(0,0,0,0.06)",
        transition: "transform .15s ease, box-shadow .15s ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.style.boxShadow = "0 6px 14px rgba(0,0,0,0.12)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "0 2px 6px rgba(0,0,0,0.06)";
      }}
    >
      <div style={{ fontSize: 28 }}>{emoji}</div>
      <div style={{ fontWeight: 700, fontSize: 16 }}>{title}</div>
      <div style={{ color: "#6b7280", fontSize: 14 }}>{desc}</div>
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
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: 20 }}>
      <h2 style={{ marginBottom: 6 }}>Panel de Administración</h2>
      <p style={{ marginBottom: 18, color: "#374151" }}>
        Desde aquí puedes gestionar check-ins, inscripciones, reportes, diplomas y resultados.
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 16,
          marginBottom: 24,
        }}
      >
        <CardLink
          to="/checkin"
          emoji="🎥"
          title="Check-in"
          desc="Escanea códigos QR para registrar asistencia."
        />
        {/* 👇 aquí estaba /admin, lo cambiamos a /admin/activities */}
        <CardLink
          to="/admin/activities"
          emoji="📋"
          title="Inscripciones"
          desc="Revisa inscripciones por actividad."
        />
        <CardLink
          to="/admin/reports"
          emoji="📊"
          title="Reportes"
          desc="Asistencias y descarga de CSV."
        />
        <CardLink
          to="/admin/diplomas"
          emoji="🏆"
          title="Diplomas"
          desc="Generar en lote y enviar por correo."
        />
        <CardLink
          to="/admin/winners"
          emoji="🥇"
          title="Resultados"
          desc="Gestiona ganadores y publicaciones."
        />
      </div>

      <div
        style={{
          background: "#fff",
          border: "1px solid #eee",
          borderRadius: 12,
          padding: 16,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
          <span style={{ fontSize: 18 }}>⚡</span>
          <h3 style={{ margin: 0, fontSize: 18 }}>Accesos rápidos a actividades</h3>
        </div>

        {loadingActs ? (
          <div style={{ color: "#6b7280" }}>Cargando actividades…</div>
        ) : activities.length === 0 ? (
          <div style={{ color: "#6b7280" }}>No hay actividades registradas aún.</div>
        ) : (
          <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.9 }}>
            {activities.slice(0, 6).map((a) => (
              <li key={a.id}>
                <Link to={`/admin/activity/${a.id}`}>
                  #{a.id} — {a.title}
                </Link>{" "}
                <span style={{ color: "#6b7280", fontSize: 13 }}>
                  ({new Date(a.date).toLocaleString()})
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
