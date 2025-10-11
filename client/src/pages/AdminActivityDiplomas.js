// client/src/pages/AdminActivityDiplomas.js
import { useEffect, useState } from "react";
import { api } from "../api";

export default function AdminActivityDiplomas() {
  const [activityId, setActivityId] = useState("");
  const [rows, setRows] = useState([]);
  const [msg, setMsg] = useState(null); // { ok: boolean, text: string } | string | null
  const [loading, setLoading] = useState(false);
  const [onlyAttended, setOnlyAttended] = useState(true);

  // Carga inscripciones; si keepMsg=true no borra el mensaje actual
  async function loadRegs({ keepMsg = false } = {}) {
    if (!activityId) return;
    setLoading(true);
    if (!keepMsg) setMsg(null);
    try {
      const res = await api.get(`/activities/${activityId}/registrations`);
      setRows(res.data || []);
    } catch (e) {
      setMsg({
        ok: false,
        text: e?.response?.data?.error || "Error cargando inscripciones.",
      });
    } finally {
      setLoading(false);
    }
  }

  async function genOne(regId) {
    setLoading(true);
    try {
      await api.post(`/diplomas/generate/${regId}`); // protegido por x-admin-key
      setMsg({ ok: true, text: `✅ Diploma generado para registro #${regId}.` });
      await loadRegs({ keepMsg: true });
    } catch (e) {
      setMsg({
        ok: false,
        text: e?.response?.data?.error || "❌ No se pudo generar el diploma.",
      });
    } finally {
      setLoading(false);
    }
  }

  async function genBulk() {
    if (!activityId) {
      setMsg({ ok: false, text: "Ingresa el ID de la actividad." });
      return;
    }
    setLoading(true);
    try {
      const res = await api.post(
        `/diplomas/generate/activity/${activityId}?onlyAttended=${onlyAttended}`
      );
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
        const reason = onlyAttended
          ? "No hay asistentes registrados para esta actividad."
          : "No se encontró a quién generar.";
        setMsg({
          ok: false,
          text: `⚠️ No se generó ningún diploma. ${reason} (procesados=${processed}, omitidos=${skipped})`,
        });
      }

      await loadRegs({ keepMsg: true });
    } catch (e) {
      setMsg({
        ok: false,
        text:
          e?.response?.data?.error || "❌ Error generando diplomas en lote.",
      });
    } finally {
      setLoading(false);
    }
  }

  // Auto-ocultar mensaje después de 5s
  useEffect(() => {
    if (!msg) return;
    const t = setTimeout(() => setMsg(null), 5000);
    return () => clearTimeout(t);
  }, [msg]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="bg-white border border-slate-200 rounded-2xl shadow-soft p-6">
          <h2 className="text-2xl font-bold text-umgBlue">Diplomas por actividad (Admin)</h2>

          {/* Controles superiores */}
          <div className="mt-4 flex flex-col sm:flex-row gap-3 sm:items-center">
            <input
              type="number"
              placeholder="Activity ID"
              value={activityId}
              onChange={(e) => setActivityId(e.target.value)}
              className="rounded-xl border border-slate-300 px-3 py-2 w-full sm:w-44 focus:ring-umgBlue focus:border-umgBlue outline-none"
            />
            <button
              onClick={() => loadRegs()}
              disabled={!activityId || loading}
              className={`rounded-xl px-4 py-2 font-semibold text-white ${
                !activityId || loading
                  ? "bg-slate-400 cursor-not-allowed"
                  : "bg-umgBlue hover:brightness-105"
              }`}
            >
              {loading ? "Cargando..." : "Cargar"}
            </button>

            <label className="inline-flex items-center gap-2 text-sm ml-0 sm:ml-2">
              <input
                type="checkbox"
                checked={onlyAttended}
                onChange={(e) => setOnlyAttended(e.target.checked)}
                className="rounded border-slate-300"
              />
              Solo asistentes
            </label>

            <button
              onClick={genBulk}
              disabled={!activityId || loading}
              className={`rounded-xl px-4 py-2 font-semibold ml-0 sm:ml-auto ${
                !activityId || loading
                  ? "bg-slate-400 text-white cursor-not-allowed"
                  : "bg-umgBlue text-white hover:brightness-105"
              }`}
            >
              Generar diplomas (lote)
            </button>
          </div>

          {/* Mensaje global */}
          {msg && (
            <div
              className={`mt-4 rounded-xl px-3 py-2 ${
                (typeof msg === "object" ? msg.ok : false)
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : "bg-rose-50 text-rose-700 border border-rose-200"
              }`}
            >
              {typeof msg === "string" ? msg : msg.text}
            </div>
          )}

          {/* Tabla de registros */}
          <div className="overflow-x-auto mt-4">
            <table className="min-w-full text-sm">
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
                    <td className="px-3 py-2">
                      {r.status === "CHECKED_IN" ? "Sí" : "No"}
                    </td>
                    <td className="px-3 py-2">
                      <button
                        onClick={() => genOne(r.id)}
                        disabled={loading}
                        className={`inline-flex items-center rounded-xl px-3 py-1.5 font-medium ${
                          loading
                            ? "bg-slate-400 text-white cursor-not-allowed"
                            : "bg-umgBlue text-white hover:brightness-105"
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

          {/* Nota opcional */}
          <p className="text-xs text-slate-500 mt-3">
            Consejo: si no aparecen inscripciones, confirma que el <code>x-admin-key</code> se esté enviando
            vía tu interceptor de Axios y que el ID de actividad sea correcto.
          </p>
        </div>
      </div>
    </div>
  );
}
