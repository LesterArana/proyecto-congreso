// src/components/Header.js
import { Link, NavLink } from "react-router-dom";


const linkStyle = ({ isActive }) => ({
  padding: "8px 12px",
  borderRadius: 8,
  textDecoration: "none",
  color: isActive ? "white" : "#111",
  background: isActive ? "#2563eb" : "transparent",
});

export default function Header() {
  return (
    <header style={{ borderBottom: "1px solid #eee", background: "#fff" }}>
      <div style={{
        maxWidth: 1100, margin: "0 auto", padding: "16px 24px",
        display: "flex", alignItems: "center", gap: 24, justifyContent: "space-between"
      }}>
        <Link to="/" style={{ textDecoration: "none" }}>
          <h1 style={{ margin: 0, fontSize: 20 }}>🎓 Congreso de Tecnología</h1>
        </Link>

        <nav style={{ display: "flex", gap: 8 }}>
          <NavLink to="/" style={linkStyle} end>Inicio</NavLink>
          <NavLink to="/register" style={linkStyle}>Inscripciones</NavLink>
          <NavLink to="/results" style={linkStyle}>Resultados</NavLink>
          <NavLink to="/faq" style={linkStyle}>FAQ</NavLink>
          <NavLink to="/admin" style={linkStyle}>Admin</NavLink>
          <NavLink to="/my-registrations" style={linkStyle}>
             Mis inscripciones
            </NavLink>
          
          <button
          onClick={() => { localStorage.removeItem("adminKey"); window.location.href = "/"; }}
          style={{ padding:"6px 10px", borderRadius:8, border:"1px solid #ddd", background:"#fff" }}
            >
            Salir
          </button>


        </nav>
      </div>
    </header>
  );
}

//<NavLink to="/staff/checkin" style={linkStyle}>Check-in</NavLink>

 //<NavLink to="/my" style={linkStyle}>Mis inscripciones</NavLink>