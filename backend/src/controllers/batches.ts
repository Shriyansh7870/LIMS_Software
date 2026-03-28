import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { z } from 'zod';
import { subMonths, startOfMonth, endOfMonth, format } from 'date-fns';

const batchSchema = z.object({
  labId: z.string().optional(),
  product: z.string(),
  stage: z.string(),
  quantity: z.number().positive(),
  unit: z.string().default('kg'),
  yield: z.number().optional(),
  yieldPct: z.number().optional(),
  qcResult: z.string().optional(),
  ownerName: z.string(),
  ownerId: z.string().optional(),
  notes: z.string().optional(),
  qcValues: z.any().optional(),
  releaseDate: z.string().optional(),
});

export async function getBatches(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { status, product, search, page = '1', limit = '20' } = req.query;
    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (product) where.product = { contains: product as string, mode: 'insensitive' };
    if (search) {
      where.OR = [
        { batchNo: { contains: search as string, mode: 'insensitive' } },
        { product: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const [batches, total] = await Promise.all([
      prisma.batchRecord.findMany({
        where,
        include: {
          lab: { select: { id: true, name: true } },
          owner: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit as string),
      }),
      prisma.batchRecord.count({ where }),
    ]);

    res.json({ success: true, data: batches, meta: { total, page: parseInt(page as string), limit: parseInt(limit as string) } });
  } catch (err) {
    next(err);
  }
}

export async function getBatchById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const batch = await prisma.batchRecord.findUnique({
      where: { id: req.params.id },
      include: {
        lab: true,
        owner: { select: { id: true, name: true } },
        workflowRuns: { include: { workflow: true, steps: true } },
      },
    });
    if (!batch) { res.status(404).json({ success: false, error: 'Batch record not found' }); return; }
    res.json({ success: true, data: batch });
  } catch (err) {
    next(err);
  }
}

export async function createBatch(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = batchSchema.parse(req.body);
    const count = await prisma.batchRecord.count();
    const batchNo = `BT-${String(count + 1).padStart(5, '0')}`;
    const batch = await prisma.batchRecord.create({
      data: {
        ...data,
        batchNo,
        releaseDate: data.releaseDate ? new Date(data.releaseDate) : undefined,
      },
    });
    res.status(201).json({ success: true, data: batch });
  } catch (err) {
    next(err);
  }
}

export async function updateBatch(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = batchSchema.partial().parse(req.body);
    const batch = await prisma.batchRecord.update({
      where: { id: req.params.id },
      data: { ...data, releaseDate: data.releaseDate ? new Date(data.releaseDate) : undefined },
    });
    res.json({ success: true, data: batch });
  } catch (err) {
    next(err);
  }
}

export async function getMonthlyOutput(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const now = new Date();
    const months = [];

    for (let i = 11; i >= 0; i--) {
      const d = subMonths(now, i);
      const start = startOfMonth(d);
      const end = endOfMonth(d);

      const [released, onHold, rejected] = await Promise.all([
        prisma.batchRecord.count({ where: { releaseDate: { gte: start, lte: end }, status: 'released' } }),
        prisma.batchRecord.count({ where: { createdAt: { gte: start, lte: end }, status: 'qc_hold' } }),
        prisma.batchRecord.count({ where: { updatedAt: { gte: start, lte: end }, status: 'rejected' } }),
      ]);

      months.push({ label: format(d, 'MMM yy'), month: d.getMonth() + 1, year: d.getFullYear(), released, onHold, rejected });
    }

    res.json({ success: true, data: months });
  } catch (err) {
    next(err);
  }
}

export async function getYieldTrend(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const now = new Date();
    const months = [];

    for (let i = 11; i >= 0; i--) {
      const d = subMonths(now, i);
      const start = startOfMonth(d);
      const end = endOfMonth(d);

      const agg = await prisma.batchRecord.aggregate({
        where: { createdAt: { gte: start, lte: end }, yieldPct: { not: null } },
        _avg: { yieldPct: true },
        _count: { id: true },
      });

      months.push({
        label: format(d, 'MMM yy'),
        avgYield: agg._avg.yieldPct ? Math.round(agg._avg.yieldPct * 10) / 10 : null,
        batchCount: agg._count.id,
      });
    }

    res.json({ success: true, data: months });
  } catch (err) {
    next(err);
  }
}
