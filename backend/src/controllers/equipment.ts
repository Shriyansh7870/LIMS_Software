import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { z } from 'zod';
import { subMonths, format } from 'date-fns';

const equipmentSchema = z.object({
  labId: z.string(),
  name: z.string().min(2),
  type: z.string(),
  manufacturer: z.string().optional(),
  model: z.string().optional(),
  serialNumber: z.string().optional(),
  calibrationDue: z.string().optional(),
  capabilities: z.array(z.string()).default([]),
  notes: z.string().optional(),
});

export async function getEquipment(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { type, labId, search } = req.query;
    const where: Record<string, unknown> = {};
    if (type) where.type = { contains: type as string, mode: 'insensitive' };
    if (labId) where.labId = labId;
    if (search) where.name = { contains: search as string, mode: 'insensitive' };

    const equipment = await prisma.equipment.findMany({
      where,
      include: { lab: { select: { id: true, name: true, city: true } } },
      orderBy: { name: 'asc' },
    });
    res.json({ success: true, data: equipment });
  } catch (err) {
    next(err);
  }
}

export async function getEquipmentById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const eq = await prisma.equipment.findUnique({
      where: { id: req.params.id },
      include: {
        lab: { select: { id: true, name: true, city: true } },
        utilisationRecords: { orderBy: [{ year: 'desc' }, { quarter: 'desc' }], take: 8 },
      },
    });
    if (!eq) { res.status(404).json({ success: false, error: 'Equipment not found' }); return; }
    res.json({ success: true, data: eq });
  } catch (err) {
    next(err);
  }
}

export async function createEquipment(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = equipmentSchema.parse(req.body);
    const count = await prisma.equipment.count();
    const equipCode = `EQ-${String(count + 1).padStart(4, '0')}`;
    const eq = await prisma.equipment.create({
      data: {
        ...data,
        equipCode,
        calibrationDue: data.calibrationDue ? new Date(data.calibrationDue) : undefined,
      },
    });
    res.status(201).json({ success: true, data: eq });
  } catch (err) {
    next(err);
  }
}

export async function updateEquipment(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = equipmentSchema.partial().parse(req.body);
    const eq = await prisma.equipment.update({
      where: { id: req.params.id },
      data: {
        ...data,
        calibrationDue: data.calibrationDue ? new Date(data.calibrationDue) : undefined,
      },
    });
    res.json({ success: true, data: eq });
  } catch (err) {
    next(err);
  }
}

export async function getMatrix(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const labs = await prisma.lab.findMany({
      where: { status: 'active' },
      select: { id: true, name: true, city: true },
      orderBy: { name: 'asc' },
    });

    const allEquipment = await prisma.equipment.findMany({
      select: { labId: true, type: true, capabilities: true },
    });

    const allTypes = [...new Set(allEquipment.map((e) => e.type))].sort();

    const matrix = labs.map((lab) => {
      const labEquipment = allEquipment.filter((e) => e.labId === lab.id);
      const typeMap: Record<string, boolean> = {};
      allTypes.forEach((t) => {
        typeMap[t] = labEquipment.some((e) => e.type === t);
      });
      return { lab, types: typeMap };
    });

    res.json({ success: true, data: { labs, types: allTypes, matrix } });
  } catch (err) {
    next(err);
  }
}

export async function getUtilisation(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const records = await prisma.equipmentUtilisation.findMany({
      include: { equipment: { select: { name: true, type: true } } },
      orderBy: [{ year: 'asc' }, { quarter: 'asc' }],
    });

    // Group by equipment type and quarter
    const grouped: Record<string, Record<string, number>> = {};
    records.forEach((r) => {
      const key = `Q${r.quarter} ${r.year}`;
      if (!grouped[r.equipment.type]) grouped[r.equipment.type] = {};
      grouped[r.equipment.type][key] = r.utilisationPct;
    });

    res.json({ success: true, data: grouped });
  } catch (err) {
    next(err);
  }
}
