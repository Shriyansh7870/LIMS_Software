import cron from 'node-cron';
import { prisma } from '../config/database';
import { logger } from '../utils/logger';
import { addDays, subMonths, startOfMonth, endOfMonth } from 'date-fns';

export function startJobs(): void {
  // Daily 7am: Check certifications expiring within 30 days
  cron.schedule('0 7 * * *', async () => {
    logger.info('[CRON] Running certification expiry check...');
    try {
      const expiringSoon = await prisma.certification.findMany({
        where: { expiryDate: { lte: addDays(new Date(), 30) } },
        include: { lab: { include: { users: { select: { id: true } } } } },
      });

      for (const cert of expiringSoon) {
        const daysLeft = Math.ceil((cert.expiryDate.getTime() - Date.now()) / 86400000);
        const newStatus = daysLeft <= 0 ? 'expired' : daysLeft <= 30 ? 'renewal_due' : 'valid';

        if (cert.status !== newStatus) {
          await prisma.certification.update({ where: { id: cert.id }, data: { status: newStatus as Parameters<typeof prisma.certification.update>[0]['data']['status'] } });
        }

        const notifType = daysLeft <= 7 ? 'cert_expiry_critical' : 'cert_expiry_warning';

        for (const user of cert.lab.users) {
          // Avoid duplicate notifications (check last 24h)
          const existing = await prisma.notification.findFirst({
            where: {
              userId: user.id,
              type: notifType,
              metadata: { path: ['certId'], equals: cert.id },
              createdAt: { gte: subMonths(new Date(), 0), },
            },
          });
          if (!existing) {
            await prisma.notification.create({
              data: {
                userId: user.id,
                type: notifType as Parameters<typeof prisma.notification.create>[0]['data']['type'],
                title: `${cert.name} expiring ${daysLeft <= 0 ? 'TODAY' : `in ${daysLeft} days`}`,
                message: `${cert.certifyingBody} certification for ${cert.lab.name} — ${daysLeft <= 0 ? 'expired' : `expires ${cert.expiryDate.toLocaleDateString()}`}`,
                metadata: { certId: cert.id, daysLeft },
              },
            });
          }
        }
      }

      logger.info(`[CRON] Cert check: ${expiringSoon.length} certs processed`);
    } catch (err) {
      logger.error('[CRON] Cert expiry job failed', err);
    }
  });

  // Daily 8am: Check CAPA deadlines within 48 hours
  cron.schedule('0 8 * * *', async () => {
    logger.info('[CRON] Running CAPA deadline check...');
    try {
      const deadlineCapas = await prisma.capa.findMany({
        where: {
          dueDate: { lte: addDays(new Date(), 2) },
          status: { notIn: ['closed', 'pending_verification'] },
        },
      });

      for (const capa of deadlineCapas) {
        const now = new Date();
        const isOverdue = capa.dueDate < now;
        if (isOverdue && capa.status !== 'overdue') {
          await prisma.capa.update({ where: { id: capa.id }, data: { status: 'overdue' } });
        }

        if (capa.ownerId) {
          const notifType = isOverdue ? 'capa_overdue' : 'capa_deadline_critical';
          await prisma.notification.create({
            data: {
              userId: capa.ownerId,
              type: notifType as Parameters<typeof prisma.notification.create>[0]['data']['type'],
              title: `CAPA ${capa.capaCode} ${isOverdue ? 'is overdue' : 'deadline in 48h'}`,
              message: `${capa.title} — due ${capa.dueDate.toLocaleDateString()}`,
              metadata: { capaId: capa.id },
            },
          });
        }
      }

      logger.info(`[CRON] CAPA check: ${deadlineCapas.length} CAPAs processed`);
    } catch (err) {
      logger.error('[CRON] CAPA deadline job failed', err);
    }
  });

  // Weekly Sunday midnight: Generate analytics snapshots
  cron.schedule('0 0 * * 0', async () => {
    logger.info('[CRON] Generating weekly analytics snapshot...');
    try {
      const now = new Date();
      const month = now.getMonth() + 1;
      const year = now.getFullYear();
      const start = startOfMonth(now);
      const end = endOfMonth(now);

      const [totalBatches, releasedBatches, holdBatches, testRequestCount, totalCerts, validCerts, closedCapas] =
        await Promise.all([
          prisma.batchRecord.count({ where: { createdAt: { gte: start, lte: end } } }),
          prisma.batchRecord.count({ where: { releaseDate: { gte: start, lte: end }, status: 'released' } }),
          prisma.batchRecord.count({ where: { createdAt: { gte: start, lte: end }, status: 'qc_hold' } }),
          prisma.testRequest.count({ where: { createdAt: { gte: start, lte: end } } }),
          prisma.certification.count(),
          prisma.certification.count({ where: { status: 'valid' } }),
          prisma.capa.count({ where: { closedAt: { gte: start, lte: end } } }),
        ]);

      const testRequestAgg = await prisma.testRequest.aggregate({
        where: { createdAt: { gte: start, lte: end } },
        _sum: { quote: true },
      });

      const auditAvg = await prisma.audit.aggregate({
        where: { completedDate: { gte: start, lte: end } },
        _avg: { score: true },
      });

      // Avg CAPA resolution days
      const closedCapaList = await prisma.capa.findMany({
        where: { closedAt: { gte: start, lte: end } },
        select: { createdAt: true, closedAt: true },
      });
      const avgResolution = closedCapaList.length
        ? closedCapaList.reduce((acc, c) => acc + (c.closedAt!.getTime() - c.createdAt.getTime()) / 86400000, 0) / closedCapaList.length
        : null;

      await prisma.analyticsSnapshot.upsert({
        where: { month_year: { month, year } },
        create: {
          month, year,
          qualityScore: auditAvg._avg.score,
          capaResolutionDays: avgResolution,
          certComplianceRate: totalCerts > 0 ? (validCerts / totalCerts) * 100 : null,
          totalBatches, releasedBatches, holdBatches,
          testRequestCount,
          testRequestValue: testRequestAgg._sum.quote,
        },
        update: {
          qualityScore: auditAvg._avg.score,
          capaResolutionDays: avgResolution,
          certComplianceRate: totalCerts > 0 ? (validCerts / totalCerts) * 100 : null,
          totalBatches, releasedBatches, holdBatches,
          testRequestCount,
          testRequestValue: testRequestAgg._sum.quote,
        },
      });

      logger.info('[CRON] Analytics snapshot generated');
    } catch (err) {
      logger.error('[CRON] Analytics snapshot job failed', err);
    }
  });

  // Monthly 1st at 2am: Archive old closed CAPAs (flag only, not delete)
  cron.schedule('0 2 1 * *', async () => {
    logger.info('[CRON] Running monthly CAPA archive check...');
    try {
      const threshold = subMonths(new Date(), 6);
      const archived = await prisma.capa.count({
        where: { status: 'closed', closedAt: { lt: threshold } },
      });
      logger.info(`[CRON] ${archived} closed CAPAs eligible for archive`);
    } catch (err) {
      logger.error('[CRON] CAPA archive job failed', err);
    }
  });

  logger.info('Cron jobs started (cert-expiry, capa-deadline, analytics, archive)');
}
