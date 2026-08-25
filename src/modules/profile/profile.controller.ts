import type { Request, Response } from 'express';
import { z } from 'zod';
import { profileService } from './profile.service.js';

const updateProfileSchema = z.object({
  name: z.string().min(2).optional(),
  birthDate: z.string().optional(),
  gender: z.enum(['male', 'female', 'other']).optional(),
  heightCm: z.number().positive().optional(),
  weightKg: z.number().positive().optional(),
});

export const profileController = {
  async me(req: Request, res: Response) {
    const userId = (req as Request & { user?: { id: string } }).user?.id;
    if (!userId) return void res.status(401).json({ message: 'Unauthorized' });
    res.json(await profileService.getCurrent(userId));
  },

  async update(req: Request, res: Response) {
    const userId = (req as Request & { user?: { id: string } }).user?.id;
    if (!userId) return void res.status(401).json({ message: 'Unauthorized' });

    const parsed = updateProfileSchema.parse(req.body);
    res.json(await profileService.createOrUpdate(userId, parsed));
  },
};