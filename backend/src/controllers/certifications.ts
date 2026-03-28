import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { z } from 'zod';
import { addMonths, startOfMonth, endOfMonth, format, differenceInDays } from 'date-fns';

const certSchema = z.object({
  labId: z.string(),
  name: z.string(),
  certifyingBody: z.string(),
  certType: z.string(),
  issueDate: z.string(),
  expiryDate: z.string(),
  documentUrl: z.string().optional(),
  renewalNotes: z.string().optional(),
});

function computeDaysLeft(expiryDate: Date): number {
  return differenceInDays(expiryDate, new Date());
}

function computeStatus(expiryDate: Date): string {
  const days = computeDaysLeft(expiryDate);
  if (days < 0) return 'expired';
  if (days <= 30) return 'renewal_due';
  return 'valid';
}

export async function getCertifications(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { status, labId, search, page = '1', limit = '20' } = req.query;
    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (labId) where.labId = labId;
    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { certifyingBody: { contains: search as string, mode: 'insensitive' } },
        { certCode: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const [certs, total] = await Promise.all([
      prisma.certification.findMany({
        where,
        include: { lab: { select: { id: true, name: true, city: true } } },
        orderBy: { expiryDate: 'asc' },
        skip,
        take: parseInt(limit as string),
      }),
      prisma.certification.count({ where }),
    ]);

    const data = certs.map((c) => ({
      ...c,
      daysLeft: computeDaysLeft(c.expiryDate),
      computedStatus: computeStatus(c.expiryDate),
    }));

    res.json({ success: true, data, meta: { total, page: parseInt(page as string), limit: parseInt(limit as string) } });
  } catch (err) {
    next(err);
  }
}

export async function getCertificationById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const cert = await prisma.certification.findUnique({
      where: { id: req.params.id },
      include: { lab: true },
    });
    if (!cert) { res.status(404).json({ success: false, error: 'Certification not found' }); return; }
    res.json({ success: true, data: { ...cert, daysLeft: computeDaysLeft(cert.expiryDate) } });
  } catch (err) {
    next(err);
  }
}

export async function createCertification(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = certSchema.parse(req.body);
    const count = await prisma.certification.count();
    const certCode = `CERT-${String(count + 1).padStart(4, '0')}`;
    const expiryDate = new Date(data.expiryDate);
    const cert = await prisma.certification.create({
      data: {
        ...data,
        certCode,
        issueDate: new Date(data.issueDate),
        expiryDate,
        status: computeStatus(expiryDate) as Parameters<typeof prisma.certification.create>[0]['data']['status'],
      },
    });
    res.status(201).json({ success: true, data: cert });
  } catch (err) {
    next(err);
  }
}

export async function updateCertification(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = certSchema.partial().parse(req.body);
    const expiryDate = data.expiryDate ? new Date(data.expiryDate) : undefined;
    const cert = await prisma.certification.update({
      where: { id: req.params.id },
      data: {
        ...data,
        issueDate: data.issueDate ? new Date(data.issueDate) : undefined,
        expiryDate,
        status: expiryDate ? computeStatus(expiryDate) as Parameters<typeof prisma.certification.update>[0]['data']['status'] : undefined,
      },
    });
    res.json({ success: true, data: cert });
  } catch (err) {
    next(err);
  }
}

export async function getExpiryTimeline(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const now = new Date();
    const result = [];

    for (let i = -6; i <= 12; i++) {
      const d = addMonths(now, i);
      const start = startOfMonth(d);
      const end = endOfMonth(d);
      const count = await prisma.certification.count({
        where: { expiryDate: { gte: start, lte: end } },
      });
      result.push({ label: format(d, 'MMM yy'), month: d.getMonth() + 1, year: d.getFullYear(), count, isPast: i < 0 });
    }

    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

export async function getCertHealthChart(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const [valid, renewalDue, expired] = await Promise.all([
      prisma.certification.count({ where: { status: 'valid' } }),
      prisma.certification.count({ where: { status: 'renewal_due' } }),
      prisma.certification.count({ where: { status: 'expired' } }),
    ]);
    res.json({
      success: true,
      data: [
        { name: 'Valid', value: valid, color: '#16A34A' },
        { name: 'Renewal Due', value: renewalDue, color: '#D97706' },
        { name: 'Expired', value: expired, color: '#DC2626' },
      ],
    });
  } catch (err) {
    next(err);
  }
}
