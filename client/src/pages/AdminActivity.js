// client/src/pages/AdminActivity.js
import { useEffect, useState } from "react";
import { api } from "../api";
import { useParams, useNavigate } from "react-router-dom";

export default function AdminActivity() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [activity, setActivity] = useState(null);
  const [regs, setRegs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState(null); // mensajes suaves en UI

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setMsg(null);

    Promise.all([
      api.get(`/activities`), // público
      api.get(`/activities/${id}/registrations`), // protegido (x-admin-key)
    ])
      .then(([actsRes, regsRes]) => {
        if (!mounted) return;
        const a = actsRes.data.find((x) => String(x.id) === String(id));
        setActivity(a || null);
        setRegs(regsRes.data || []);
      })
      .catch((err) => {
        if (!mounted) return;
        const status = err?.response?.status;
        const text =
          err?.response?.data?.message ||
          err?.message ||
          "Error cargando inscripciones";
        setMsg(text);
        if (status === 401) {
          navigate("/admin-login", { replace: true });
        }
      })
      .finally(() => mounted && setLoading(false));

    return () => {
      mounted = false;
    };
  }, [id, navigate]);

  const exportCsv = async () => {
    try {
      setMsg(null);
      // Usar api (con interceptor) + blob; así viaja x-admin-key
      const res = await api.get(`/activities/${id}/registrations.csv`, {
        responseType: "blob",
      });
      const blob = new Blob([res.data], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const ts = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
      a.download = `actividad-${id}-inscripciones-${ts}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      const status = err?.response?.status;
      const text = err?.response?.data?.message || "No se pudo exportar el CSV";
      setMsg(text);
      if (status === 401) navigate("/admin-login", { replace: true });
    }
  };

  if (loading)
    return (
      <div className="min-h-screen bg-slate-50 text-slate-800">
        <div className="max-w-6xl mx-auto px-4 py-8">Cargando…</div>
      </div>
    );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="bg-white border border-slate-200 rounded-2xl shadow-soft p-6">
          <h2 className="text-2xl font-bold text-umgBlue">
            Admin — Actividad #{id}
          </h2>

          {activity && (
            <p className="text-slate-700 mt-1">
              <b>{activity.kind}</b>: {activity.title} —{" "}
              {new Date(activity.date).toLocaleString()}
            </p>
          )}

          <div className="mt-3 mb-3">
            <button
              onClick={exportCsv}
              className="bg-sky-500 hover:brightness-105 text-white px-4 py-2 rounded-xl font-semibold"
            >
              Exportar CSV
            </button>
          </div>

          {msg && (
            <div className="mb-3 rounded-xl px-3 py-2 bg-rose-50 text-rose-700 border border-rose-200">
              {msg}
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-slate-700">
                <tr>
                  <th className="text-left px-3 py-2 border-b">Reg.ID</th>
                  <th className="text-left px-3 py-2 border-b">Estado</th>
                  <th className="text-left px-3 py-2 border-b">Fecha</th>
                  <th className="text-left px-3 py-2 border-b">Nombre</th>
                  <th className="text-left px-3 py-2 border-b">Correo</th>
                  <th className="text-left px-3 py-2 border-b">Colegio</th>
                  <th className="text-left px-3 py-2 border-b">QR</th>
                </tr>
              </thead>
              <tbody>
                {regs.map((r) => (
                  <tr key={r.id} className="border-b">
                    <td className="px-3 py-2">{r.id}</td>
                    <td className="px-3 py-2">{r.status}</td>
                    <td className="px-3 py-2">
                      {new Date(r.createdAt).toLocaleString()}
                    </td>
                    <td className="px-3 py-2">{r.user.name}</td>
                    <td className="px-3 py-2">{r.user.email}</td>
                    <td className="px-3 py-2">{r.user.school || "-"}</td>
                    <td className="px-3 py-2">
                      {r.qr ? (
                        <a
                          href={r.qr}
                          target="_blank"
                          rel="noreferrer"
                          className="text-umgBlue hover:underline"
                        >
                          Ver
                        </a>
                      ) : (
                        "-"
                      )}
                    </td>
                  </tr>
                ))}
                {regs.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-3 py-4 text-center text-slate-500"
                    >
                      Sin inscripciones aún
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <p className="text-xs text-slate-500 mt-3">
            Si falta información o aparece un error 401, confirma que tu
            interceptor de Axios esté enviando el header{" "}
            <code>x-admin-key</code>.
          </p>
        </div>
      </div>
    </div>
  );
}
