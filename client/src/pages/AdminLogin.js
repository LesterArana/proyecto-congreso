import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";

export default function AdminLogin() {
  const [key, setKey] = useState("");
  const [msg, setMsg] = useState(null);
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setMsg(null);
    const k = key.trim();
    if (!k) return setMsg("Ingresa la clave de administración");

    try {
      // probar clave
      const res = await api.get("/admin/ping", {
        headers: { "x-admin-key": k },
      });
      if (res.data?.ok) {
        localStorage.setItem("adminKey", k);
        navigate("/admin", { replace: true });
      } else {
        setMsg("Clave inválida");
      }
    } catch (err) {
      setMsg("Clave inválida");
    }
  };

  return (
    <div style={{ maxWidth: 420, margin: "0 auto", padding: 16 }}>
      <h2>Acceso administrador</h2>
      <form onSubmit={submit} style={{ display: "grid", gap: 8, marginTop: 12 }}>
        <input
          type="password"
          placeholder="Clave de admin"
          value={key}
          onChange={e => setKey(e.target.value)}
          style={{ padding: 8, borderRadius: 8, border: "1px solid #ddd" }}
          autoFocus
        />
        <button type="submit" style={{ background:"#2563eb", color:"#fff", border:"none", borderRadius:8, padding:"8px 12px" }}>
          Entrar
        </button>
      </form>
      {msg && <p style={{ color:"crimson", marginTop: 8 }}>{msg}</p>}
    </div>
  );
}
