import type { NextFunction, Response } from 'express';
import { verifyAccessToken } from '../utils/jwt.js';

export type AuthenticatedRequest = {
  headers: {
    authorization?: string;
  };
  user?: {
    id: string;
    email: string;
  };
};

export const requireAuth = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const header = req.headers.authorization;

  if (!header?.startsWith('Bearer ')) {
    return void res.status(401).json({ message: 'Unauthorized' });
  }

  const token = header.slice(7);

  try {
    const payload = verifyAccessToken(token);
    req.user = { id: payload.sub, email: payload.email };
    next();
  } catch {
    return void res.status(401).json({ message: 'Invalid token' });
  }
};