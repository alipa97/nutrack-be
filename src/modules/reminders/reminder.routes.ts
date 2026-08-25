import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { requireAuth } from '../../middlewares/auth.js';
import { reminderController } from './reminder.controller.js';

export const reminderRouter = Router();

reminderRouter.get('/', requireAuth, asyncHandler(reminderController.list));
reminderRouter.post('/', requireAuth, asyncHandler(reminderController.create));
reminderRouter.put('/:id', requireAuth, asyncHandler(reminderController.update));
reminderRouter.patch('/:id', requireAuth, asyncHandler(reminderController.update));
reminderRouter.delete('/:id', requireAuth, asyncHandler(reminderController.delete));