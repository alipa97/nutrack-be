import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { requireAuth } from '../../middlewares/auth.js';
import { dashboardController } from './dashboard.controller.js';

export const dashboardRouter = Router();

dashboardRouter.get('/summary', requireAuth, asyncHandler(dashboardController.summary));
dashboardRouter.get('/weekly-report', requireAuth, asyncHandler(dashboardController.weeklyReport));
dashboardRouter.get('/weekly', requireAuth, asyncHandler(dashboardController.weeklyReport));