import type { Request, Response } from 'express';
import { z } from 'zod';
import { bctService } from './bct.service.js';

const toggleSchema = z.object({
  completionDate: z.string().optional(),
});

export const bctController = {
  async list(req: Request, res: Response) {
    const userId = (req as Request & { user?: { id: string } }).user?.id;
    if (!userId) return void res.status(401).json({ message: 'Unauthorized' });

    const date = typeof req.query.date === 'string' ? new Date(req.query.date) : new Date();
    res.json(await bctService.list(userId, date));
  },

  async toggleComplete(req: Request, res: Response) {
    const userId = (req as Request & { user?: { id: string } }).user?.id;
    if (!userId) return void res.status(401).json({ message: 'Unauthorized' });

    const parsed = toggleSchema.parse(req.body ?? {});
    const date = parsed.completionDate ? new Date(parsed.completionDate) : new Date();
    res.json(await bctService.toggleComplete(userId, String(req.params.id), date));
  },

  /**
   * GET /food-evaluations?period=daily|weekly&date=YYYY-MM-DD
   * Returns dynamic evaluations for 13 food groups based on user's actual consumption.
   */
  async foodEvaluations(req: Request, res: Response) {
    const userId = (req as Request & { user?: { id: string } }).user?.id;
    if (!userId) return void res.status(401).json({ message: 'Unauthorized' });

    const period = req.query.period === 'weekly' ? 'weekly' : 'daily';
    const date = typeof req.query.date === 'string' ? new Date(req.query.date) : new Date();
    res.json(await bctService.getFoodGroupEvaluations(userId, period, date));
  },

  /**
   * GET /food-recommendations or /food-group-recommendations
   * Returns all 13 official Food Group Recommendations master data from Client PDF.
   */
  async foodRecommendations(_req: Request, res: Response) {
    res.json(await bctService.getFoodGroupRecommendations());
  },
};