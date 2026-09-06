import type { Request, Response } from 'express';
import { friendsService } from './friends.service.js';

export const friendsController = {
  async list(req: Request, res: Response) {
    const userId = (req as Request & { user?: { id: string } }).user?.id;
    if (!userId) return void res.status(401).json({ message: 'Unauthorized' });

    const friends = await friendsService.listFriends(userId);
    res.json(friends);
  },

  async toggleFollow(req: Request, res: Response) {
    const userId = (req as Request & { user?: { id: string } }).user?.id;
    if (!userId) return void res.status(401).json({ message: 'Unauthorized' });

    const targetUserId = String(req.params.id);
    const result = await friendsService.toggleFollow(userId, targetUserId);
    res.json(result);
  },

  async inviteStreak(req: Request, res: Response) {
    const userId = (req as Request & { user?: { id: string } }).user?.id;
    if (!userId) return void res.status(401).json({ message: 'Unauthorized' });

    const targetUserId = String(req.body.friendId ?? req.params.id);
    const result = await friendsService.inviteStreak(userId, targetUserId);
    res.json({ message: 'Undangan streak berhasil dikirim', data: result });
  },

  async acceptStreak(req: Request, res: Response) {
    const userId = (req as Request & { user?: { id: string } }).user?.id;
    if (!userId) return void res.status(401).json({ message: 'Unauthorized' });

    const targetUserId = String(req.params.id);
    const result = await friendsService.acceptStreak(userId, targetUserId);
    res.json({ message: 'Streak resmi aktif! 🎉', data: result });
  },

  async rejectStreak(req: Request, res: Response) {
    const userId = (req as Request & { user?: { id: string } }).user?.id;
    if (!userId) return void res.status(401).json({ message: 'Unauthorized' });

    const targetUserId = String(req.params.id);
    const result = await friendsService.rejectStreak(userId, targetUserId);
    res.json(result);
  },

  async endStreak(req: Request, res: Response) {
    const userId = (req as Request & { user?: { id: string } }).user?.id;
    if (!userId) return void res.status(401).json({ message: 'Unauthorized' });

    const targetUserId = String(req.params.id);
    const result = await friendsService.endStreak(userId, targetUserId);
    res.json({ message: 'Streak telah diakhiri', data: result });
  },

  async pingStreak(req: Request, res: Response) {
    const userId = (req as Request & { user?: { id: string } }).user?.id;
    if (!userId) return void res.status(401).json({ message: 'Unauthorized' });

    const targetUserId = String(req.params.id);
    const result = await friendsService.pingStreak(userId, targetUserId);
    res.json({ message: 'Ping streak terkirim! 🔥', data: result });
  },

  async search(req: Request, res: Response) {
    const userId = (req as Request & { user?: { id: string } }).user?.id;
    if (!userId) return void res.status(401).json({ message: 'Unauthorized' });

    const q = String(req.query.q ?? '');
    const results = await friendsService.searchUsers(q, userId);
    res.json(results);
  },
};
