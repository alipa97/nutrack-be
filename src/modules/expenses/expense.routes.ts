import { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate.js';
import { validate } from '../../middlewares/validate.js';
import {
  listExpensesHandler,
  createExpenseHandler,
  deleteExpenseHandler,
  getExpenseStatsHandler,
  createExpenseSchema,
  listExpensesQuerySchema,
} from './expense.controller.js';

export const expenseRouter = Router();

expenseRouter.use(authenticate);

expenseRouter.get('/', validate({ query: listExpensesQuerySchema }), listExpensesHandler);
expenseRouter.post('/', validate({ body: createExpenseSchema }), createExpenseHandler);
expenseRouter.delete('/:id', deleteExpenseHandler);
expenseRouter.get('/stats', getExpenseStatsHandler);
