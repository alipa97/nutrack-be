import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { requireAuth } from '../../middlewares/auth.js';
import { gamificationController } from './gamification.controller.js';

export const gamificationRouter = Router();

gamificationRouter.get('/summary', requireAuth, asyncHandler(gamificationController.summary));
gamificationRouter.post('/challenges/:id/claim', requireAuth, asyncHandler(gamificationController.claimChallenge));