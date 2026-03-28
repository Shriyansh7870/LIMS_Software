import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { AuthRequest } from '../middleware/auth';

export async function getWorkflows(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const workflows = await prisma.workflow.findMany({
      include: { _count: { select: { runs: true } } },
      orderBy: { code: 'asc' },
    });
    res.json({ success: true, data: workflows });
  } catch (err) {
    next(err);
  }
}

export async function getWorkflowById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const wf = await prisma.workflow.findUnique({
      where: { id: req.params.id },
      include: {
        runs: {
          where: { status: 'active' },
          include: { steps: true },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });
    if (!wf) { res.status(404).json({ success: false, error: 'Workflow not found' }); return; }
    res.json({ success: true, data: wf });
  } catch (err) {
    next(err);
  }
}

export async function startRun(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const workflow = await prisma.workflow.findUnique({ where: { id: req.params.id } });
    if (!workflow) { res.status(404).json({ success: false, error: 'Workflow not found' }); return; }

    const wfSteps = workflow.steps as Array<{ name: string }>;
    const run = await prisma.workflowRun.create({
      data: {
        workflowId: workflow.id,
        triggeredBy: req.user!.id,
        status: 'active',
        steps: {
          create: wfSteps.map((s, idx) => ({
            stepNumber: idx + 1,
            name: s.name,
            status: idx === 0 ? 'in_progress' : 'pending',
          })),
        },
      },
      include: { steps: true },
    });

    res.status(201).json({ success: true, data: run });
  } catch (err) {
    next(err);
  }
}

export async function getActiveRuns(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { status = 'active' } = req.query;
    const runs = await prisma.workflowRun.findMany({
      where: { status: status as string },
      include: {
        workflow: { select: { name: true, code: true, type: true } },
        steps: { include: { assignee: { select: { name: true } } } },
        capa: { select: { capaCode: true, title: true } },
        batch: { select: { batchNo: true, product: true } },
        request: { select: { requestCode: true, testType: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: runs });
  } catch (err) {
    next(err);
  }
}

export async function getRunById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const run = await prisma.workflowRun.findUnique({
      where: { id: req.params.id },
      include: {
        workflow: true,
        steps: { include: { assignee: { select: { id: true, name: true } } }, orderBy: { stepNumber: 'asc' } },
      },
    });
    if (!run) { res.status(404).json({ success: false, error: 'Workflow run not found' }); return; }
    res.json({ success: true, data: run });
  } catch (err) {
    next(err);
  }
}

export async function advanceStep(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id: runId, stepId } = req.params;
    const { action, notes } = req.body; // action: 'approve' | 'reject'

    const status = action === 'approve' ? 'completed' : 'rejected';
    const step = await prisma.workflowStep.update({
      where: { id: stepId },
      data: { status, notes, completedAt: new Date() },
    });

    if (action === 'approve') {
      // Advance to next step
      const run = await prisma.workflowRun.findUnique({
        where: { id: runId },
        include: { steps: { orderBy: { stepNumber: 'asc' } } },
      });

      if (run) {
        const nextStep = run.steps.find((s) => s.status === 'pending');
        if (nextStep) {
          await prisma.workflowStep.update({ where: { id: nextStep.id }, data: { status: 'in_progress' } });
          await prisma.workflowRun.update({ where: { id: runId }, data: { currentStep: nextStep.stepNumber } });
        } else {
          // All steps done — complete the run
          await prisma.workflowRun.update({ where: { id: runId }, data: { status: 'completed', completedAt: new Date() } });
        }
      }
    } else {
      await prisma.workflowRun.update({ where: { id: runId }, data: { status: 'rejected' } });
    }

    res.json({ success: true, data: step });
  } catch (err) {
    next(err);
  }
}
