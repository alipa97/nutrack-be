import type { Request, Response } from 'express';
import { educationService } from './education.service.js';

export const educationController = {
  async listArticles(req: Request, res: Response) {
    const userId = (req as Request & { user?: { id: string } }).user?.id;
    const articles = await educationService.listArticles(userId);
    res.json(articles);
  },

  async getArticle(req: Request, res: Response) {
    const userId = (req as Request & { user?: { id: string } }).user?.id;
    const article = await educationService.getArticle(String(req.params.id), userId);
    if (!article) {
      return void res.status(404).json({ message: 'Artikel tidak ditemukan' });
    }
    res.json(article);
  },

  async toggleLike(req: Request, res: Response) {
    const userId = (req as Request & { user?: { id: string } }).user?.id;
    if (!userId) return void res.status(401).json({ message: 'Unauthorized' });

    const result = await educationService.toggleLike(userId, String(req.params.id));
    res.json(result);
  },

  async toggleBookmark(req: Request, res: Response) {
    const userId = (req as Request & { user?: { id: string } }).user?.id;
    if (!userId) return void res.status(401).json({ message: 'Unauthorized' });

    const result = await educationService.toggleBookmark(userId, String(req.params.id));
    res.json(result);
  },

  async listGlossary(_req: Request, res: Response) {
    const items = await educationService.listGlossary();
    res.json(items);
  },
};
