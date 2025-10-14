import { useMemo, useState } from "react";
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
  const [logoError, setLogoError] = useState(false);

  // Base pública robusta para archivos en /public (funciona en dev/prod)
  const PUBLIC_BASE = useMemo(() => {
    const fromEnv = process.env.REACT_APP_PUBLIC_BASE_URL;
    if (fromEnv) return fromEnv.replace(/\/$/, "");
    const fromApi = api?.defaults?.baseURL || "http://localhost:4000/api";
    return fromApi.replace(/\/api\/?$/, "");
  }, []);
  // Cambia a .png si tu archivo real es PNG
  const logoUrl = `${PUBLIC_BASE}/public/logo-umg.jpg`;

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

        {/* Encabezado institucional */}
        <section className="bg-white text-slate-800 rounded-2xl shadow-soft border border-white/20 p-6 mb-4">
          <div className="flex items-center gap-4 md:gap-6">
            {!logoError ? (
              <img
                src={logoUrl}
                alt="Escudo UMG"
                className="w-16 h-16 md:w-20 md:h-20 rounded-xl object-cover border border-slate-200"
                onError={() => setLogoError(true)}
              />
            ) : (
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-xl border border-rose-300 bg-rose-50 text-rose-800 text-xs flex items-center justify-center p-2">
                No se pudo cargar<br />/public/logo-umg.jpg
              </div>
            )}
            <div>
              <div className="text-xs uppercase tracking-wide text-slate-500">
                Universidad Mariano Gálvez de Guatemala
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-umgBlue m-0">
                Mis inscripciones
              </h1>
              <p className="text-slate-600 mt-1 mb-0">
                Consulta tus actividades, QR y diplomas disponibles.
              </p>
            </div>
          </div>
        </section>

        <div className={cardCls}>
          {/* Form */}
          <h2 className="text-xl font-bold text-umgBlue mb-2">Buscar por correo</h2>
          <p className="text-slate-600">
            Ingresa tu correo para ver tus actividades, QR y diplomas disponibles.
          </p>

          <form onSubmit={submit} className="mt-4 flex flex-col sm:flex-row gap-3">
            <input
              type="email"
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 rounded-xl border border-slate-300 px-3 py-2 focus:border-umgBlue focus:ring-umgBlue outline-none"
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

        {/* Pie institucional */}
        <div className="text-center text-white/80 text-xs mt-6">
          © {new Date().getFullYear()} Universidad Mariano Gálvez de Guatemala — Congreso de Tecnología
        </div>
      </div>
    </div>
  );
}
