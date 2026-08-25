import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { requireAuth } from '../../middlewares/auth.js';
import { profileController } from './profile.controller.js';

export const profileRouter = Router();

profileRouter.get('/', requireAuth, asyncHandler(profileController.me));
profileRouter.get('/me', requireAuth, asyncHandler(profileController.me));
profileRouter.post('/', requireAuth, asyncHandler(profileController.update));
profileRouter.post('/me', requireAuth, asyncHandler(profileController.update));
profileRouter.put('/', requireAuth, asyncHandler(profileController.update));
profileRouter.put('/me', requireAuth, asyncHandler(profileController.update));