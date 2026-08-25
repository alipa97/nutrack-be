import type { Request, Response } from 'express';
import { gamificationService } from './gamification.service.js';

export const gamificationController = {
  async summary(req: Request, res: Response) {
    const userId = (req as Request & { user?: { id: string } }).user?.id;
    if (!userId) return void res.status(401).json({ message: 'Unauthorized' });
    res.json(await gamificationService.summary(userId));
  },

  async claimChallenge(req: Request, res: Response) {
    const userId = (req as Request & { user?: { id: string } }).user?.id;
    if (!userId) return void res.status(401).json({ message: 'Unauthorized' });

    const challengeId = String(req.params.id);
    const date = typeof req.body?.date === 'string' ? new Date(req.body.date) : new Date();
    res.json(await gamificationService.claimChallenge(userId, challengeId, date));
  },
};