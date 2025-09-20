import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";

export default function ActivitiesWidget({ title = "Actividades" }) {
  const [activities, setActivities] = useState([]);
  useEffect(() => {
    api.get("/activities/summary").then(r => setActivities(r.data)).catch(()=>setActivities([]));
  }, []);
  if (!activities.length) return null;

  return (
    <section style={{ marginTop: 24 }}>
      <h2 style={{ fontSize: 20, marginBottom: 12 }}>{title}</h2>
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
              <Link to="/register">Inscribirme</Link>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
