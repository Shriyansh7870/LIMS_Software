import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../config/database';
import { config } from '../config';
import { AuthRequest } from '../middleware/auth';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email, password } = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.isActive) {
      res.status(401).json({ success: false, error: 'Invalid credentials', code: 'INVALID_CREDENTIALS' });
      return;
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      res.status(401).json({ success: false, error: 'Invalid credentials', code: 'INVALID_CREDENTIALS' });
      return;
    }

    await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });

    const payload = { id: user.id, email: user.email, role: user.role, labId: user.labId };
    const token = jwt.sign(payload, config.jwt.secret, { expiresIn: config.jwt.expiresIn } as Parameters<typeof jwt.sign>[2]);
    const refreshToken = jwt.sign(
      { id: user.id },
      config.jwt.refreshSecret,
      { expiresIn: config.jwt.refreshExpiresIn } as Parameters<typeof jwt.sign>[2]
    );

    res.json({
      success: true,
      data: {
        token,
        refreshToken,
        user: { id: user.id, name: user.name, email: user.email, role: user.role, labId: user.labId },
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      res.status(400).json({ success: false, error: 'Refresh token required' });
      return;
    }

    const decoded = jwt.verify(refreshToken, config.jwt.refreshSecret) as { id: string };
    const user = await prisma.user.findUnique({ where: { id: decoded.id } });

    if (!user || !user.isActive) {
      res.status(401).json({ success: false, error: 'Invalid token' });
      return;
    }

    const payload = { id: user.id, email: user.email, role: user.role, labId: user.labId };
    const token = jwt.sign(payload, config.jwt.secret, { expiresIn: config.jwt.expiresIn } as Parameters<typeof jwt.sign>[2]);

    res.json({ success: true, data: { token } });
  } catch {
    res.status(401).json({ success: false, error: 'Invalid refresh token' });
  }
}

export async function logout(_req: AuthRequest, res: Response): Promise<void> {
  res.json({ success: true, message: 'Logged out successfully' });
}

export async function me(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true, name: true, email: true, role: true,
        labId: true, avatarUrl: true, lastLoginAt: true, createdAt: true,
      },
    });
    if (!user) {
      res.status(404).json({ success: false, error: 'User not found' });
      return;
    }
    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
}
