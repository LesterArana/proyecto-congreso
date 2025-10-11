// server/src/middlewares/admin.middleware.js
export function adminMiddleware(req, res, next) {
  const headerKey = req.header("x-admin-key");
  const envKey = process.env.ADMIN_KEY || "";
  if (!envKey) {
    return res.status(500).json({ error: "Falta ADMIN_KEY en .env del servidor." });
  }
  if (!headerKey || headerKey !== envKey) {
    return res.status(401).json({ error: "No autorizado (x-admin-key inválida)." });
  }
  next();
}

// Alias para mantener compatibilidad con rutas que usan `requireAdmin`
export const requireAdmin = adminMiddleware;
