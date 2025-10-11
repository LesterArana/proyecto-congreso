// adminlogin
import { useState } from "react";
import { api } from "../api";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg("");
    try {
      const { data } = await api.post("/auth/login", { email, password });
      localStorage.setItem("adminToken", data.token);
      window.location.href = "/admin";
    } catch (err) {
      const m = err?.response?.data?.error || "Error iniciando sesión.";
      setMsg(m);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0b5aaa", display: "grid", placeItems: "center" }}>
      <form onSubmit={handleSubmit}
        style={{
          width: 340, background: "#083a75", color: "#fff",
          padding: 20, borderRadius: 12, boxShadow: "0 8px 24px rgba(0,0,0,.25)",
          display: "grid", gap: 10
        }}>
        <h3 style={{ margin: 0, textAlign: "center" }}>Acceso administrador</h3>

        <input
          type="email" placeholder="Correo"
          value={email} onChange={(e) => setEmail(e.target.value)}
          style={{ padding: 10, borderRadius: 8, border: "1px solid #9db7e0", background: "#fff", color: "#111" }}
        />
        <input
          type="password" placeholder="Contraseña"
          value={password} onChange={(e) => setPassword(e.target.value)}
          style={{ padding: 10, borderRadius: 8, border: "1px solid #9db7e0", background: "#fff", color: "#111" }}
        />

        <button type="submit"
          style={{ background: "#2563eb", color: "#fff", border: "none", padding: 10, borderRadius: 8, cursor: "pointer" }}>
          Entrar
        </button>

        {msg && <div style={{ color: "#ffb4b4", fontSize: 13, textAlign: "center" }}>{msg}</div>}
      </form>
    </div>
  );
}
