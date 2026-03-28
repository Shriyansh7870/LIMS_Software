import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { z } from 'zod';
import { subMonths, startOfMonth, endOfMonth, format } from 'date-fns';
import { AuthRequest } from '../middleware/auth';

const requestSchema = z.object({
  labId: z.string(),
  testType: z.string(),
  product: z.string(),
  batchNo: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  dueDate: z.string().optional(),
  quote: z.number().optional(),
  description: z.string().optional(),
});

export async function getRequests(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { status, priority, labId, search, page = '1', limit = '20' } = req.query;
    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (labId) where.labId = labId;
    if (search) {
      where.OR = [
        { requestCode: { contains: search as string, mode: 'insensitive' } },
        { testType: { contains: search as string, mode: 'insensitive' } },
        { product: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const [requests, total] = await Promise.all([
      prisma.testRequest.findMany({
        where,
        include: {
          lab: { select: { id: true, name: true, city: true } },
          createdBy: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit as string),
      }),
      prisma.testRequest.count({ where }),
    ]);

    res.json({ success: true, data: requests, meta: { total, page: parseInt(page as string), limit: parseInt(limit as string) } });
  } catch (err) {
    next(err);
  }
}

export async function getRequestById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const req_ = await prisma.testRequest.findUnique({
      where: { id: req.params.id },
      include: {
        lab: true,
        createdBy: { select: { id: true, name: true } },
        workflowRuns: { include: { workflow: true, steps: true } },
      },
    });
    if (!req_) { res.status(404).json({ success: false, error: 'Test request not found' }); return; }
    res.json({ success: true, data: req_ });
  } catch (err) {
    next(err);
  }
}

export async function createRequest(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = requestSchema.parse(req.body);
    const count = await prisma.testRequest.count();
    const requestCode = `TR-${String(count + 1).padStart(5, '0')}`;

    const request = await prisma.testRequest.create({
      data: {
        ...data,
        requestCode,
        createdById: req.user!.id,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
      },
    });

    // Auto-trigger WF-005 if quote > 50,000
    if (data.quote && data.quote > 50000) {
      const workflow = await prisma.workflow.findFirst({ where: { code: 'WF-005', isActive: true } });
      if (workflow) {
        const wfSteps = workflow.steps as Array<{ name: string }>;
        await prisma.workflowRun.create({
          data: {
            workflowId: workflow.id,
            triggeredBy: req.user!.id,
            requestId: request.id,
            steps: {
              create: wfSteps.map((s, idx) => ({
                stepNumber: idx + 1,
                name: s.name,
                status: idx === 0 ? 'in_progress' : 'pending',
              })),
            },
          },
        });
      }
    }

    // Create notification
    await prisma.notification.create({
      data: {
        userId: req.user!.id,
        type: 'test_request_submitted',
        title: `Test Request ${requestCode} Created`,
        message: `Test request for ${data.testType} submitted to ${data.labId}`,
        metadata: { requestId: request.id },
      },
    });

    res.status(201).json({ success: true, data: request });
  } catch (err) {
    next(err);
  }
}

export async function updateRequest(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = requestSchema.partial().parse(req.body);
    const request = await prisma.testRequest.update({
      where: { id: req.params.id },
      data: { ...data, dueDate: data.dueDate ? new Date(data.dueDate) : undefined },
    });
    res.json({ success: true, data: request });
  } catch (err) {
    next(err);
  }
}

export async function getMonthlyVolume(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const now = new Date();
    const months = [];

    for (let i = 11; i >= 0; i--) {
      const d = subMonths(now, i);
      const start = startOfMonth(d);
      const end = endOfMonth(d);

      const [count, valueAgg] = await Promise.all([
        prisma.testRequest.count({ where: { createdAt: { gte: start, lte: end } } }),
        prisma.testRequest.aggregate({
          where: { createdAt: { gte: start, lte: end }, quote: { not: null } },
          _sum: { quote: true },
        }),
      ]);

      months.push({
        label: format(d, 'MMM yy'),
        month: d.getMonth() + 1,
        year: d.getFullYear(),
        count,
        value: valueAgg._sum.quote || 0,
      });
    }

    res.json({ success: true, data: months });
  } catch (err) {
    next(err);
  }
}

export async function getByLab(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const groups = await prisma.testRequest.groupBy({
      by: ['labId'],
      _count: { id: true },
      _sum: { quote: true },
    });

    const labIds = groups.map((g) => g.labId);
    const labs = await prisma.lab.findMany({
      where: { id: { in: labIds } },
      select: { id: true, name: true, city: true },
    });

    const data = groups.map((g) => ({
      labId: g.labId,
      lab: labs.find((l) => l.id === g.labId),
      count: g._count.id,
      totalValue: g._sum.quote || 0,
    })).sort((a, b) => b.count - a.count);

    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}
