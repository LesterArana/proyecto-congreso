// server/src/routes/auth.routes.js
import { Router } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const router = Router();
const prisma = new PrismaClient();

router.post("/login", async (req, res) => {
  try {
    let { email, password } = req.body || {};
    email = String(email || "").trim().toLowerCase();
    password = String(password || "");

    if (!email || !password) {
      return res.status(400).json({ error: "Faltan credenciales" });
    }

    // ✅ Busca el admin en el modelo correcto
    let admin = await prisma.adminUser.findUnique({ where: { email } });

    if (!admin) {
      console.log("❌ Usuario no encontrado en AdminUser:", email);
      return res.status(401).json({ error: "Usuario no encontrado" });
    }

    const ok = await bcrypt.compare(password, admin.password);
    if (!ok) return res.status(401).json({ error: "Contraseña incorrecta" });

    const token = jwt.sign(
      { sub: admin.id, email: admin.email, role: admin.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.TOKEN_EXPIRES_IN || "2h" }
    );

    return res.json({
      token,
      admin: {
        id: admin.id,
        email: admin.email,
        role: admin.role,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ error: "Error iniciando sesión" });
  }
});

export default router;
