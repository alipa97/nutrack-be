import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { requireAuth } from '../../middlewares/auth.js';
import { friendsController } from './friends.controller.js';

export const friendsRouter = Router();

friendsRouter.use(requireAuth);

friendsRouter.get('/', asyncHandler(friendsController.list));
friendsRouter.get('/search', asyncHandler(friendsController.search));
friendsRouter.post('/:id/follow', asyncHandler(friendsController.toggleFollow));
friendsRouter.post('/streak/invite', asyncHandler(friendsController.inviteStreak));
friendsRouter.post('/streak/:id/invite', asyncHandler(friendsController.inviteStreak));
friendsRouter.post('/streak/:id/accept', asyncHandler(friendsController.acceptStreak));
friendsRouter.post('/streak/:id/reject', asyncHandler(friendsController.rejectStreak));
friendsRouter.post('/streak/:id/end', asyncHandler(friendsController.endStreak));
friendsRouter.post('/streak/:id/ping', asyncHandler(friendsController.pingStreak));
