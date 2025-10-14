// client/src/pages/Register.js
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { api } from "../api";
import { useSearchParams, Link } from "react-router-dom";

const INSTITUTE_DOMAIN = (process.env.REACT_APP_INSTITUTION_DOMAIN || "miumg.edu.gt").toLowerCase();
const isInternalEmail = (email) => email?.toLowerCase().endsWith(`@${INSTITUTE_DOMAIN}`);

const schema = z.object({
  name: z.string().min(2, "Ingresa tu nombre"),
  email: z.string().email("Correo inválido"),
  phone: z.string().min(7, "Teléfono inválido"),
  school: z.string().optional(),
  activityId: z.string().min(1, "Selecciona una actividad"),
});

export default function Register() {
  const [activities, setActivities] = useState([]);
  const [msg, setMsg] = useState(null);
  const [resp, setResp] = useState(null);
  const [search] = useSearchParams();
  const [logoError, setLogoError] = useState(false);
  const preId = search.get("activityId");

  // Base pública robusta para archivos en /public (sirve en dev/prod)
  const PUBLIC_BASE = useMemo(() => {
    const fromEnv = process.env.REACT_APP_PUBLIC_BASE_URL;
    if (fromEnv) return fromEnv.replace(/\/$/, "");
    const fromApi = api?.defaults?.baseURL || "http://localhost:4000/api";
    return fromApi.replace(/\/api\/?$/, "");
  }, []);
  // Cambia a .png si tu archivo real es PNG
  const logoUrl = `${PUBLIC_BASE}/public/logo-umg.jpg`;

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { name: "", email: "", phone: "", school: "", activityId: preId || "" },
  });

  const emailValue = watch("email");
  const internal = useMemo(() => isInternalEmail(emailValue || ""), [emailValue]);

  useEffect(() => {
    if (preId) setValue("activityId", String(preId));
  }, [preId, setValue]);

  useEffect(() => {
    api
      .get("/activities/summary")
      .then((res) => setActivities(res.data || []))
      .catch(() => setActivities([]));
  }, []);

  const onSubmit = async (values) => {
    setMsg(null);
    setResp(null);
    try {
      const payload = {
        name: values.name,
        email: values.email,
        phone: values.phone,
        school: internal ? "" : (values.school || ""), // school solo aplica a externos
        activityId: Number(values.activityId),
      };
      const { data } = await api.post("/registrations", payload);
      setResp(data);
      setMsg({ ok: true, text: "✅ ¡Inscripción creada! Revisa tu correo si está configurado o guarda tu QR." });
      reset({ name: "", email: "", phone: "", school: "", activityId: "" });
      // refrescar cupos
      api.get("/activities/summary").then((res) => setActivities(res.data || [])).catch(() => {});
    } catch (err) {
      const text = err?.response?.data?.message || "❌ Ocurrió un error al inscribirte. Intenta de nuevo.";
      setMsg({ ok: false, text });
    }
  };

  const fieldCls =
    "mt-1 block w-full rounded-xl border border-slate-300 px-3 py-2 focus:border-umgBlue focus:ring-umgBlue outline-none";
  const labelCls = "block text-sm font-medium text-slate-700";
  const cardCls = "bg-white text-slate-800 rounded-2xl shadow-soft border border-white/20 p-6";

  return (
    <div className="min-h-screen bg-umgBlue text-white">
      <div className="max-w-xl mx-auto px-4 py-8">
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
                Inscripción a actividades
              </h1>
              <p className="text-slate-600 mt-1 mb-0">
                Completa tus datos y elige una actividad disponible.
              </p>
            </div>
          </div>
        </section>

        <div className={cardCls}>
          {/* Indicador de interno/externo según email */}
          {emailValue && (
            <div className="mt-1 mb-3">
              {internal ? (
                <span className="inline-block rounded-full text-xs px-3 py-1 bg-blue-50 text-blue-900 border border-blue-200">
                  Correo institucional detectado (INTERNAL)
                </span>
              ) : (
                <span className="inline-block rounded-full text-xs px-3 py-1 bg-amber-50 text-amber-800 border border-amber-200">
                  Correo externo (EXTERNAL)
                </span>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="mt-2 space-y-4">
            {/* Nombre */}
            <div>
              <label className={labelCls}>Nombre</label>
              <input
                {...register("name")}
                type="text"
                placeholder="Tu nombre"
                className={fieldCls}
              />
              {errors.name && <small className="text-rose-600">{errors.name.message}</small>}
            </div>

            {/* Correo */}
            <div>
              <label className={labelCls}>Correo</label>
              <input
                {...register("email")}
                type="email"
                placeholder={`tucorreo@${INSTITUTE_DOMAIN} o personal`}
                className={fieldCls}
              />
              {errors.email && <small className="text-rose-600">{errors.email.message}</small>}
            </div>

            {/* Teléfono */}
            <div>
              <label className={labelCls}>Teléfono</label>
              <input
                {...register("phone")}
                type="tel"
                placeholder="Tu teléfono"
                className={fieldCls}
              />
              {errors.phone && <small className="text-rose-600">{errors.phone.message}</small>}
            </div>

            {/* School solo para externos */}
            {!internal && (
              <div>
                <label className={labelCls}>Colegio (solo externos)</label>
                <input
                  {...register("school")}
                  type="text"
                  placeholder="Nombre del colegio"
                  className={fieldCls}
                />
              </div>
            )}

            {/* Actividad */}
            <div>
              <label className={labelCls}>Actividad</label>
              <select {...register("activityId")} className={fieldCls}>
                <option value="">-- Selecciona --</option>
                {activities.map((a) => (
                  <option key={a.id} value={a.id} disabled={a.available === 0}>
                    {a.kind}: {a.title} — {new Date(a.date).toLocaleString()} (Disp: {a.available}/{a.capacity})
                  </option>
                ))}
              </select>
              {errors.activityId && <small className="text-rose-600">{errors.activityId.message}</small>}
            </div>

            {/* Botón enviar */}
            <button
              disabled={isSubmitting}
              type="submit"
              className={`inline-flex items-center rounded-xl px-4 py-2 font-semibold ${
                isSubmitting ? "bg-slate-400 text-white cursor-not-allowed" : "bg-umgBlue text-white hover:brightness-105"
              }`}
            >
              {isSubmitting ? "Enviando..." : "Inscribirme"}
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

          {/* Resumen de respuesta */}
          {resp && (
            <div className="mt-4 rounded-2xl border border-slate-200 p-4">
              <p>
                <b>Registro:</b> #{resp.registrationId}
              </p>
              {resp.qr && (
                <p>
                  Tu QR:{" "}
                  <a
                    href={resp.qr}
                    target="_blank"
                    rel="noreferrer"
                    className="text-umgBlue underline"
                  >
                    {resp.qr}
                  </a>
                </p>
              )}
              {resp.emailPreview && (
                <p>
                  Vista previa del correo:{" "}
                  <a
                    href={resp.emailPreview}
                    target="_blank"
                    rel="noreferrer"
                    className="text-umgBlue underline"
                  >
                    Abrir
                  </a>
                </p>
              )}
              {resp.emailMode && (
                <p className="text-xs text-slate-500">
                  Modo de correo: {resp.emailMode}
                  {resp.emailError ? ` (error: ${resp.emailError})` : ""}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Pie institucional */}
        <div className="text-center text-white/80 text-xs mt-6">
          © {new Date().getFullYear()} Universidad Mariano Gálvez de Guatemala — Congreso de Tecnología ·{" "}
          <Link to="/faq" className="underline">Preguntas frecuentes</Link>
        </div>
      </div>
    </div>
  );
}
