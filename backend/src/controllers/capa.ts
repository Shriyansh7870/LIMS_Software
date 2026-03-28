import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { z } from 'zod';
import { subMonths, startOfMonth, endOfMonth, format, addDays } from 'date-fns';
import { AuthRequest } from '../middleware/auth';

const capaSchema = z.object({
  labId: z.string().optional(),
  title: z.string().min(5),
  source: z.string(),
  product: z.string().optional(),
  batchNo: z.string().optional(),
  department: z.string().optional(),
  severity: z.enum(['critical', 'major', 'minor', 'observation']),
  description: z.string().min(10),
  rootCause: z.string().optional(),
  actionPlan: z.string().optional(),
  ownerId: z.string().optional(),
  dueDate: z.string(),
});

export async function getCapas(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { status, severity, department, search, page = '1', limit = '20' } = req.query;
    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (severity) where.severity = severity;
    if (department) where.department = { contains: department as string, mode: 'insensitive' };
    if (search) {
      where.OR = [
        { capaCode: { contains: search as string, mode: 'insensitive' } },
        { title: { contains: search as string, mode: 'insensitive' } },
        { product: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const [capas, total] = await Promise.all([
      prisma.capa.findMany({
        where,
        include: {
          lab: { select: { id: true, name: true } },
          owner: { select: { id: true, name: true } },
          createdBy: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit as string),
      }),
      prisma.capa.count({ where }),
    ]);

    const now = new Date();
    const data = capas.map((c) => ({
      ...c,
      daysOverdue: c.status !== 'closed' && c.dueDate < now
        ? Math.ceil((now.getTime() - c.dueDate.getTime()) / 86400000)
        : 0,
    }));

    res.json({ success: true, data, meta: { total, page: parseInt(page as string), limit: parseInt(limit as string) } });
  } catch (err) {
    next(err);
  }
}

export async function getCapaById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const capa = await prisma.capa.findUnique({
      where: { id: req.params.id },
      include: {
        lab: true,
        owner: { select: { id: true, name: true, email: true } },
        createdBy: { select: { id: true, name: true } },
        workflowRuns: {
          include: { workflow: true, steps: { include: { assignee: { select: { name: true } } } } },
        },
      },
    });
    if (!capa) { res.status(404).json({ success: false, error: 'CAPA not found' }); return; }
    res.json({ success: true, data: capa });
  } catch (err) {
    next(err);
  }
}

export async function createCapa(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = capaSchema.parse(req.body);
    const count = await prisma.capa.count();
    const capaCode = `CAPA-${String(count + 1).padStart(4, '0')}`;

    const capa = await prisma.capa.create({
      data: {
        ...data,
        capaCode,
        createdById: req.user!.id,
        dueDate: new Date(data.dueDate),
      },
    });

    // Auto-trigger WF-001 (CAPA workflow)
    const workflow = await prisma.workflow.findFirst({ where: { code: 'WF-001', isActive: true } });
    if (workflow) {
      const wfSteps = workflow.steps as Array<{ name: string }>;
      const run = await prisma.workflowRun.create({
        data: {
          workflowId: workflow.id,
          triggeredBy: req.user!.id,
          capaId: capa.id,
          status: 'active',
          steps: {
            create: wfSteps.map((s, idx) => ({
              stepNumber: idx + 1,
              name: s.name,
              status: idx === 0 ? 'in_progress' : 'pending',
            })),
          },
        },
      });

      // Notify owner if assigned
      if (capa.ownerId) {
        await prisma.notification.create({
          data: {
            userId: capa.ownerId,
            type: 'workflow_update',
            title: `CAPA ${capaCode} assigned to you`,
            message: `New CAPA created: ${capa.title}. Due: ${new Date(data.dueDate).toLocaleDateString()}`,
            metadata: { capaId: capa.id, workflowRunId: run.id },
          },
        });
      }
    }

    res.status(201).json({ success: true, data: capa });
  } catch (err) {
    next(err);
  }
}

export async function updateCapa(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = capaSchema.partial().parse(req.body);
    const capa = await prisma.capa.update({
      where: { id: req.params.id },
      data: {
        ...data,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
        closedAt: data.status === 'closed' ? new Date() : undefined,
      },
    });
    res.json({ success: true, data: capa });
  } catch (err) {
    next(err);
  }
}

export async function getMonthlyTrend(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const now = new Date();
    const months = [];

    for (let i = 11; i >= 0; i--) {
      const d = subMonths(now, i);
      const start = startOfMonth(d);
      const end = endOfMonth(d);

      const [open, closed, overdue] = await Promise.all([
        prisma.capa.count({ where: { createdAt: { lte: end }, status: { notIn: ['closed'] }, dueDate: { gt: end } } }),
        prisma.capa.count({ where: { closedAt: { gte: start, lte: end } } }),
        prisma.capa.count({ where: { dueDate: { lte: end }, status: { notIn: ['closed', 'pending_verification'] } } }),
      ]);

      months.push({ label: format(d, 'MMM yy'), month: d.getMonth() + 1, year: d.getFullYear(), open, closed, overdue });
    }

    res.json({ success: true, data: months });
  } catch (err) {
    next(err);
  }
}

export async function getBySeverity(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const groups = await prisma.capa.groupBy({
      by: ['severity'],
      _count: { id: true },
      where: { status: { not: 'closed' } },
    });
    const colorMap: Record<string, string> = {
      critical: '#DC2626',
      major: '#D97706',
      minor: '#2563EB',
      observation: '#6B7280',
    };
    const data = groups.map((g) => ({
      severity: g.severity,
      count: g._count.id,
      color: colorMap[g.severity] || '#6B7280',
    }));
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}
