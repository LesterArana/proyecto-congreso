import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// Páginas públicas
import Landing from "./pages/Landing";
import Register from "./pages/Register";
import MyRegistrations from "./pages/MyRegistrations";
import FAQ from "./pages/FAQ";
import Results from "./pages/Results"; // si aún no existe, crea un placeholder simple

// Admin y utilidades
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import AdminActivities from "./pages/AdminActivities";   // lista
import AdminActivity from "./pages/AdminActivity";       // detalle por actividad (inscripciones)
import AdminAttendanceReport from "./pages/AdminAttendanceReport"; // reporte de asistencia
import AdminActivityDiplomas from "./pages/AdminActivityDiplomas"; // gestión de diplomas
import Checkin from "./pages/Checkin";                   // pantalla de escaneo QR

// Layout y guard
import Header from "./components/Header";
import RequireAdmin from "./components/RequireAdmin.jsx";

import AdminWinners from "./pages/AdminWinners";
import Home from "./pages/Home";

// Estilos
import "./App.css";

export default function App() {
  return (
    <BrowserRouter>
      <Header />
      <Routes>
        {/* públicas */}
        <Route path="/" element={<Landing />} />
        <Route path="/register" element={<Register />} />
        <Route path="/results" element={<Results />} />
        <Route path="/faq" element={<FAQ />} />
        <Route path="/my-registrations" element={<MyRegistrations />} />

        {/* admin login */}
        <Route path="/admin-login" element={<AdminLogin />} />

        {/* admin panel y herramientas (protegidas) */}
        <Route
          path="/admin"
          element={
            <RequireAdmin>
              <AdminDashboard />
            </RequireAdmin>
          }
        />
        <Route
          path="/admin/activities"
          element={
            <RequireAdmin>
              <AdminActivities />
            </RequireAdmin>
          }
        />
        <Route
          path="/admin/activity/:id"
          element={
            <RequireAdmin>
              <AdminActivity />
            </RequireAdmin>
          }
        />
        <Route
          path="/admin/reports"
          element={
            <RequireAdmin>
              <AdminAttendanceReport />
            </RequireAdmin>
          }
        />
        <Route
          path="/admin/diplomas"
          element={
            <RequireAdmin>
              <AdminActivityDiplomas />
            </RequireAdmin>
          }
        />

        {/* CHECK-IN — ruta oficial */}
        <Route
          path="/checkin"
          element={
            <RequireAdmin>
              <Checkin />
            </RequireAdmin>
          }
        />
        {/* Alias por si hay enlaces viejos */}
        <Route path="/admin/checkin" element={<Navigate to="/checkin" replace />} />

        <Route
  path="/admin/winners"
  element={
    <RequireAdmin>
      <AdminWinners />
    </RequireAdmin>
  }
/>

        <Route path="/" element={<Home />} />

        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

// Componente 404 simple por si no lo tienes
function NotFound() {
  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: 16 }}>
      <h2>Página no encontrada</h2>
      <p>La ruta a la que intentaste acceder no existe.</p>
    </div>
  );
}
