import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { requireAuth, optionalAuth } from '../../middlewares/auth.js';
import { educationController } from './education.controller.js';

export const educationRouter = Router();

// Publicly readable or authenticated for like/bookmark state
educationRouter.get('/articles', optionalAuth, asyncHandler(educationController.listArticles));
educationRouter.get('/articles/:id', optionalAuth, asyncHandler(educationController.getArticle));
educationRouter.get('/glossary', asyncHandler(educationController.listGlossary));

// Actions requiring authentication
educationRouter.post('/articles/:id/like', requireAuth, asyncHandler(educationController.toggleLike));
educationRouter.post('/articles/:id/bookmark', requireAuth, asyncHandler(educationController.toggleBookmark));
