// client/src/pages/Register.js
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSearchParams } from "react-router-dom";
import { api } from "../api";

// ====== Schema de validación
const schema = z.object({
  name: z.string().min(2, "Ingresa tu nombre"),
  email: z.string().email("Correo inválido"),
  school: z.string().optional(),
  activityId: z.string().min(1, "Selecciona una actividad"),
});

export default function Register() {
  const [search] = useSearchParams();
  const preId = search.get("activityId");

  const [activities, setActivities] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [listMsg, setListMsg] = useState(null);

  const [resp, setResp] = useState(null); // respuesta de inscripción (QR, etc.)
  const [msg, setMsg] = useState(null);   // mensaje del formulario

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { name: "", email: "", school: "", activityId: preId || "" },
  });

  const selectedActivityId = watch("activityId");

  // ====== Cargar actividades (resumen con cupos)
  async function loadActivities() {
    setLoadingList(true);
    setListMsg(null);
    try {
      const res = await api.get("/activities/summary");
      setActivities(Array.isArray(res.data) ? res.data : []);
      if (!res.data?.length) {
        setListMsg({ ok: true, text: "No hay actividades disponibles por ahora." });
      }
    } catch (e) {
      setActivities([]);
      setListMsg({
        ok: false,
        text: e?.response?.data?.error || "Error cargando actividades.",
      });
    } finally {
      setLoadingList(false);
    }
  }

  useEffect(() => {
    loadActivities();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (preId) setValue("activityId", String(preId));
  }, [preId, setValue]);

  // ====== Acción de los botones "Inscribirme" en cards
  function pickActivity(id) {
    setValue("activityId", String(id));
    // hacer scroll al formulario
    const formEl = document.getElementById("inscription-form");
    if (formEl) formEl.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  // ====== Submit del formulario
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
      setMsg({
        ok: true,
        text: "✅ ¡Inscripción creada! Guarda tu QR. Si el correo está configurado en el servidor, también recibirás un email.",
      });

      // reset cuidadoso: dejamos activityId vacío para evitar reinscripción inmediata
      reset({ name: "", email: "", school: "", activityId: "" });

      // refrescar cupos
      loadActivities();
    } catch (err) {
      const text =
        err?.response?.data?.message ||
        "❌ Ocurrió un error al inscribirte. Intenta de nuevo.";
      setMsg({ ok: false, text });
    }
  };

  // ====== Helpers UI
  const input = { padding: 8, borderRadius: 8, border: "1px solid #ddd" };
  const btn = {
    background: "#2563eb",
    color: "#fff",
    padding: "8px 12px",
    borderRadius: 8,
    border: "none",
    cursor: "pointer",
  };

  const selectedActivity = useMemo(
    () => activities.find((a) => String(a.id) === String(selectedActivityId)),
    [activities, selectedActivityId]
  );

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: 16 }}>
      <h2 style={{ marginBottom: 12 }}>Inscripciones</h2>

      {/* ====== Lista de actividades (cards) */}
      <section style={{ marginBottom: 20 }}>
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8
        }}>
          <h3 style={{ margin: 0 }}>Actividades disponibles</h3>
          <button onClick={loadActivities} style={{ ...btn, background: "#6b7280" }}>
            Recargar
          </button>
        </div>

        {loadingList && <p>Cargando actividades…</p>}

        {listMsg && (
          <div style={{
            padding: 10, borderRadius: 8,
            background: listMsg.ok ? "#dcfce7" : "#fee2e2",
            color: listMsg.ok ? "#065f46" : "#991b1b", marginBottom: 12
          }}>
            {listMsg.text}
          </div>
        )}

        <div style={{
          display: "grid",
          gap: 12,
          gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))"
        }}>
          {activities.map((a) => {
            const full = a.available <= 0;
            return (
              <div key={a.id} style={{
                border: "1px solid #eee",
                borderRadius: 12,
                padding: 12,
                background: full ? "#f9fafb" : "#fff",
                opacity: full ? 0.7 : 1
              }}>
                <div style={{ fontWeight: 700, marginBottom: 4 }}>
                  {a.kind}: {a.title}
                </div>
                {a.description && (
                  <div style={{ fontSize: 13, color: "#374151", marginBottom: 6 }}>
                    {a.description}
                  </div>
                )}
                <div style={{ fontSize: 13, color: "#6b7280" }}>
                  {new Date(a.date).toLocaleString()}
                </div>
                <div style={{ fontSize: 12, marginTop: 8 }}>
                  Capacidad: <b>{a.capacity}</b> — Disponibles: <b>{a.available}</b>
                </div>

                <div style={{ marginTop: 10 }}>
                  <button
                    onClick={() => pickActivity(a.id)}
                    disabled={full}
                    style={{
                      ...btn,
                      width: "100%",
                      background: full ? "#9ca3af" : "#2563eb",
                    }}
                  >
                    {full ? "Cupo lleno" : "Inscribirme"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ====== Formulario de inscripción */}
      <section id="inscription-form" style={{ borderTop: "1px solid #eee", paddingTop: 16 }}>
        <h3 style={{ marginBottom: 8 }}>Formulario</h3>

        {/* Info de la actividad elegida */}
        {selectedActivity ? (
          <div style={{
            padding: 10, borderRadius: 8, border: "1px solid #e5e7eb",
            background: "#f9fafb", marginBottom: 12
          }}>
            <div style={{ fontWeight: 600 }}>
              Seleccionada: {selectedActivity.kind} — {selectedActivity.title}
            </div>
            <div style={{ fontSize: 13, color: "#6b7280" }}>
              {new Date(selectedActivity.date).toLocaleString()} ·
              {" "}Disp: {selectedActivity.available}/{selectedActivity.capacity}
            </div>
          </div>
        ) : (
          <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 12 }}>
            Tip: elige una actividad en la lista superior para precargar el formulario.
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} style={{ display: "grid", gap: 12, maxWidth: 700 }}>
          <label style={{ display: "grid", gap: 6 }}>
            Nombre
            <input {...register("name")} type="text" placeholder="Tu nombre" style={input} />
            {errors.name && <small style={{ color: "crimson" }}>{errors.name.message}</small>}
          </label>

          <label style={{ display: "grid", gap: 6 }}>
            Correo
            <input {...register("email")} type="email" placeholder="tucorreo@dominio.com" style={input} />
            {errors.email && <small style={{ color: "crimson" }}>{errors.email.message}</small>}
          </label>

          <label style={{ display: "grid", gap: 6 }}>
            Colegio (opcional)
            <input {...register("school")} type="text" placeholder="Nombre del colegio" style={input} />
          </label>

          <label style={{ display: "grid", gap: 6 }}>
            Actividad
            <select {...register("activityId")} style={input}>
              <option value="">-- Selecciona --</option>
              {activities.map((a) => (
                <option key={a.id} value={a.id} disabled={a.available <= 0}>
                  {a.kind}: {a.title} — {new Date(a.date).toLocaleString()} (Disp: {a.available}/{a.capacity})
                </option>
              ))}
            </select>
            {errors.activityId && (
              <small style={{ color: "crimson" }}>{errors.activityId.message}</small>
            )}
          </label>

          <div style={{ display: "flex", gap: 8 }}>
            <button
              disabled={isSubmitting}
              type="submit"
              style={{
                ...btn,
                padding: "10px 16px",
                opacity: isSubmitting ? 0.7 : 1,
              }}
            >
              {isSubmitting ? "Enviando..." : "Inscribirme"}
            </button>
            <button
              type="button"
              onClick={() => { reset({ name: "", email: "", school: "", activityId: "" }); setMsg(null); setResp(null); }}
              style={{ ...btn, background: "#6b7280" }}
            >
              Limpiar
            </button>
          </div>
        </form>

        {/* Mensaje del form */}
        {msg && (
          <div style={{
            marginTop: 16, padding: 12, borderRadius: 8,
            background: msg.ok ? "#dcfce7" : "#fee2e2",
            color: msg.ok ? "#065f46" : "#991b1b"
          }}>
            {msg.text}
          </div>
        )}

        {/* Resumen tras inscribirse */}
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
      </section>
    </div>
  );
}
