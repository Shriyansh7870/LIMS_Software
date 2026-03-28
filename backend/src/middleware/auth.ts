import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    labId?: string;
  };
}

export function authenticate(req: AuthRequest, res: Response, next: NextFunction): void {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    res.status(401).json({ success: false, error: 'No token provided', code: 'UNAUTHORIZED' });
    return;
  }
  try {
    const decoded = jwt.verify(token, config.jwt.secret) as {
      id: string;
      email: string;
      role: string;
      labId?: string;
    };
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ success: false, error: 'Invalid or expired token', code: 'INVALID_TOKEN' });
  }
}

export function authorize(...roles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({ success: false, error: 'Insufficient permissions', code: 'FORBIDDEN' });
      return;
    }
    next();
  };
}
