import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { requireAuth } from '../../middlewares/auth.js';
import { bctController } from './bct.controller.js';

export const bctRouter = Router();

bctRouter.get('/recommendations', requireAuth, asyncHandler(bctController.list));
bctRouter.get('/food-recommendations', requireAuth, asyncHandler(bctController.foodRecommendations));
bctRouter.get('/food-group-recommendations', requireAuth, asyncHandler(bctController.foodRecommendations));
bctRouter.get('/food-evaluations', requireAuth, asyncHandler(bctController.foodEvaluations));
bctRouter.post('/recommendations/:id/toggle', requireAuth, asyncHandler(bctController.toggleComplete));
bctRouter.post('/recommendations/:id/complete', requireAuth, asyncHandler(bctController.toggleComplete));