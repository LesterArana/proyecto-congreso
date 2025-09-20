// client/src/pages/Register.js
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { api } from "../api"; // axios preconfigurado a REACT_APP_API_URL o http://localhost:4000/api
import { useSearchParams } from "react-router-dom";


const schema = z.object({
  name: z.string().min(2, "Ingresa tu nombre"),
  email: z.string().email("Correo inválido"),
  school: z.string().optional(),
  activityId: z.string().min(1, "Selecciona una actividad"),
});

export default function Register() {
  const [activities, setActivities] = useState([]);
  const [msg, setMsg] = useState(null);        // { ok: boolean, text: string }
  const [resp, setResp] = useState(null);      // respuesta del backend (para mostrar QR)
  const [search] = useSearchParams();
  const preId = search.get("activityId");


  const {
  register,
  handleSubmit,
  reset,
  setValue,
  formState: { errors, isSubmitting },
} = useForm({
  resolver: zodResolver(schema),
  defaultValues: { name: "", email: "", school: "", activityId: preId || "" },
});


useEffect(() => {
  if (preId) setValue("activityId", String(preId));
}, [preId, setValue]);

  useEffect(() => {
    // Carga actividades con cupos
    api.get("/activities/summary")
      .then(res => setActivities(res.data))
      .catch(() => setActivities([]));
  }, []);

  const onSubmit = async (values) => {
    setMsg(null);
    setResp(null);
    try {
      const payload = {
        name: values.name,
        email: values.email,
        school: values.school || "",
        activityId: Number(values.activityId),
      };
      const { data } = await api.post("/registrations", payload);
      setResp(data);
      setMsg({ ok: true, text: "✅ ¡Inscripción creada! Revisa tu correo si está configurado o guarda tu QR." });
      reset({ name: "", email: "", school: "", activityId: "" });
      // refrescar actividades (para ver cupos actualizados)
      api.get("/activities/summary").then(res => setActivities(res.data)).catch(()=>{});
    } catch (err) {
      const text =
        err?.response?.data?.message ||
        "❌ Ocurrió un error al inscribirte. Intenta de nuevo.";
      setMsg({ ok: false, text });
    }
  };

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: 16 }}>
      <h2 style={{ marginBottom: 12 }}>Inscripción</h2>

      <form onSubmit={handleSubmit(onSubmit)} style={{ display: "grid", gap: 12 }}>

        <label style={{ display: "grid", gap: 6 }}>
          Nombre
          <input
            {...register("name")}
            type="text"
            placeholder="Tu nombre"
            style={{ padding: 8, borderRadius: 8, border: "1px solid #ddd" }}
          />
          {errors.name && <small style={{ color: "crimson" }}>{errors.name.message}</small>}
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          Correo
          <input
            {...register("email")}
            type="email"
            placeholder="tucorreo@dominio.com"
            style={{ padding: 8, borderRadius: 8, border: "1px solid #ddd" }}
          />
          {errors.email && <small style={{ color: "crimson" }}>{errors.email.message}</small>}
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          Colegio (opcional)
          <input
            {...register("school")}
            type="text"
            placeholder="Nombre del colegio"
            style={{ padding: 8, borderRadius: 8, border: "1px solid #ddd" }}
          />
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          Actividad
          <select
            {...register("activityId")}
            style={{ padding: 8, borderRadius: 8, border: "1px solid #ddd" }}
          >
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
          style={{
            background: "#2563eb",
            color: "white",
            padding: "10px 16px",
            borderRadius: 10,
            border: "none",
            cursor: "pointer",
            opacity: isSubmitting ? 0.7 : 1,
          }}
        >
          {isSubmitting ? "Enviando..." : "Inscribirme"}
        </button>
      </form>

      {/* Mensaje de estado */}
      {msg && (
        <div style={{
          marginTop: 16,
          padding: 12,
          borderRadius: 8,
          background: msg.ok ? "#dcfce7" : "#fee2e2",
          color: msg.ok ? "#065f46" : "#991b1b"
        }}>
          {msg.text}
        </div>
      )}

      {/* Detalle útil tras crear inscripción */}
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
          {/* Si usas modo ethereal en el server y hay internet, verás un link de vista previa */}
          {resp.emailPreview && (
            <p>
              Vista previa del correo:{" "}
              <a href={resp.emailPreview} target="_blank" rel="noreferrer">
                Abrir
              </a>
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
