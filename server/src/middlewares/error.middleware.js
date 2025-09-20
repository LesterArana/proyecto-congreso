// server/src/middlewares/error.middleware.js
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';

export function errorHandler(err, req, res, next) {
  // Validación de entrada (zod)
  if (err instanceof ZodError) {
    return res.status(400).json({ message: 'Validation error', issues: err.issues });
  }

  // Errores conocidos de Prisma
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      return res.status(409).json({ message: 'Duplicate value', target: err.meta?.target });
    }
    if (err.code === 'P2003') {
      return res.status(400).json({ message: 'Invalid relation (foreign key)', field: err.meta?.field_name });
    }
  }

  console.error('Unhandled error:', err);
  res.status(500).json({ message: 'Internal server error' });
}
