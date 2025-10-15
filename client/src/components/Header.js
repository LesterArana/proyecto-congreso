// client/src/components/Header.js
import { useEffect, useMemo, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";

// URL del logo servido por el backend (server/public/logo-umg.jpg)
// Si REACT_APP_API_BASE no existe, intenta relativo (útil en dev proxy)
const API_BASE = process.env.REACT_APP_API_BASE || "";
const LOGO_URL = `${API_BASE}/public/logo-umg.jpg`;

export default function Header() {
  const [open, setOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // detectar si hay sesión admin
  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    setIsAdmin(!!token);
  }, [location.pathname]);

  // cierra el menú al cambiar de ruta
  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  const logout = () => {
    localStorage.removeItem("adminToken");
    navigate("/admin-login");
  };

  // links públicos
  const publicLinks = useMemo(
    () => [
      { to: "/", label: "Inicio" },
      { to: "/register", label: "Inscripciones" },
      { to: "/results", label: "Resultados" },
      { to: "/faq", label: "FAQ" },
      { to: "/my-registrations", label: "Mis inscripciones" },
    ],
    []
  );

  // links admin (solo visibles si isAdmin)
  const adminLinks = useMemo(
    () => [
      { to: "/admin", label: "Panel" },
      { to: "/checkin", label: "Check-in" },
      { to: "/admin/activities", label: "Inscripciones" },
      { to: "/admin/reports", label: "Reportes" },
      { to: "/admin/diplomas", label: "Diplomas" },
      { to: "/admin/winners", label: "Resultados" },
    ],
    []
  );

  const navLinkCls = ({ isActive }) =>
    `px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
      isActive
        ? "bg-white/20 text-white"
        : "text-white/90 hover:text-white hover:bg-white/10"
    }`;

  return (
    <header className="sticky top-0 z-40 backdrop-blur supports-[backdrop-filter]:bg-umgBlue/80 bg-umgBlue text-white border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Barra superior */}
        <div className="flex items-center justify-between h-16 gap-3">
          {/* Logo + título */}
          <Link to="/" className="flex items-center gap-3 shrink-0">
            <img
              src={LOGO_URL}
              alt="UMG"
              className="w-9 h-9 rounded-full object-cover border border-white/30"
              onError={(e) => {
                // Fallback silencioso si el logo no carga
                e.currentTarget.style.display = "none";
              }}
              loading="lazy"
            />
            <div className="leading-tight">
              <div className="text-[15px] font-semibold">
                Universidad Mariano Gálvez
              </div>
              <div className="text-[12px] text-white/80">
                Congreso de Tecnología
              </div>
            </div>
          </Link>

          {/* Navegación (desktop) */}
          <nav className="hidden md:flex items-center gap-1">
            {publicLinks.map((l) => (
              <NavLink key={l.to} to={l.to} className={navLinkCls}>
                {l.label}
              </NavLink>
            ))}

            <div className="mx-1 h-6 w-px bg-white/20" />

            {isAdmin ? (
              <>
                {adminLinks.map((l) => (
                  <NavLink key={l.to} to={l.to} className={navLinkCls}>
                    {l.label}
                  </NavLink>
                ))}
                <button
                  onClick={logout}
                  className="ml-1 px-3 py-2 rounded-xl text-sm font-semibold bg-white text-umgBlue hover:brightness-95"
                  title="Cerrar sesión"
                >
                  Cerrar sesión
                </button>
              </>
            ) : (
              <NavLink
                to="/admin-login"
                className="ml-1 px-3 py-2 rounded-xl text-sm font-semibold bg-white text-umgBlue hover:brightness-95"
              >
                Admin
              </NavLink>
            )}
          </nav>

          {/* Botón hamburguesa (mobile) */}
          <button
            onClick={() => setOpen((v) => !v)}
            className="md:hidden inline-flex items-center justify-center w-10 h-10 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20"
            aria-label="Abrir menú"
            aria-expanded={open}
          >
            <svg
              className="w-5 h-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
            >
              {open ? (
                <path strokeWidth="2" strokeLinecap="round" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeWidth="2" strokeLinecap="round" d="M3 6h18M3 12h18M3 18h18" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Drawer mobile */}
      <div
        className={`md:hidden transition-[max-height] duration-300 overflow-hidden ${
          open ? "max-h-[80vh]" : "max-h-0"
        }`}
      >
        <div className="px-4 pb-4 pt-2 border-t border-white/10">
          <nav className="grid gap-1">
            {publicLinks.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                className={({ isActive }) =>
                  `block px-3 py-2 rounded-xl text-base ${
                    isActive
                      ? "bg-white/20 text-white"
                      : "text-white/90 hover:text-white hover:bg-white/10"
                  }`
                }
              >
                {l.label}
              </NavLink>
            ))}

            {isAdmin && (
              <>
                <div className="mt-2 mb-1 text-[12px] uppercase tracking-wide text-white/60">
                  Administración
                </div>
                {adminLinks.map((l) => (
                  <NavLink
                    key={l.to}
                    to={l.to}
                    className={({ isActive }) =>
                      `block px-3 py-2 rounded-xl text-base ${
                        isActive
                          ? "bg-white/20 text-white"
                          : "text-white/90 hover:text-white hover:bg-white/10"
                      }`
                    }
                  >
                    {l.label}
                  </NavLink>
                ))}
              </>
            )}

            <div className="mt-3 flex flex-wrap gap-2">
              {isAdmin ? (
                <button
                  onClick={logout}
                  className="w-full inline-flex items-center justify-center px-3 py-2 rounded-xl text-sm font-semibold bg-white text-umgBlue hover:brightness-95"
                >
                  Cerrar sesión
                </button>
              ) : (
                <NavLink
                  to="/admin-login"
                  className="w-full inline-flex items-center justify-center px-3 py-2 rounded-xl text-sm font-semibold bg-white text-umgBlue hover:brightness-95"
                >
                  Admin
                </NavLink>
              )}
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
}
