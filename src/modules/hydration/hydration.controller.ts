import type { Request, Response } from 'express';
import { z } from 'zod';
import { hydrationService } from './hydration.service.js';

const hydrationSchema = z.object({
  amountMl: z.number().int().positive(),
});

export const hydrationController = {
  async list(req: Request, res: Response) {
    const userId = (req as Request & { user?: { id: string } }).user?.id;
    if (!userId) return void res.status(401).json({ message: 'Unauthorized' });

    const date = typeof req.query.date === 'string' ? req.query.date : undefined;
    res.json(await hydrationService.list(userId, date));
  },

  async create(req: Request, res: Response) {
    const userId = (req as Request & { user?: { id: string } }).user?.id;
    if (!userId) return void res.status(401).json({ message: 'Unauthorized' });

    const parsed = hydrationSchema.parse(req.body);
    res.status(201).json(await hydrationService.create(userId, parsed.amountMl));
  },

  async dailyTotal(req: Request, res: Response) {
    const userId = (req as Request & { user?: { id: string } }).user?.id;
    if (!userId) return void res.status(401).json({ message: 'Unauthorized' });

    const date = typeof req.query.date === 'string' ? new Date(req.query.date) : new Date();
    res.json(await hydrationService.dailyTotal(userId, date));
  },

  async resetToday(req: Request, res: Response) {
    const userId = (req as Request & { user?: { id: string } }).user?.id;
    if (!userId) return void res.status(401).json({ message: 'Unauthorized' });

    res.json(await hydrationService.resetToday(userId));
  },
};