import { Link } from "react-router-dom";

export default function AdminDashboard() {
  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: 16 }}>
      <h2>Panel de Administración</h2>
      <p>Desde aquí puedes gestionar actividades, inscripciones, check-ins y diplomas.</p>

      <ul style={{ lineHeight: 1.9 }}>
        <li>
          <Link to="/checkin">Ir al Check-in</Link>

        </li>

        {/* Ejemplos de accesos rápidos a actividades (puedes quitarlos o generarlos dinámicamente) */}
        <li>
          <Link to="/admin/activity/1">Ver inscripciones de la Actividad #1</Link>
        </li>
        <li>
          <Link to="/admin/activity/2">Ver inscripciones de la Actividad #2</Link>
        </li>

        <li>
          <Link to="/admin/reports">Reporte de asistencia</Link>
        </li>

        {/* ✅ NUEVO: acceso visible a la gestión de diplomas */}
        <li>
          <Link to="/admin/diplomas">Gestión de Diplomas</Link>
        </li>
        <li>
  <a href="/admin/winners">Gestión de Resultados (ganadores)</a>
</li>

      </ul>
    </div>
  );
}
