// server/src/middlewares/auth.middleware.js
import jwt from "jsonwebtoken";

export function requireAuth(req, res, next) {
  try {
    const auth = req.header("Authorization") || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
    if (!token) return res.status(401).json({ error: "Falta token" });

    const secret = process.env.JWT_SECRET || "";
    if (!secret) {
      return res.status(500).json({ error: "Falta JWT_SECRET en el .env del servidor" });
    }

    const payload = jwt.verify(token, secret); // { sub, email, role, ... }
    req.user = payload; // lo dejas disponible para controladores
    next();
  } catch (e) {
    return res.status(401).json({ error: "Token inválido o expirado" });
  }
}

// (opcional) si quieres exigir rol admin en JWT:
// úsalo solo si ya emites tokens con role="ADMIN"
export function requireAuthAdmin(req, res, next) {
  requireAuth(req, res, (err) => {
    if (err) return; // requireAuth ya respondió
    if (req.user?.role !== "ADMIN") {
      return res.status(403).json({ error: "Requiere rol ADMIN" });
    }
    next();
  });
}
