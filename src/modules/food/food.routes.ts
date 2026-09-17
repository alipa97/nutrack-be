import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { requireAuth } from '../../middlewares/auth.js';
import { foodController } from './food.controller.js';
import { foodClassifyController } from './food-classify.controller.js';
import multer from 'multer';

// Setup multer for memory storage (max 10MB)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});

export const foodRouter = Router();

foodRouter.get('/groups', asyncHandler(foodController.foodGroups));
foodRouter.get('/catalog', asyncHandler(foodController.catalog));
foodRouter.get('/logs', requireAuth, asyncHandler(foodController.list));
foodRouter.post('/logs', requireAuth, asyncHandler(foodController.create));
foodRouter.delete('/logs/:id', requireAuth, asyncHandler(foodController.delete));
foodRouter.patch('/logs/:id/meal-type', requireAuth, asyncHandler(foodController.updateMealType));
foodRouter.get('/summary/today', requireAuth, asyncHandler(foodController.dailySummary));
foodRouter.post('/classify', requireAuth, upload.single('file'), asyncHandler(foodClassifyController.classify));