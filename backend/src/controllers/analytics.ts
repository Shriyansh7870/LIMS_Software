import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { subMonths, startOfMonth, endOfMonth, format } from 'date-fns';
import { getCache, setCache } from '../config/redis';

export async function getPartnerPerformance(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const cached = await getCache('analytics:partner-performance');
    if (cached) { res.json({ success: true, data: cached, cached: true }); return; }

    const partners = await prisma.lab.findMany({
      where: { type: 'partner', status: 'active' },
      include: {
        certifications: { select: { status: true } },
        audits: { orderBy: { scheduledDate: 'desc' }, take: 1 },
        _count: { select: { capass: true, testRequests: true } },
      },
    });

    const data = partners.map((p) => ({
      id: p.id,
      name: p.name,
      city: p.city,
      rating: p.rating,
      auditScore: p.auditScore,
      riskScore: p.riskScore,
      activeCerts: p.certifications.filter((c) => c.status === 'valid').length,
      totalCerts: p.certifications.length,
      capaCount: p._count.capass,
      testRequestCount: p._count.testRequests,
      lastAuditDate: p.audits[0]?.scheduledDate || null,
    }));

    await setCache('analytics:partner-performance', data, 300);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function getQualityScoreTrend(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const now = new Date();
    const months = [];

    for (let i = 11; i >= 0; i--) {
      const d = subMonths(now, i);
      const start = startOfMonth(d);
      const end = endOfMonth(d);

      const snap = await prisma.analyticsSnapshot.findFirst({
        where: { month: d.getMonth() + 1, year: d.getFullYear() },
      });

      const auditAvg = await prisma.audit.aggregate({
        where: { completedDate: { gte: start, lte: end }, score: { not: null } },
        _avg: { score: true },
      });

      months.push({
        label: format(d, 'MMM yy'),
        qualityScore: snap?.qualityScore ?? auditAvg._avg.score ?? null,
      });
    }

    res.json({ success: true, data: months });
  } catch (err) {
    next(err);
  }
}

export async function getCapaResolutionTime(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const now = new Date();
    const months = [];

    for (let i = 11; i >= 0; i--) {
      const d = subMonths(now, i);
      const start = startOfMonth(d);
      const end = endOfMonth(d);

      const snap = await prisma.analyticsSnapshot.findFirst({
        where: { month: d.getMonth() + 1, year: d.getFullYear() },
      });

      months.push({
        label: format(d, 'MMM yy'),
        avgDays: snap?.capaResolutionDays ?? null,
      });
    }

    res.json({ success: true, data: months });
  } catch (err) {
    next(err);
  }
}

export async function getCertComplianceRate(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const now = new Date();
    const months = [];

    for (let i = 11; i >= 0; i--) {
      const d = subMonths(now, i);

      const snap = await prisma.analyticsSnapshot.findFirst({
        where: { month: d.getMonth() + 1, year: d.getFullYear() },
      });

      months.push({
        label: format(d, 'MMM yy'),
        complianceRate: snap?.certComplianceRate ?? null,
      });
    }

    res.json({ success: true, data: months });
  } catch (err) {
    next(err);
  }
}
