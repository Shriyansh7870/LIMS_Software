import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { z } from 'zod';
import { subMonths, startOfMonth, endOfMonth, format, startOfYear, endOfYear, eachMonthOfInterval } from 'date-fns';

const auditSchema = z.object({
  labId: z.string(),
  type: z.enum(['internal', 'external', 'gmp', 'nabl', 'usfda', 'iso']),
  scheduledDate: z.string(),
  auditorName: z.string(),
  auditorId: z.string().optional(),
  score: z.number().optional(),
  summary: z.string().optional(),
  findings: z.any().optional(),
});

export async function getAudits(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { type, status, labId, search, tab, page = '1', limit = '20' } = req.query;
    const where: Record<string, unknown> = {};
    if (type) where.type = type;
    if (status) where.status = status;
    if (labId) where.labId = labId;
    if (tab === 'upcoming') where.status = 'scheduled';
    if (tab === 'completed') where.status = 'completed';
    if (search) where.auditCode = { contains: search as string, mode: 'insensitive' };

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const [audits, total] = await Promise.all([
      prisma.audit.findMany({
        where,
        include: { lab: { select: { id: true, name: true, city: true } } },
        orderBy: { scheduledDate: 'desc' },
        skip,
        take: parseInt(limit as string),
      }),
      prisma.audit.count({ where }),
    ]);
    res.json({ success: true, data: audits, meta: { total, page: parseInt(page as string), limit: parseInt(limit as string) } });
  } catch (err) {
    next(err);
  }
}

export async function getAuditById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const audit = await prisma.audit.findUnique({
      where: { id: req.params.id },
      include: { lab: true, auditor: { select: { id: true, name: true, email: true } } },
    });
    if (!audit) { res.status(404).json({ success: false, error: 'Audit not found' }); return; }
    res.json({ success: true, data: audit });
  } catch (err) {
    next(err);
  }
}

export async function createAudit(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = auditSchema.parse(req.body);
    const count = await prisma.audit.count();
    const auditCode = `AUD-${String(count + 1).padStart(4, '0')}`;
    const audit = await prisma.audit.create({
      data: { ...data, auditCode, scheduledDate: new Date(data.scheduledDate) },
    });
    res.status(201).json({ success: true, data: audit });
  } catch (err) {
    next(err);
  }
}

export async function updateAudit(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = auditSchema.partial().parse(req.body);
    const audit = await prisma.audit.update({
      where: { id: req.params.id },
      data: {
        ...data,
        scheduledDate: data.scheduledDate ? new Date(data.scheduledDate) : undefined,
        completedDate: data.status === 'completed' ? new Date() : undefined,
      },
    });
    res.json({ success: true, data: audit });
  } catch (err) {
    next(err);
  }
}

export async function getScoreTrend(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const now = new Date();
    const labs = await prisma.lab.findMany({ select: { id: true, name: true }, where: { status: 'active' }, take: 6 });
    const months: Record<string, unknown>[] = [];

    for (let i = 11; i >= 0; i--) {
      const d = subMonths(now, i);
      const start = startOfMonth(d);
      const end = endOfMonth(d);
      const row: Record<string, unknown> = { label: format(d, 'MMM yy') };

      for (const lab of labs) {
        const agg = await prisma.audit.aggregate({
          where: { labId: lab.id, completedDate: { gte: start, lte: end } },
          _avg: { score: true },
        });
        row[lab.name] = agg._avg.score ? Math.round(agg._avg.score) : null;
      }
      months.push(row);
    }

    res.json({ success: true, data: months, labs: labs.map((l) => l.name) });
  } catch (err) {
    next(err);
  }
}

export async function getCalendar(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const year = parseInt((req.query.year as string) || String(new Date().getFullYear()));
    const audits = await prisma.audit.findMany({
      where: {
        scheduledDate: {
          gte: startOfYear(new Date(year, 0, 1)),
          lte: endOfYear(new Date(year, 0, 1)),
        },
      },
      include: { lab: { select: { name: true, city: true } } },
      orderBy: { scheduledDate: 'asc' },
    });

    // Group by month
    const months = eachMonthOfInterval({
      start: startOfYear(new Date(year, 0, 1)),
      end: endOfYear(new Date(year, 0, 1)),
    });

    const calendar = months.map((m) => ({
      month: format(m, 'MMMM'),
      monthNum: m.getMonth() + 1,
      year,
      audits: audits.filter((a) => {
        const d = new Date(a.scheduledDate);
        return d.getMonth() === m.getMonth() && d.getFullYear() === year;
      }),
    }));

    res.json({ success: true, data: calendar });
  } catch (err) {
    next(err);
  }
}
