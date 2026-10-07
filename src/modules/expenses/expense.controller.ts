import { Request, Response } from 'express';
import { expenseService } from './expense.service.js';

export const expenseController = {
  async list(req: Request, res: Response) {
    const userId = (req as any).user.id;
    const dateStr = req.query.date as string | undefined;
    const data = await expenseService.list(userId, dateStr);
    res.json({ success: true, data });
  },

  async create(req: Request, res: Response) {
    const userId = (req as any).user.id;
    const { amount, category, description, loggedAt } = req.body;
    const data = await expenseService.create(userId, {
      amount,
      category,
      description,
      loggedAt,
    });
    res.status(201).json({ success: true, data });
  },

  async delete(req: Request, res: Response) {
    const userId = (req as any).user.id;
    const { id } = req.params;
    const data = await expenseService.delete(userId, id);
    res.json({ success: true, data });
  },

  async getStats(req: Request, res: Response) {
    const userId = (req as any).user.id;
    const data = await expenseService.getStats(userId);
    res.json({ success: true, data });
  },
};
