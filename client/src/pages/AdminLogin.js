// client/src/pages/AdminLogin.js
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
    <div className="min-h-screen bg-umgBlue flex items-center justify-center">
      <div className="bg-white text-slate-800 rounded-2xl shadow-xl border border-white/20 p-8 w-[90%] max-w-md">
        <h2 className="text-2xl font-bold text-center text-umgBlue mb-2">
          Acceso administrador
        </h2>
        <p className="text-center text-slate-500 text-sm mb-6">
          Ingrese la clave de administración para acceder al panel.
        </p>

        <form onSubmit={submit} className="grid gap-4">
          <input
            type="password"
            placeholder="Clave de admin"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            className="rounded-xl border border-slate-300 px-4 py-2 focus:ring-umgBlue focus:border-umgBlue outline-none"
            autoFocus
          />
          <button
            type="submit"
            className="rounded-xl bg-umgBlue text-white font-semibold py-2 hover:brightness-105 transition"
          >
            Entrar
          </button>
        </form>

        {msg && (
          <p
            className={`mt-4 text-center font-medium ${
              msg.includes("inválida")
                ? "text-rose-600"
                : "text-emerald-600"
            }`}
          >
            {msg}
          </p>
        )}
      </div>
    </div>
  );
}
