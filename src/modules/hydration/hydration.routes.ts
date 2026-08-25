import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { requireAuth } from '../../middlewares/auth.js';
import { hydrationController } from './hydration.controller.js';

export const hydrationRouter = Router();

hydrationRouter.get('/', requireAuth, asyncHandler(hydrationController.list));
hydrationRouter.get('/log', requireAuth, asyncHandler(hydrationController.list));
hydrationRouter.get('/logs', requireAuth, asyncHandler(hydrationController.list));
hydrationRouter.get('/today', requireAuth, asyncHandler(hydrationController.dailyTotal));
hydrationRouter.get('/summary/today', requireAuth, asyncHandler(hydrationController.dailyTotal));
hydrationRouter.post('/', requireAuth, asyncHandler(hydrationController.create));
hydrationRouter.post('/log', requireAuth, asyncHandler(hydrationController.create));
hydrationRouter.post('/logs', requireAuth, asyncHandler(hydrationController.create));
hydrationRouter.post('/reset', requireAuth, asyncHandler(hydrationController.resetToday));