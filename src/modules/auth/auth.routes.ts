import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { requireAuth } from '../../middlewares/auth.js';
import { authController } from './auth.controller.js';

export const authRouter = Router();

authRouter.post('/register', asyncHandler(authController.register));
authRouter.post('/login', asyncHandler(authController.login));
authRouter.get('/me', requireAuth, asyncHandler(authController.me));