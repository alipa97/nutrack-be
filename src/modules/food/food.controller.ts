import type { Request, Response } from 'express';
import { z } from 'zod';
import { foodService } from './food.service.js';

const createFoodLogSchema = z.object({
  foodName: z.string().min(1),
  mealType: z.enum(['breakfast', 'lunch', 'dinner', 'snack']),
  foodCatalogId: z.string().uuid().nullable().optional(),
  loggedAt: z.string().nullable().optional(),
  imageUrl: z.string().nullable().optional(),
  isAiDetected: z.boolean().optional().default(false),
  aiConfidence: z.number().min(0).max(1).nullable().optional(),
});


const updateMealTypeSchema = z.object({
  mealType: z.enum(['breakfast', 'lunch', 'dinner', 'snack']),
});

export const foodController = {
  async list(req: Request, res: Response) {
    const userId = (req as Request & { user?: { id: string } }).user?.id;
    if (!userId) return void res.status(401).json({ message: 'Unauthorized' });

    const date = typeof req.query.date === 'string' ? req.query.date : undefined;
    res.json(await foodService.listLogs(userId, date));
  },

  async create(req: Request, res: Response) {
    const userId = (req as Request & { user?: { id: string } }).user?.id;
    if (!userId) return void res.status(401).json({ message: 'Unauthorized' });

    const parsed = createFoodLogSchema.parse(req.body);
    res.status(201).json(await foodService.createLog(userId, parsed));
  },

  async delete(req: Request, res: Response) {
    const userId = (req as Request & { user?: { id: string } }).user?.id;
    if (!userId) return void res.status(401).json({ message: 'Unauthorized' });

    await foodService.deleteLog(userId, String(req.params.id));
    res.json({ message: 'Food log deleted successfully' });
  },

  async updateMealType(req: Request, res: Response) {
    const userId = (req as Request & { user?: { id: string } }).user?.id;
    if (!userId) return void res.status(401).json({ message: 'Unauthorized' });

    const parsed = updateMealTypeSchema.parse(req.body);
    res.json(await foodService.updateMealType(userId, String(req.params.id), parsed.mealType));
  },

  async catalog(req: Request, res: Response) {
    const query = typeof req.query.q === 'string' ? req.query.q : undefined;
    const foodGroupId = typeof req.query.foodGroupId === 'string' ? req.query.foodGroupId : undefined;
    res.json(await foodService.listCatalog(query, foodGroupId));
  },

  async foodGroups(_req: Request, res: Response) {
    res.json(await foodService.listFoodGroups());
  },

  async dailySummary(req: Request, res: Response) {
    const userId = (req as Request & { user?: { id: string } }).user?.id;
    if (!userId) return void res.status(401).json({ message: 'Unauthorized' });

    const date = typeof req.query.date === 'string' ? new Date(req.query.date) : new Date();
    res.json(await foodService.dailySummary(userId, date));
  },
};