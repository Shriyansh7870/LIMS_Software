import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { z } from 'zod';

const labSchema = z.object({
  name: z.string().min(2),
  type: z.enum(['internal', 'partner', 'contract']),
  city: z.string(),
  state: z.string(),
  capacity: z.number().int().positive(),
  contactName: z.string().optional(),
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
});

export async function getLabs(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { type, status, city, search, page = '1', limit = '20' } = req.query;
    const where: Record<string, unknown> = {};
    if (type) where.type = type;
    if (status) where.status = status;
    if (city) where.city = { contains: city as string, mode: 'insensitive' };
    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { city: { contains: search as string, mode: 'insensitive' } },
        { labCode: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const [labs, total] = await Promise.all([
      prisma.lab.findMany({
        where,
        include: {
          certifications: { select: { status: true } },
          equipment: { select: { id: true, type: true } },
          _count: { select: { capass: true, audits: true } },
        },
        orderBy: { name: 'asc' },
        skip,
        take: parseInt(limit as string),
      }),
      prisma.lab.count({ where }),
    ]);

    res.json({
      success: true,
      data: labs,
      meta: { total, page: parseInt(page as string), limit: parseInt(limit as string), pages: Math.ceil(total / parseInt(limit as string)) },
    });
  } catch (err) {
    next(err);
  }
}

export async function getLabById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const lab = await prisma.lab.findUnique({
      where: { id: req.params.id },
      include: {
        equipment: { orderBy: { name: 'asc' } },
        certifications: { orderBy: { expiryDate: 'asc' } },
        ratingHistory: { orderBy: [{ year: 'asc' }, { month: 'asc' }], take: 12 },
        partners: true,
        audits: { orderBy: { scheduledDate: 'desc' }, take: 5, include: { lab: { select: { name: true } } } },
        _count: { select: { capass: true, testRequests: true } },
      },
    });

    if (!lab) {
      res.status(404).json({ success: false, error: 'Lab not found' });
      return;
    }
    res.json({ success: true, data: lab });
  } catch (err) {
    next(err);
  }
}

export async function createLab(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = labSchema.parse(req.body);
    const count = await prisma.lab.count();
    const labCode = `LAB-${String(count + 1).padStart(4, '0')}`;
    const lab = await prisma.lab.create({ data: { ...data, labCode } });
    res.status(201).json({ success: true, data: lab });
  } catch (err) {
    next(err);
  }
}

export async function updateLab(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = labSchema.partial().parse(req.body);
    const lab = await prisma.lab.update({ where: { id: req.params.id }, data });
    res.json({ success: true, data: lab });
  } catch (err) {
    next(err);
  }
}

export async function deleteLab(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await prisma.lab.update({ where: { id: req.params.id }, data: { status: 'inactive' } });
    res.json({ success: true, message: 'Lab deactivated successfully' });
  } catch (err) {
    next(err);
  }
}

export async function getLabHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const history = await prisma.labRatingHistory.findMany({
      where: { labId: req.params.id },
      orderBy: [{ year: 'asc' }, { month: 'asc' }],
    });
    res.json({ success: true, data: history });
  } catch (err) {
    next(err);
  }
}
