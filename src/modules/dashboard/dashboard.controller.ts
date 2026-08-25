import type { Request, Response } from 'express';
import { dashboardService } from './dashboard.service.js';

export const dashboardController = {
  async summary(req: Request, res: Response) {
    const userId = (req as Request & { user?: { id: string } }).user?.id;
    if (!userId) return void res.status(401).json({ message: 'Unauthorized' });

    const date = typeof req.query.date === 'string' ? new Date(req.query.date) : new Date();
    res.json(await dashboardService.getSummary(userId, date));
  },

  async weeklyReport(req: Request, res: Response) {
    const userId = (req as Request & { user?: { id: string } }).user?.id;
    if (!userId) return void res.status(401).json({ message: 'Unauthorized' });

    const date = typeof req.query.date === 'string' ? new Date(req.query.date) : new Date();
    res.json(await dashboardService.getWeeklyReport(userId, date));
  },
};