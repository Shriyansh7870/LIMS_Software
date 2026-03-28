import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { z } from 'zod';
import { addDays } from 'date-fns';

const sopSchema = z.object({
  title: z.string().min(3),
  department: z.string(),
  category: z.string().optional(),
  effectiveDate: z.string().optional(),
  reviewDate: z.string().optional(),
  ownerName: z.string(),
  ownerId: z.string().optional(),
  description: z.string().optional(),
  content: z.string().optional(),
  documentUrl: z.string().optional(),
});

export async function getSops(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { department, status, search, page = '1', limit = '20' } = req.query;
    const where: Record<string, unknown> = {};
    if (department) where.department = { contains: department as string, mode: 'insensitive' };
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { title: { contains: search as string, mode: 'insensitive' } },
        { sopCode: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const [sops, total] = await Promise.all([
      prisma.sop.findMany({
        where,
        include: {
          owner: { select: { id: true, name: true } },
          versions: { orderBy: { createdAt: 'desc' }, take: 3 },
        },
        orderBy: { updatedAt: 'desc' },
        skip,
        take: parseInt(limit as string),
      }),
      prisma.sop.count({ where }),
    ]);

    const now = new Date();
    const data = sops.map((s) => ({
      ...s,
      isDueForReview: s.reviewDate && s.reviewDate <= addDays(now, 90),
    }));

    res.json({ success: true, data, meta: { total, page: parseInt(page as string), limit: parseInt(limit as string) } });
  } catch (err) {
    next(err);
  }
}

export async function getSopById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const sop = await prisma.sop.findUnique({
      where: { id: req.params.id },
      include: { owner: true, versions: { orderBy: { createdAt: 'desc' } } },
    });
    if (!sop) { res.status(404).json({ success: false, error: 'SOP not found' }); return; }
    res.json({ success: true, data: sop });
  } catch (err) {
    next(err);
  }
}

export async function createSop(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = sopSchema.parse(req.body);
    const count = await prisma.sop.count();
    const sopCode = `SOP-${String(count + 1).padStart(4, '0')}`;
    const sop = await prisma.sop.create({
      data: {
        ...data,
        sopCode,
        effectiveDate: data.effectiveDate ? new Date(data.effectiveDate) : undefined,
        reviewDate: data.reviewDate ? new Date(data.reviewDate) : undefined,
      },
    });
    res.status(201).json({ success: true, data: sop });
  } catch (err) {
    next(err);
  }
}

export async function updateSop(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = sopSchema.partial().parse(req.body);
    const sop = await prisma.sop.update({
      where: { id: req.params.id },
      data: {
        ...data,
        effectiveDate: data.effectiveDate ? new Date(data.effectiveDate) : undefined,
        reviewDate: data.reviewDate ? new Date(data.reviewDate) : undefined,
      },
    });
    res.json({ success: true, data: sop });
  } catch (err) {
    next(err);
  }
}

export async function addVersion(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { version, changes, documentUrl } = req.body;
    const sopVersion = await prisma.sopVersion.create({
      data: { sopId: req.params.id, version, changes, documentUrl, createdBy: req.body.createdBy },
    });
    // Update the sop version number
    await prisma.sop.update({ where: { id: req.params.id }, data: { version, updatedAt: new Date() } });
    res.status(201).json({ success: true, data: sopVersion });
  } catch (err) {
    next(err);
  }
}

export async function getDueForReview(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const threshold = addDays(new Date(), 90);
    const sops = await prisma.sop.findMany({
      where: { reviewDate: { lte: threshold }, status: { not: 'obsolete' } },
      include: { owner: { select: { name: true } } },
      orderBy: { reviewDate: 'asc' },
    });
    res.json({ success: true, data: sops });
  } catch (err) {
    next(err);
  }
}
