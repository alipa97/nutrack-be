import { Router } from 'express';
import { healthCheck } from '../controllers/health.controller.js';
import { authRouter } from '../modules/auth/auth.routes.js';
import { profileRouter } from '../modules/profile/profile.routes.js';
import { dashboardRouter } from '../modules/dashboard/dashboard.routes.js';
import { foodRouter } from '../modules/food/food.routes.js';
import { hydrationRouter } from '../modules/hydration/hydration.routes.js';
import { gamificationRouter } from '../modules/gamification/gamification.routes.js';
import { reminderRouter } from '../modules/reminders/reminder.routes.js';
import { bctRouter } from '../modules/bct/bct.routes.js';
import { educationRouter } from '../modules/education/education.routes.js';
import { friendsRouter } from '../modules/friends/friends.routes.js';
import { notificationsRouter } from '../modules/notifications/notifications.routes.js';

export const apiRouter = Router();

apiRouter.get('/health', healthCheck);
apiRouter.use('/auth', authRouter);
apiRouter.use('/profile', profileRouter);
apiRouter.use('/dashboard', dashboardRouter);
apiRouter.use('/food', foodRouter);
apiRouter.use('/hydration', hydrationRouter);
apiRouter.use('/gamification', gamificationRouter);
apiRouter.use('/reminders', reminderRouter);
apiRouter.use('/bct', bctRouter);
apiRouter.use('/education', educationRouter);
apiRouter.use('/friends', friendsRouter);
apiRouter.use('/notifications', notificationsRouter);