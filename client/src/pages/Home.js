// client/src/pages/Home.js
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";

export default function Home() {
  const [activities, setActivities] = useState([]);

  useEffect(() => {
    api.get("/activities/summary")
      .then(res => setActivities(res.data))
      .catch(() => setActivities([]));
  }, []);

  return (
    <div style={{ maxWidth: 960, margin: "0 auto", padding: 16 }}>
      <section style={{ padding: "24px 0" }}>
        <h1 style={{ fontSize: 28, marginBottom: 8 }}>Congreso Tech</h1>
        <p style={{ color: "#555", marginBottom: 16 }}>
          Talleres y competencias para estudiantes. ¡Regístrate y asegura tu cupo!
        </p>
        <Link
          to="/register"
          style={{
            background: "#2563eb",
            color: "white",
            padding: "10px 16px",
            borderRadius: 10,
            textDecoration: "none",
          }}
        >
          Inscribirme
        </Link>
      </section>

      <section style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: 20, marginBottom: 12 }}>Actividades</h2>
        {activities.length === 0 && <p>No hay actividades cargadas aún.</p>}
        <div style={{ display: "grid", gap: 12 }}>
          {activities.map(a => (
            <div key={a.id} style={{ border: "1px solid #eee", borderRadius: 10, padding: 12 }}>
              <div style={{ fontWeight: 600 }}>
                {a.kind}: {a.title}
              </div>
              <div style={{ color: "#555" }}>
                {new Date(a.date).toLocaleString()} — Cupos: {a.available}/{a.capacity}
              </div>
              <div style={{ marginTop: 8 }}>
                <Link to="/register">Inscribirme a esta</Link>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
