import { useEffect, useState } from "react";
import { api } from "../api";
import { Link, useNavigate } from "react-router-dom";

function toLocalInputValue(dateStr) {
  // Convierte ISO -> valor compatible con <input type="datetime-local">
  const d = new Date(dateStr || Date.now());
  const pad = (n) => String(n).padStart(2, "0");
  const y = d.getFullYear();
  const m = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const h = pad(d.getHours());
  const min = pad(d.getMinutes());
  return `${y}-${m}-${day}T${h}:${min}`;
}

export default function AdminActivities() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState(null);

  // form state
  const [editing, setEditing] = useState(null); // actividad en edición (obj) o null
  const [form, setForm] = useState({
    kind: "",
    title: "",
    description: "",
    date: toLocalInputValue(new Date().toISOString()),
    capacity: 20,
  });

  const navigate = useNavigate();

  const load = () => {
    setLoading(true);
    setMsg(null);
    api.get("/activities")
      .then(res => setItems(res.data || []))
      .catch(err => {
        const st = err?.response?.status;
        const text = err?.response?.data?.message || "Error cargando actividades";
        setMsg(text);
        if (st === 401) navigate("/admin-login", { replace: true });
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []); // eslint-disable-line

  const resetForm = () => {
    setEditing(null);
    setForm({
      kind: "",
      title: "",
      description: "",
      date: toLocalInputValue(new Date().toISOString()),
      capacity: 20,
    });
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setMsg(null);

    // convertir datetime-local a ISO
    const isoDate = new Date(form.date).toISOString();
    const payload = {
      kind: form.kind.trim(),
      title: form.title.trim(),
      description: form.description?.trim() || "",
      date: isoDate,
      capacity: Number(form.capacity),
    };

    try {
      if (editing) {
        await api.put(`/admin/activities/${editing.id}`, payload);
        setMsg("Actividad actualizada.");
      } else {
       await api.post(`/admin/activities`, payload);
        setMsg("Actividad creada.");
      }
      resetForm();
      load();
    } catch (err) {
      const st = err?.response?.status;
      const text = err?.response?.data?.message || "Error guardando actividad";
      setMsg(text);
      if (st === 401) navigate("/admin-login", { replace: true });
    }
  };

  const onEdit = (a) => {
    setEditing(a);
    setForm({
      kind: a.kind || "",
      title: a.title || "",
      description: a.description || "",
      date: toLocalInputValue(a.date),
      capacity: a.capacity || 20,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const onDelete = async (a) => {
    if (!window.confirm(`¿Eliminar actividad "${a.title}"?`)) return;
    try {
      await api.delete(`/activities/${a.id}`);
      setMsg("Actividad eliminada.");
      if (editing?.id === a.id) resetForm();
      load();
    } catch (err) {
      const st = err?.response?.status;
      const text = err?.response?.data?.message || "No se pudo eliminar";
      setMsg(text);
      if (st === 401) navigate("/admin-login", { replace: true });
    }
  };

  if (loading) return <div style={{ padding: 16 }}>Cargando…</div>;

  return (
    <div style={{ maxWidth: 980, margin: "0 auto", padding: 16 }}>
      <h2>Administrar actividades</h2>

      {msg && (
        <div style={{ margin: "8px 0", padding: 10, borderRadius: 8, background: "#fef3c7", color: "#92400e" }}>
          {msg}
        </div>
      )}

      {/* Formulario crear/editar */}
      <form onSubmit={onSubmit} style={{ display: "grid", gap: 8, border: "1px solid #eee", padding: 12, borderRadius: 10 }}>
        <div style={{ display: "grid", gap: 6 }}>
          <label>Tipo</label>
<select
  value={form.kind}
  onChange={(e) => setForm({ ...form, kind: e.target.value })}
  style={{ padding: 8, borderRadius: 8, border: "1px solid #ddd" }}
  required
>
  <option value="">-- Selecciona --</option>
  <option value="TALLER">Taller</option>
  <option value="COMPETENCIA">Competencia</option>
</select>

        </div>
        <div style={{ display: "grid", gap: 6 }}>
          <label>Título</label>
          <input
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            style={{ padding: 8, borderRadius: 8, border: "1px solid #ddd" }}
            required
          />
        </div>
        <div style={{ display: "grid", gap: 6 }}>
          <label>Descripción</label>
          <textarea
            rows={3}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            style={{ padding: 8, borderRadius: 8, border: "1px solid #ddd" }}
          />
        </div>
        <div style={{ display: "grid", gap: 6 }}>
          <label>Fecha y hora</label>
          <input
            type="datetime-local"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
            style={{ padding: 8, borderRadius: 8, border: "1px solid #ddd" }}
            required
          />
        </div>
        <div style={{ display: "grid", gap: 6 }}>
          <label>Cupos</label>
          <input
            type="number"
            min={1}
            value={form.capacity}
            onChange={(e) => setForm({ ...form, capacity: e.target.value })}
            style={{ padding: 8, borderRadius: 8, border: "1px solid #ddd", width: 140 }}
            required
          />
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button type="submit" style={{ background: "#16a34a", color: "#fff", border: "none", borderRadius: 8, padding: "8px 12px" }}>
            {editing ? "Guardar cambios" : "Crear actividad"}
          </button>
          {editing && (
            <button type="button" onClick={resetForm} style={{ border: "1px solid #ddd", borderRadius: 8, padding: "8px 12px", background: "#fff" }}>
              Cancelar edición
            </button>
          )}
        </div>
      </form>

      {/* Lista */}
      <h3 style={{ marginTop: 16 }}>Lista de actividades</h3>
      <table width="100%" cellPadding={8} style={{ borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ background: "#f3f4f6" }}>
            <th align="left">ID</th>
            <th align="left">Tipo</th>
            <th align="left">Título</th>
            <th align="left">Fecha</th>
            <th align="left">Cupos</th>
            <th align="left">Inscritos</th>
            <th align="left">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {items.map(a => (
            <tr key={a.id} style={{ borderTop: "1px solid #eee" }}>
              <td>{a.id}</td>
              <td>{a.kind}</td>
              <td>{a.title}</td>
              <td>{new Date(a.date).toLocaleString()}</td>
              <td>{a.capacity}</td>
              <td>{a._count?.registrations ?? 0}</td>
              <td style={{ display: "flex", gap: 8 }}>
                <button onClick={() => onEdit(a)} style={{ padding: "4px 8px" }}>Editar</button>
                <button onClick={() => onDelete(a)} style={{ padding: "4px 8px", color: "#b91c1c" }}>Eliminar</button>
                <Link to={`/admin/activity/${a.id}`} style={{ padding: "4px 8px" }}>
                  Ver inscripciones
                </Link>
              </td>
            </tr>
          ))}
          {items.length === 0 && (
            <tr><td colSpan={7} align="center" style={{ color: "#6b7280" }}>No hay actividades</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
