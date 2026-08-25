import type { Request, Response } from 'express';
import { authService } from './auth.service.js';
import { loginSchema, registerSchema } from './auth.schemas.js';

export const authController = {
  async register(req: Request, res: Response) {
    const parsed = registerSchema.parse(req.body);
    const result = await authService.register(parsed);
    res.status(201).json(result);
  },

  async login(req: Request, res: Response) {
    const parsed = loginSchema.parse(req.body);
    const result = await authService.login(parsed);
    res.json(result);
  },

  async me(req: Request, res: Response) {
    const userId = (req as Request & { user?: { id: string } }).user?.id;
    if (!userId) {
      return void res.status(401).json({ message: 'Unauthorized' });
    }

    const user = await authService.me(userId);
    res.json({ user });
  },
};