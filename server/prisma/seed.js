// prisma/seed.js
import { PrismaClient } from '@prisma/client';
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function seedActivities() {
  const activities = [
    {
      kind: 'TALLER',
      title: 'Intro a React',
      description: 'Fundamentos, JSX y hooks básicos.',
      date: new Date('2025-10-01T10:00:00'),
      capacity: 40,
    },
    {
      kind: 'TALLER',
      title: 'APIs con Node/Express',
      description: 'Rutas, middlewares y mejores prácticas.',
      date: new Date('2025-10-01T14:00:00'),
      capacity: 35,
    },
    {
      kind: 'COMPETENCIA',
      title: 'Algoritmos I',
      description: 'Estructuras básicas y complejidad.',
      date: new Date('2025-10-02T09:00:00'),
      capacity: 50,
    },
    {
      kind: 'COMPETENCIA',
      title: 'Algoritmos II',
      description: 'Greedy y Programación Dinámica.',
      date: new Date('2025-10-02T13:00:00'),
      capacity: 50,
    },
  ];

  for (const a of activities) {
    const exists = await prisma.activity.findFirst({
      where: { title: a.title, date: a.date },
    });
    if (!exists) {
      await prisma.activity.create({ data: a });
      console.log(`✅ Creada: ${a.kind} - ${a.title}`);
    } else {
      console.log(`↩️  Ya existía: ${a.kind} - ${a.title}`);
    }
  }
}

async function seedAdmin() {
  const email = (process.env.SEED_ADMIN_EMAIL || 'admin@congreso.com').toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD || 'Admin123';

  const existing = await prisma.adminUser.findUnique({ where: { email } });
  if (existing) {
    console.log(`↩️  Admin ya existe: ${email}`);
    return;
  }

  const hash = await bcrypt.hash(password, 10);
  await prisma.adminUser.create({
    data: {
      email,
      password: hash,
      role: 'ADMIN',
    },
  });

  console.log(`👤 Admin creado: ${email} / ${password}`);
}

async function main() {
  await seedActivities();
  await seedAdmin();
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
