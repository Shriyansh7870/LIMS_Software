import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { z } from 'zod';

const integrationSchema = z.object({
  name: z.string(),
  type: z.string(),
  description: z.string().optional(),
  dataFlow: z.enum(['Inbound', 'Outbound', 'Bidirectional']),
  status: z.enum(['connected', 'in_progress', 'planned', 'disconnected', 'error']).default('planned'),
});

export async function getIntegrations(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const integrations = await prisma.integration.findMany({ orderBy: { status: 'asc' } });
    const stats = {
      connected: integrations.filter((i) => i.status === 'connected').length,
      inProgress: integrations.filter((i) => i.status === 'in_progress').length,
      planned: integrations.filter((i) => i.status === 'planned').length,
      total: integrations.length,
    };
    res.json({ success: true, data: integrations, stats });
  } catch (err) {
    next(err);
  }
}

export async function createIntegration(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = integrationSchema.parse(req.body);
    const integration = await prisma.integration.create({ data });
    res.status(201).json({ success: true, data: integration });
  } catch (err) {
    next(err);
  }
}

export async function updateIntegration(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = integrationSchema.partial().parse(req.body);
    const integration = await prisma.integration.update({
      where: { id: req.params.id },
      data: { ...data, connectedAt: data.status === 'connected' ? new Date() : undefined },
    });
    res.json({ success: true, data: integration });
  } catch (err) {
    next(err);
  }
}
