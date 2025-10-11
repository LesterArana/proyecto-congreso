// client/src/pages/MyRegistrations.js
import { useState } from "react";
import { api } from "../api";

/**
 * Comportamiento:
 * - Busca inscripciones por email en /registrations/by-email
 * - Para cada inscripción consulta /diplomas/by-registration/:id
 * - Si hay diploma => muestra botón "Descargar diploma"
 * - Si no hay => muestra "Aún no disponible"
 * - Mantiene el botón "Ver QR" si existe
 */
export default function MyRegistrations() {
  const [email, setEmail] = useState("");
  const [data, setData] = useState(null); // { registrations: [...] }
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);

  // Helper: consulta diploma por cada inscripción y devuelve arreglo enriquecido
  const attachDiplomas = async (registrations) => {
    const results = await Promise.all(
      registrations.map(async (r) => {
        try {
          const dres = await api.get(`/diplomas/by-registration/${r.id}`);
          // backend: { diploma, downloadUrl }
          return {
            ...r,
            diplomaUrl: dres?.data?.downloadUrl || null,
            diploma: dres?.data?.diploma || null,
          };
        } catch (err) {
          // 404 => no hay diploma; otros errores: lo ignoramos en UI
          if (err?.response?.status === 404) {
            return { ...r, diplomaUrl: null, diploma: null };
          }
          return { ...r, diplomaUrl: null, diploma: null };
        }
      })
    );
    return results;
  };

  const submit = async (e) => {
    e.preventDefault();
    setMsg(null);
    setData(null);

    if (!email.trim()) {
      setMsg({ ok: false, text: "Ingresa tu correo" });
      return;
    }

    try {
      setLoading(true);
      const res = await api.get("/registrations/by-email", { params: { email } });
      const regs = res?.data?.registrations || [];

      if (!regs.length) {
        setData({ registrations: [] });
        setMsg({ ok: true, text: "No encontramos inscripciones con ese correo." });
        return;
      }

      const regsWithDiplomas = await attachDiplomas(regs);
      setData({ registrations: regsWithDiplomas });
    } catch (err) {
      setMsg({
        ok: false,
        text: err?.response?.data?.message || "Error consultando inscripciones.",
      });
    } finally {
      setLoading(false);
    }
  };

  const cardCls =
    "bg-white text-slate-800 rounded-2xl shadow-soft border border-white/20 p-6";

  return (
    <div className="min-h-screen bg-umgBlue text-white">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className={cardCls}>
          <h2 className="text-2xl font-bold text-umgBlue">Mis inscripciones</h2>
          <p className="text-slate-600">
            Ingresa tu correo para ver tus actividades, QR y diplomas disponibles.
          </p>

          {/* Form */}
          <form onSubmit={submit} className="mt-4 flex flex-col sm:flex-row gap-3">
            <input
              type="email"
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 rounded-xl border-slate-300 focus:border-umgBlue focus:ring-umgBlue"
            />
            <button
              type="submit"
              disabled={loading}
              className={`inline-flex items-center rounded-xl px-4 py-2 font-semibold ${
                loading
                  ? "bg-slate-400 text-white cursor-not-allowed"
                  : "bg-umgBlue text-white hover:brightness-105"
              }`}
            >
              {loading ? "Buscando..." : "Buscar"}
            </button>
          </form>

          {/* Mensaje */}
          {msg && (
            <div
              className={`mt-4 rounded-xl px-3 py-2 ${
                msg.ok
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : "bg-rose-50 text-rose-700 border border-rose-200"
              }`}
            >
              {msg.text}
            </div>
          )}

          {/* Loading adicional */}
          {loading && <p className="text-slate-500 mt-2">Cargando…</p>}

          {/* Lista de inscripciones */}
          {data?.registrations?.length > 0 && (
            <div className="mt-4 grid gap-3">
              {data.registrations.map((r) => (
                <div key={r.id} className="rounded-2xl border border-slate-200 p-4">
                  <div className="flex flex-col sm:flex-row justify-between gap-3">
                    {/* Izquierda: detalles */}
                    <div>
                      <div className="font-semibold">
                        {r.activity.kind}: {r.activity.title}
                      </div>
                      <div className="text-slate-600">
                        {new Date(r.activity.date).toLocaleString()}
                      </div>
                      <div className="text-sm mt-1">
                        Estado: <b>{r.status}</b> — Reg. #{r.id}
                      </div>
                    </div>

                    {/* Derecha: acciones */}
                    <div className="sm:text-right flex flex-wrap gap-2 items-center">
                      {/* QR */}
                      {r.qr ? (
                        <a
                          href={r.qr}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center rounded-xl bg-emerald-600 text-white px-3 py-1.5 hover:brightness-105"
                        >
                          Ver QR
                        </a>
                      ) : (
                        <span className="text-sm text-slate-500">Sin QR</span>
                      )}

                      {/* Diploma */}
                      {r.diplomaUrl ? (
                        <a
                          href={r.diplomaUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center rounded-xl bg-violet-600 text-white px-3 py-1.5 hover:brightness-105 whitespace-nowrap"
                        >
                          Descargar diploma
                        </a>
                      ) : (
                        <span className="text-sm text-slate-500 whitespace-nowrap">
                          Diploma: aún no disponible
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Info extra del diploma si quisieras mostrarla */}
                  {/* {r.diploma && (
                    <div className="mt-2 text-xs text-slate-500">
                      Diploma generado el: {new Date(r.diploma.createdAt).toLocaleString()}
                    </div>
                  )} */}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
