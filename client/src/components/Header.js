// src/components/Header.js
// src/components/Header.js
import { Link, NavLink } from "react-router-dom";
import { useEffect, useState } from "react";

export default function Header() {
  const [isAdmin, setIsAdmin] = useState(
    Boolean(localStorage.getItem("adminKey"))
  );

  useEffect(() => {
    // Si cambian adminKey en otra pestaña, reflejar aquí
    const onStorage = (e) => {
      if (e.key === "adminKey") {
        setIsAdmin(Boolean(e.newValue));
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const logout = () => {
    localStorage.removeItem("adminKey");
    setIsAdmin(false);
    window.location.href = "/"; // redirige al inicio
  };

  const linkCls = ({ isActive }) =>
    [
      "px-3 py-2 rounded-xl font-medium transition",
      isActive
        ? "bg-white text-umgBlue"
        : "text-white/90 hover:bg-white/10 hover:text-white",
    ].join(" ");

  return (
    <header className="sticky top-0 z-40 bg-umgBlue/95 backdrop-blur border-b border-white/10">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo / título */}
        <Link to="/" className="no-underline">
          <h1 className="m-0 text-white text-lg font-extrabold tracking-wide">
             Congreso de Tecnología
          </h1>
        </Link>

        {/* Navegación */}
        <nav className="flex items-center gap-2">
          <NavLink to="/" className={linkCls} end>
            Inicio
          </NavLink>
          <NavLink to="/register" className={linkCls}>
            Inscripciones
          </NavLink>
          <NavLink to="/results" className={linkCls}>
            Resultados
          </NavLink>
          <NavLink to="/faq" className={linkCls}>
            FAQ
          </NavLink>
          <NavLink to="/my-registrations" className={linkCls}>
            Mis inscripciones
          </NavLink>
          <NavLink to="/admin" className={linkCls}>
            Admin
          </NavLink>

          {isAdmin && (
            <button
  onClick={() => { localStorage.removeItem("adminToken"); localStorage.removeItem("adminUser"); window.location.href = "/"; }}
  style={{ padding:"6px 10px", borderRadius:8, border:"1px solid #ddd", background:"#fff" }}
>
  Salir
</button>
          )}
        </nav>
      </div>
    </header>
  );
}


//<NavLink to="/staff/checkin" style={linkStyle}>Check-in</NavLink>

 //<NavLink to="/my" style={linkStyle}>Mis inscripciones</NavLink>