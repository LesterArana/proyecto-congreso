import { useEffect, useState, useCallback } from "react";
import { api } from "../api";

export default function AdminActivityDiplomas() {
  const [activityId, setActivityId] = useState("");
  const [rows, setRows] = useState([]);
  const [msg, setMsg] = useState(null);
  const [loading, setLoading] = useState(false);
  const [onlyAttended, setOnlyAttended] = useState(true);
  const [activities, setActivities] = useState([]);

  const loadActivities = useCallback(async () => {
    try {
      const res = await api.get("/activities");
      setActivities(res.data || []);
    } catch {
      setActivities([]);
      setMsg({ ok: false, text: "No se pudieron cargar las actividades (admin)." });
    }
  }, []);

  async function loadRegs({ keepMsg = false } = {}) {
    if (!activityId) return;
    setLoading(true);
    if (!keepMsg) setMsg(null);
    try {
      const res = await api.get(`/activities/${activityId}/registrations`);
      setRows(res.data || []);
    } catch (e) {
      setMsg({ ok: false, text: e?.response?.data?.error || "Error cargando inscripciones." });
    } finally {
      setLoading(false);
    }
  }

  async function genOne(regId) {
    setLoading(true);
    try {
      await api.post(`/diplomas/generate/${regId}`);
      setMsg({ ok: true, text: `✅ Diploma generado para registro #${regId}.` });
      await loadRegs({ keepMsg: true });
    } catch (e) {
      setMsg({ ok: false, text: e?.response?.data?.error || "❌ No se pudo generar el diploma." });
    } finally {
      setLoading(false);
    }
  }

  async function genBulk() {
    if (!activityId) {
      setMsg({ ok: false, text: "Selecciona una actividad." });
      return;
    }
    setLoading(true);
    try {
      const res = await api.post(`/diplomas/generate/activity/${activityId}?onlyAttended=${onlyAttended}`);
      const c = res?.data?.counts || {};
      const processed = Number(c.processed || 0);
      const created = Number(c.created || 0);
      const updated = Number(c.updated || 0);
      const skipped = Number(c.skipped || 0);

      if (created + updated > 0) {
        setMsg({
          ok: true,
          text: `✅ Diplomas creados/actualizados: ${created + updated}. (procesados=${processed}, nuevos=${created}, actualizados=${updated}, omitidos=${skipped})`,
        });
      } else {
        setMsg({
          ok: false,
          text: `⚠️ No se generó ningún diploma. ${onlyAttended ? "No hay asistentes." : "No se encontró a quién generar."} (procesados=${processed}, omitidos=${skipped})`,
        });
      }
      await loadRegs({ keepMsg: true });
    } catch (e) {
      setMsg({ ok: false, text: e?.response?.data?.error || "❌ Error generando diplomas en lote." });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadActivities(); }, [loadActivities]);

  // Auto-ocultar mensaje
  useEffect(() => {
    if (!msg) return;
    const t = setTimeout(() => setMsg(null), 5000);
    return () => clearTimeout(t);
  }, [msg]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white border border-slate-200 rounded-2xl shadow-soft p-6">
          <h2 className="text-2xl font-bold text-umgBlue">Diplomas por actividad (Admin)</h2>

          <div className="mt-4 grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            <select
              value={activityId}
              onChange={(e) => setActivityId(e.target.value)}
              className="rounded-xl border border-slate-300 px-3 py-2 w-full focus:ring-umgBlue focus:border-umgBlue outline-none"
            >
              <option value="">— Selecciona actividad —</option>
              {activities.map((a) => (
                <option key={a.id} value={a.id}>
                  #{a.id} — {a.title} ({new Date(a.date).toLocaleString()})
                </option>
              ))}
            </select>

            <div className="flex items-center gap-3">
              <button
                onClick={() => loadRegs()}
                disabled={!activityId || loading}
                className={`rounded-xl px-4 py-2 font-semibold text-white ${
                  !activityId || loading ? "bg-slate-400 cursor-not-allowed" : "bg-umgBlue hover:brightness-105"
                }`}
              >
                {loading ? "Cargando..." : "Cargar"}
              </button>

              <label className="inline-flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={onlyAttended}
                  onChange={(e) => setOnlyAttended(e.target.checked)}
                  className="rounded border-slate-300"
                />
                Solo asistentes
              </label>
            </div>

            <div className="lg:ml-auto">
              <button
                onClick={genBulk}
                disabled={!activityId || loading}
                className={`w-full sm:w-auto rounded-xl px-4 py-2 font-semibold ${
                  !activityId || loading ? "bg-slate-400 text-white cursor-not-allowed" : "bg-umgBlue text-white hover:brightness-105"
                }`}
              >
                Generar diplomas (lote)
              </button>
            </div>
          </div>

          {msg && (
            <div className={`mt-4 rounded-xl px-3 py-2 ${typeof msg === "object" && msg.ok ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-rose-50 text-rose-700 border border-rose-200"}`}>
              {typeof msg === "string" ? msg : msg.text}
            </div>
          )}

          <div className="overflow-x-auto mt-4 rounded-2xl border border-slate-200">
            <table className="min-w-[900px] w-full text-sm">
              <thead className="bg-slate-50 text-slate-700">
                <tr>
                  <th className="text-left px-3 py-2 border-b">RegID</th>
                  <th className="text-left px-3 py-2 border-b">Usuario</th>
                  <th className="text-left px-3 py-2 border-b">Email</th>
                  <th className="text-left px-3 py-2 border-b">Estado</th>
                  <th className="text-left px-3 py-2 border-b">Asistió</th>
                  <th className="text-left px-3 py-2 border-b">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-b">
                    <td className="px-3 py-2">{r.id}</td>
                    <td className="px-3 py-2">{r.user?.name}</td>
                    <td className="px-3 py-2">{r.user?.email}</td>
                    <td className="px-3 py-2">{r.status}</td>
                    <td className="px-3 py-2">{r.status === "CHECKED_IN" ? "Sí" : "No"}</td>
                    <td className="px-3 py-2">
                      <button
                        onClick={() => genOne(r.id)}
                        disabled={loading}
                        className={`inline-flex items-center rounded-xl px-3 py-1.5 font-medium ${
                          loading ? "bg-slate-400 text-white cursor-not-allowed" : "bg-umgBlue text-white hover:brightness-105"
                        }`}
                      >
                        Generar diploma
                      </button>
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-3 py-4 text-center text-slate-500">
                      Sin datos
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

         
        </div>
      </div>
    </div>
  );
}
