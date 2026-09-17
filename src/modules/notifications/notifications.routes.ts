import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { requireAuth } from '../../middlewares/auth.js';
import { notificationsController } from './notifications.controller.js';

export const notificationsRouter = Router();

notificationsRouter.use(requireAuth);

notificationsRouter.get('/unread', asyncHandler(notificationsController.getUnread));
notificationsRouter.patch('/mark-read', asyncHandler(notificationsController.markRead));
