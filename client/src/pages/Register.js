import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { api } from "../api";
import { useSearchParams } from "react-router-dom";

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
  const preId = search.get("activityId");

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
    api.get("/activities/summary")
      .then(res => setActivities(res.data || []))
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
        school: internal ? "" : (values.school || ""),  // school solo aplica a externos
        activityId: Number(values.activityId),
      };
      const { data } = await api.post("/registrations", payload);
      setResp(data);
      setMsg({ ok: true, text: "✅ ¡Inscripción creada! Revisa tu correo si está configurado o guarda tu QR." });
      reset({ name: "", email: "", phone: "", school: "", activityId: "" });
      // refrescar cupos
      api.get("/activities/summary").then(res => setActivities(res.data || [])).catch(()=>{});
    } catch (err) {
      const text = err?.response?.data?.message || "❌ Ocurrió un error al inscribirte. Intenta de nuevo.";
      setMsg({ ok: false, text });
    }
  };

  const help = {
    label: { color: "#374151" },
    input: { padding: 8, borderRadius: 8, border: "1px solid #ddd" },
    badge: { padding: "2px 8px", borderRadius: 999, fontSize: 12, background: "#dbeafe", color: "#1e3a8a" },
  };

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: 16 }}>
      <h2 style={{ marginBottom: 12 }}>Inscripción</h2>

      {/* Indicador de interno si el email coincide */}
      {emailValue && (
        <div style={{ marginBottom: 8 }}>
          {internal ? (
            <span style={help.badge}>Correo institucional detectado (INTERNAL)</span>
          ) : (
            <span style={{ ...help.badge, background: "#fef3c7", color: "#92400e" }}>
              Correo externo (EXTERNAL)
            </span>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} style={{ display: "grid", gap: 12 }}>
        <label style={{ display: "grid", gap: 6 }}>
          <span style={help.label}>Nombre</span>
          <input {...register("name")} type="text" placeholder="Tu nombre" style={help.input} />
          {errors.name && <small style={{ color: "crimson" }}>{errors.name.message}</small>}
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          <span style={help.label}>Correo</span>
          <input {...register("email")} type="email" placeholder={`tucorreo@${INSTITUTE_DOMAIN} o personal`} style={help.input} />
          {errors.email && <small style={{ color: "crimson" }}>{errors.email.message}</small>}
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          <span style={help.label}>Teléfono</span>
          <input {...register("phone")} type="tel" placeholder="Tu teléfono" style={help.input} />
          {errors.phone && <small style={{ color: "crimson" }}>{errors.phone.message}</small>}
        </label>

        {/* School solo para externos */}
        {!internal && (
          <label style={{ display: "grid", gap: 6 }}>
            <span style={help.label}>Colegio (solo externos)</span>
            <input {...register("school")} type="text" placeholder="Nombre del colegio" style={help.input} />
          </label>
        )}

        <label style={{ display: "grid", gap: 6 }}>
          <span style={help.label}>Actividad</span>
          <select {...register("activityId")} style={help.input}>
            <option value="">-- Selecciona --</option>
            {activities.map((a) => (
              <option key={a.id} value={a.id} disabled={a.available === 0}>
                {a.kind}: {a.title} — {new Date(a.date).toLocaleString()} (Disp: {a.available}/{a.capacity})
              </option>
            ))}
          </select>
          {errors.activityId && <small style={{ color: "crimson" }}>{errors.activityId.message}</small>}
        </label>

        <button
          disabled={isSubmitting}
          type="submit"
          style={{ background: "#2563eb", color: "white", padding: "10px 16px", borderRadius: 10, border: "none", cursor: "pointer", opacity: isSubmitting ? 0.7 : 1 }}
        >
          {isSubmitting ? "Enviando..." : "Inscribirme"}
        </button>
      </form>

      {msg && (
        <div style={{ marginTop: 16, padding: 12, borderRadius: 8, background: msg.ok ? "#dcfce7" : "#fee2e2", color: msg.ok ? "#065f46" : "#991b1b" }}>
          {msg.text}
        </div>
      )}

      {resp && (
        <div style={{ marginTop: 12, padding: 12, border: "1px solid #eee", borderRadius: 8 }}>
          <p><b>Registro:</b> #{resp.registrationId}</p>
          {resp.qr && (
            <p>
              Tu QR:{" "}
              <a href={resp.qr} target="_blank" rel="noreferrer">
                {resp.qr}
              </a>
            </p>
          )}
          {resp.emailPreview && (
            <p>
              Vista previa del correo:{" "}
              <a href={resp.emailPreview} target="_blank" rel="noreferrer">Abrir</a>
            </p>
          )}
          {resp.emailMode && (
            <p style={{ fontSize: 12, color: "#6b7280" }}>
              Modo de correo: {resp.emailMode}
              {resp.emailError ? ` (error: ${resp.emailError})` : ""}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
