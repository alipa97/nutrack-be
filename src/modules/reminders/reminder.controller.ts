import type { Request, Response } from 'express';
import { z } from 'zod';
import { reminderService } from './reminder.service.js';

const reminderSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  reminderTime: z.string().min(1),
  isEnabled: z.boolean().default(true),
  category: z.string().optional(),
  subType: z.string().optional(),
  optionNumber: z.number().int().optional(),
  templateId: z.string().uuid().optional(),
  iconKey: z.string().optional(),
  repeatRule: z.string().optional(),
});

export const reminderController = {
  async getTemplates(_req: Request, res: Response) {
    res.json(await reminderService.getTemplates());
  },

  async list(req: Request, res: Response) {
    const userId = (req as Request & { user?: { id: string } }).user?.id;
    if (!userId) return void res.status(401).json({ message: 'Unauthorized' });
    res.json(await reminderService.list(userId));
  },

  async create(req: Request, res: Response) {
    const userId = (req as Request & { user?: { id: string } }).user?.id;
    if (!userId) return void res.status(401).json({ message: 'Unauthorized' });

    const parsed = reminderSchema.parse(req.body);
    res.status(201).json(await reminderService.create(userId, parsed));
  },

  async update(req: Request, res: Response) {
    const userId = (req as Request & { user?: { id: string } }).user?.id;
    if (!userId) return void res.status(401).json({ message: 'Unauthorized' });

    const parsed = reminderSchema.partial().parse(req.body);
    res.json(await reminderService.update(userId, String(req.params.id), parsed));
  },

  async delete(req: Request, res: Response) {
    const userId = (req as Request & { user?: { id: string } }).user?.id;
    if (!userId) return void res.status(401).json({ message: 'Unauthorized' });

    await reminderService.delete(userId, String(req.params.id));
    res.json({ message: 'Reminder deleted successfully' });
  },
};