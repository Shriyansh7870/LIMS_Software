import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { logger } from '../utils/logger';

export function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction): void {
  logger.error(err.message, { stack: err.stack, path: req.path, method: req.method });

  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      error: 'Validation error',
      code: 'VALIDATION_ERROR',
      details: err.errors.map((e) => ({ field: e.path.join('.'), message: e.message })),
    });
    return;
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      res.status(409).json({ success: false, error: 'Duplicate entry — record already exists', code: 'CONFLICT' });
      return;
    }
    if (err.code === 'P2025') {
      res.status(404).json({ success: false, error: 'Record not found', code: 'NOT_FOUND' });
      return;
    }
    if (err.code === 'P2003') {
      res.status(400).json({ success: false, error: 'Foreign key constraint failed', code: 'FK_ERROR' });
      return;
    }
  }

  res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
    code: 'INTERNAL_ERROR',
  });
}

export function notFound(req: Request, res: Response): void {
  res.status(404).json({ success: false, error: `Route ${req.method} ${req.path} not found`, code: 'NOT_FOUND' });
}
