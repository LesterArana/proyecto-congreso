// client/src/pages/ActivityDetail.js
import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { api } from "../api";

export default function ActivityDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [a, setA] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  useEffect(() => {
    setLoading(true);
    api
      .get(`/activities/${id}`)
      .then((res) => setA(res.data))
      .catch((e) =>
        setErr(e?.response?.data?.message || "No se pudo cargar la actividad")
      )
      .finally(() => setLoading(false));
  }, [id]);

  if (loading)
    return (
      <div className="min-h-screen bg-umgBlue text-white p-4">Cargando…</div>
    );

  if (err)
    return (
      <div className="min-h-screen bg-umgBlue text-white p-4">{err}</div>
    );

  if (!a) return null;

  const fecha = new Date(a.date).toLocaleString();

  const goRegister = () => {
    // redirige al formulario con ?activityId=...
    navigate(`/register?activityId=${a.id}`);
  };

  const btnEnabled =
    "inline-flex items-center rounded-xl bg-umgBlue text-white px-4 py-2 font-semibold hover:brightness-105";
  const btnDisabled =
    "inline-flex items-center rounded-xl bg-slate-400 text-white px-4 py-2 font-semibold cursor-not-allowed";

  return (
    <div className="min-h-screen bg-umgBlue text-white">
      <div className="max-w-[900px] mx-auto px-4 py-8">
        <p className="mb-3">
          <Link
            to="/"
            className="text-blue-100 hover:text-white underline underline-offset-2"
          >
            ‹ Volver
          </Link>
        </p>

        <div className="bg-white text-slate-800 rounded-2xl shadow-soft border border-white/20 p-6">
          <h2 className="text-2xl font-bold text-umgBlue">
            {a.kind}: {a.title}
          </h2>
          <p className="text-slate-600 mt-1">{fecha}</p>

          <p className="mt-4 whitespace-pre-wrap">
            {a.description || "Sin descripción."}
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-4 border border-slate-200 rounded-xl p-4">
            <div className="font-medium">
              <b>Cupos:</b> {a.available}/{a.capacity}
            </div>
            <button
              onClick={goRegister}
              disabled={a.available === 0}
              className={a.available === 0 ? btnDisabled : btnEnabled}
            >
              {a.available === 0 ? "Cupo lleno" : "Inscribirme"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
