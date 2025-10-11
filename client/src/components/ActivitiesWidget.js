// client/src/components/ActivitiesWidget.js
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";

export default function ActivitiesWidget({ title = "Actividades" }) {
  const [activities, setActivities] = useState([]);

  useEffect(() => {
    api
      .get("/activities/summary")
      .then((r) => setActivities(r.data))
      .catch(() => setActivities([]));
  }, []);

  if (!activities.length) return null;

  return (
    <section className="mt-10">
      <h2 className="text-2xl font-bold text-umgBlue mb-4 text-center">
        {title}
      </h2>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {activities.map((a) => (
          <div
            key={a.id}
            className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4 hover:shadow-md transition"
          >
            <div className="font-semibold text-slate-900">
              {a.kind}: {a.title}
            </div>

            <div className="text-slate-600 text-sm mt-1">
              {new Date(a.date).toLocaleString("es-GT", {
                dateStyle: "short",
                timeStyle: "short",
              })}
            </div>

            <div className="text-sm text-slate-500 mt-1">
              Cupos: {a.available}/{a.capacity}
            </div>

            <div className="mt-3">
              <Link
                to={`/register?activityId=${a.id}`}
                className={`inline-block px-4 py-2 rounded-lg text-white text-sm font-medium transition ${
                  a.available > 0
                    ? "bg-umgBlue hover:bg-blue-700"
                    : "bg-slate-400 cursor-not-allowed"
                }`}
              >
                {a.available > 0 ? "Inscribirme" : "Cupo lleno"}
              </Link>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
