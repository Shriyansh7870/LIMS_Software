import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { z } from 'zod';

const docSchema = z.object({
  title: z.string().min(2),
  type: z.string(),
  department: z.string(),
  version: z.string().default('1.0'),
  ownerName: z.string(),
  ownerId: z.string().optional(),
  tags: z.array(z.string()).default([]),
  fileUrl: z.string().optional(),
  fileSize: z.number().optional(),
  fileFormat: z.string().optional(),
});

export async function getDocuments(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { type, department, status, search, page = '1', limit = '20' } = req.query;
    const where: Record<string, unknown> = {};
    if (type) where.type = type;
    if (department) where.department = { contains: department as string, mode: 'insensitive' };
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { title: { contains: search as string, mode: 'insensitive' } },
        { docCode: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const [docs, total] = await Promise.all([
      prisma.document.findMany({
        where,
        include: { owner: { select: { id: true, name: true } } },
        orderBy: { uploadedAt: 'desc' },
        skip,
        take: parseInt(limit as string),
      }),
      prisma.document.count({ where }),
    ]);

    res.json({ success: true, data: docs, meta: { total, page: parseInt(page as string), limit: parseInt(limit as string) } });
  } catch (err) {
    next(err);
  }
}

export async function getDocumentById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const doc = await prisma.document.findUnique({
      where: { id: req.params.id },
      include: { owner: { select: { id: true, name: true } } },
    });
    if (!doc) { res.status(404).json({ success: false, error: 'Document not found' }); return; }
    res.json({ success: true, data: doc });
  } catch (err) {
    next(err);
  }
}

export async function createDocument(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = docSchema.parse(req.body);
    const count = await prisma.document.count();
    const docCode = `DOC-${String(count + 1).padStart(4, '0')}`;
    const doc = await prisma.document.create({ data: { ...data, docCode } });
    res.status(201).json({ success: true, data: doc });
  } catch (err) {
    next(err);
  }
}

export async function updateDocument(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = docSchema.partial().parse(req.body);
    const doc = await prisma.document.update({ where: { id: req.params.id }, data });
    res.json({ success: true, data: doc });
  } catch (err) {
    next(err);
  }
}

export async function deleteDocument(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await prisma.document.update({ where: { id: req.params.id }, data: { status: 'archived' } });
    res.json({ success: true, message: 'Document archived' });
  } catch (err) {
    next(err);
  }
}

export async function downloadDocument(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const doc = await prisma.document.findUnique({ where: { id: req.params.id } });
    if (!doc || !doc.fileUrl) {
      res.status(404).json({ success: false, error: 'Document or file not found' });
      return;
    }
    // In production: generate pre-signed S3 URL
    // For development: return the stored URL directly
    res.json({ success: true, data: { downloadUrl: doc.fileUrl, expiresIn: 3600 } });
  } catch (err) {
    next(err);
  }
}
