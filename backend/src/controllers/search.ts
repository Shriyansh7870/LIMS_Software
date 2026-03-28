import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { getCache, setCache } from '../config/redis';

export async function globalSearch(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { q } = req.query;
    if (!q || (q as string).length < 2) {
      res.status(400).json({ success: false, error: 'Query must be at least 2 characters' });
      return;
    }

    const query = q as string;
    const cacheKey = `search:${query.toLowerCase()}`;
    const cached = await getCache(cacheKey);
    if (cached) { res.json({ success: true, data: cached, cached: true }); return; }

    const searchOpts = { contains: query, mode: 'insensitive' as const };

    const [labs, capas, certs, sops, batches, documents, requests] = await Promise.all([
      prisma.lab.findMany({
        where: { OR: [{ name: searchOpts }, { city: searchOpts }, { labCode: searchOpts }] },
        select: { id: true, labCode: true, name: true, city: true, type: true, status: true },
        take: 5,
      }),
      prisma.capa.findMany({
        where: { OR: [{ capaCode: searchOpts }, { title: searchOpts }, { product: searchOpts }] },
        select: { id: true, capaCode: true, title: true, severity: true, status: true },
        take: 5,
      }),
      prisma.certification.findMany({
        where: { OR: [{ certCode: searchOpts }, { name: searchOpts }, { certifyingBody: searchOpts }] },
        select: { id: true, certCode: true, name: true, status: true, expiryDate: true },
        take: 5,
      }),
      prisma.sop.findMany({
        where: { OR: [{ sopCode: searchOpts }, { title: searchOpts }, { department: searchOpts }] },
        select: { id: true, sopCode: true, title: true, status: true, department: true },
        take: 5,
      }),
      prisma.batchRecord.findMany({
        where: { OR: [{ batchNo: searchOpts }, { product: searchOpts }] },
        select: { id: true, batchNo: true, product: true, status: true, yieldPct: true },
        take: 5,
      }),
      prisma.document.findMany({
        where: { OR: [{ docCode: searchOpts }, { title: searchOpts }, { type: searchOpts }] },
        select: { id: true, docCode: true, title: true, type: true, status: true },
        take: 5,
      }),
      prisma.testRequest.findMany({
        where: { OR: [{ requestCode: searchOpts }, { testType: searchOpts }, { product: searchOpts }] },
        select: { id: true, requestCode: true, testType: true, product: true, status: true },
        take: 5,
      }),
    ]);

    const results = {
      labs: labs.map((l) => ({ ...l, type: 'lab', href: `/registry` })),
      capas: capas.map((c) => ({ ...c, entityType: 'capa', href: `/capa` })),
      certifications: certs.map((c) => ({ ...c, entityType: 'certification', href: `/certifications` })),
      sops: sops.map((s) => ({ ...s, entityType: 'sop', href: `/sop` })),
      batches: batches.map((b) => ({ ...b, entityType: 'batch', href: `/bmr` })),
      documents: documents.map((d) => ({ ...d, entityType: 'document', href: `/dms` })),
      requests: requests.map((r) => ({ ...r, entityType: 'request', href: `/requests` })),
    };

    const total = Object.values(results).reduce((acc, arr) => acc + arr.length, 0);
    await setCache(cacheKey, { results, total }, 600);
    res.json({ success: true, data: { results, total } });
  } catch (err) {
    next(err);
  }
}
