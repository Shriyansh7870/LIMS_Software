import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { AuthRequest } from '../middleware/auth';

export async function getNotifications(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user!.id },
      orderBy: [{ isRead: 'asc' }, { createdAt: 'desc' }],
      take: 50,
    });
    res.json({ success: true, data: notifications });
  } catch (err) {
    next(err);
  }
}

export async function markRead(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const notif = await prisma.notification.update({
      where: { id: req.params.id, userId: req.user!.id },
      data: { isRead: true, readAt: new Date() },
    });
    res.json({ success: true, data: notif });
  } catch (err) {
    next(err);
  }
}

export async function getUnreadCount(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const count = await prisma.notification.count({
      where: { userId: req.user!.id, isRead: false },
    });
    res.json({ success: true, data: { count } });
  } catch (err) {
    next(err);
  }
}
