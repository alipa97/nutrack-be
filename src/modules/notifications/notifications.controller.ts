import type { Request, Response } from 'express';
import { notificationsService } from './notifications.service.js';

export const notificationsController = {
  async getUnread(req: Request, res: Response) {
    const userId = (req as Request & { user?: { id: string } }).user?.id;
    if (!userId) return void res.status(401).json({ message: 'Unauthorized' });

    const notifications = await notificationsService.getUnreadNotifications(userId);
    res.json({ data: notifications });
  },

  async markRead(req: Request, res: Response) {
    const userId = (req as Request & { user?: { id: string } }).user?.id;
    if (!userId) return void res.status(401).json({ message: 'Unauthorized' });

    const notificationIds = Array.isArray(req.body.ids) ? req.body.ids : undefined;
    const result = await notificationsService.markAsRead(userId, notificationIds);
    res.json(result);
  },
};
