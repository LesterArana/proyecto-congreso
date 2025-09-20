// prisma/seed.js
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
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

  // Evita duplicados buscando por (title + date)
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

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
