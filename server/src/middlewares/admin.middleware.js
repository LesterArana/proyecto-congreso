// server/src/middlewares/admin.middleware.js
export function requireAdmin(req, res, next) {
  const key =
    req.get("x-admin-key") ||
    req.query.key ||
    (req.cookies ? req.cookies.adminKey : null);

  if (!process.env.ADMIN_KEY) {
    console.warn("⚠️ Falta ADMIN_KEY en .env");
    return res.status(500).json({ message: "Server misconfigured" });
  }

  if (key && key === process.env.ADMIN_KEY) {
    return next();
  }
  return res.status(401).json({ message: "Unauthorized" });
}
