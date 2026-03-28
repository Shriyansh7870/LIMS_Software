import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { z } from 'zod';
import { subMonths, format, startOfMonth, endOfMonth } from 'date-fns';

export async function getPartners(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { search, city, riskLevel } = req.query;
    const where: Record<string, unknown> = { type: 'partner' };
    if (city) where.city = { contains: city as string, mode: 'insensitive' };
    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { city: { contains: search as string, mode: 'insensitive' } },
      ];
    }
    if (riskLevel === 'high') where.riskScore = { gte: 70 };
    else if (riskLevel === 'medium') where.riskScore = { gte: 40, lt: 70 };
    else if (riskLevel === 'low') where.riskScore = { lt: 40 };

    const labs = await prisma.lab.findMany({
      where,
      include: {
        certifications: { select: { name: true, status: true, expiryDate: true } },
        equipment: { select: { type: true, capabilities: true } },
        partners: true,
        audits: { orderBy: { scheduledDate: 'desc' }, take: 1 },
      },
      orderBy: { name: 'asc' },
    });

    res.json({ success: true, data: labs });
  } catch (err) {
    next(err);
  }
}

export async function getPartnerById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const lab = await prisma.lab.findUnique({
      where: { id: req.params.id },
      include: {
        certifications: true,
        equipment: true,
        partners: true,
        audits: { orderBy: { scheduledDate: 'desc' }, take: 5 },
        ratingHistory: { orderBy: [{ year: 'asc' }, { month: 'asc' }], take: 12 },
      },
    });
    if (!lab) { res.status(404).json({ success: false, error: 'Partner not found' }); return; }
    res.json({ success: true, data: lab });
  } catch (err) {
    next(err);
  }
}

export async function createPartner(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const schema = z.object({
      name: z.string(),
      city: z.string(),
      state: z.string(),
      capacity: z.number().int().positive(),
      contactName: z.string().optional(),
      contactEmail: z.string().email().optional(),
      contactPhone: z.string().optional(),
      lat: z.number().optional(),
      lng: z.number().optional(),
      specialization: z.array(z.string()).default([]),
      notes: z.string().optional(),
    });
    const data = schema.parse(req.body);
    const count = await prisma.lab.count();
    const labCode = `LAB-${String(count + 1).padStart(4, '0')}`;
    const lab = await prisma.lab.create({
      data: { ...data, labCode, type: 'partner' },
    });
    res.status(201).json({ success: true, data: lab });
  } catch (err) {
    next(err);
  }
}

export async function updatePartner(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const lab = await prisma.lab.update({ where: { id: req.params.id }, data: req.body });
    res.json({ success: true, data: lab });
  } catch (err) {
    next(err);
  }
}

export async function findPartners(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { capability, city, minCapacity, certType } = req.query;

    const labs = await prisma.lab.findMany({
      where: {
        type: 'partner',
        status: 'active',
        ...(city ? { city: { contains: city as string, mode: 'insensitive' } } : {}),
        ...(minCapacity ? { capacity: { gte: parseInt(minCapacity as string) } } : {}),
      },
      include: {
        equipment: { select: { type: true, capabilities: true } },
        certifications: { select: { certType: true, status: true, name: true } },
      },
    });

    // Score labs based on match criteria
    const scored = labs.map((lab) => {
      let score = 0;
      const maxScore = 4;

      if (capability) {
        const hasCapability = lab.equipment.some((e) =>
          e.capabilities.some((c) => c.toLowerCase().includes((capability as string).toLowerCase()))
        );
        if (hasCapability) score += 2;
      } else {
        score += 2;
      }

      if (certType) {
        const hasCert = lab.certifications.some(
          (c) => c.certType?.toLowerCase().includes((certType as string).toLowerCase()) && c.status === 'valid'
        );
        if (hasCert) score += 1;
      } else {
        score += 1;
      }

      if (lab.auditScore >= 80) score += 1;

      return { ...lab, matchScore: Math.round((score / maxScore) * 100) };
    });

    scored.sort((a, b) => b.matchScore - a.matchScore);
    res.json({ success: true, data: scored });
  } catch (err) {
    next(err);
  }
}

export async function getPartnerScorecard(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const labId = req.params.id;
    const now = new Date();
    const months = [];

    for (let i = 11; i >= 0; i--) {
      const d = subMonths(now, i);
      const start = startOfMonth(d);
      const end = endOfMonth(d);

      const [capaCount, avgAuditScore, history] = await Promise.all([
        prisma.capa.count({ where: { labId, createdAt: { gte: start, lte: end } } }),
        prisma.audit.aggregate({ where: { labId, completedDate: { gte: start, lte: end } }, _avg: { score: true } }),
        prisma.labRatingHistory.findFirst({ where: { labId, month: d.getMonth() + 1, year: d.getFullYear() } }),
      ]);

      months.push({
        label: format(d, 'MMM yy'),
        month: d.getMonth() + 1,
        year: d.getFullYear(),
        capaCount,
        auditScore: avgAuditScore._avg.score ?? history?.auditScore ?? 0,
        rating: history?.rating ?? 0,
        riskScore: history?.riskScore ?? 0,
      });
    }

    res.json({ success: true, data: months });
  } catch (err) {
    next(err);
  }
}
