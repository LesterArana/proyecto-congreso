// server/src/controllers/auth.controller.js
import { PrismaClient } from "@prisma/client";

import bcrypt from "bcryptjs";


import jwt from "jsonwebtoken";

const prisma = new PrismaClient();

function signToken(payload) {
  const secret = process.env.JWT_SECRET || "change_me";
  const expiresIn = process.env.TOKEN_EXPIRES_IN || "2h";
  return jwt.sign(payload, secret, { expiresIn });
}

export async function login(req, res) {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: "Email y password son requeridos." });
    }

    const user = await prisma.user.findUnique({
      where: { email: String(email).toLowerCase() },
      select: { id: true, name: true, email: true, role: true, passwordHash: true },
    });

    if (!user || !user.passwordHash) {
      return res.status(401).json({ error: "Credenciales inválidas." });
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return res.status(401).json({ error: "Credenciales inválidas." });
    }

    // Si quieres limitar solo a ADMIN para el panel:
    // if (user.role !== "ADMIN") return res.status(403).json({ error: "No autorizado." });

    const token = signToken({ uid: user.id, role: user.role });
    return res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    console.error("login error:", err);
    return res.status(500).json({ error: "Error iniciando sesión." });
  }
}

export async function me(req, res) {
  try {
    // requireAuth ya setea req.user
    const user = await prisma.user.findUnique({
      where: { id: req.user?.uid },
      select: { id: true, name: true, email: true, role: true },
    });
    if (!user) return res.status(404).json({ error: "Usuario no encontrado." });
    return res.json({ user });
  } catch (err) {
    console.error("me error:", err);
    return res.status(500).json({ error: "Error obteniendo perfil." });
  }
}

export async function logout(_req, res) {
  // Si manejas el token en localStorage/cookie del cliente, aquí basta con responder OK.
  return res.json({ ok: true });
}
