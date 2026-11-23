import { Router } from 'express';
import { ExpenseController } from '../controllers/ExpenseController';
import { authMiddleware } from '../middlewares/auth.middleware';
import { validateBody, createExpenseSchema, createExpenseItemSchema } from '../validations';

export function createExpenseRoutes(expenseController: ExpenseController): Router {
  const router = Router();

  router.use(authMiddleware);

  router.get('/', expenseController.search);
  router.post('/', validateBody(createExpenseSchema), expenseController.create);
  router.get('/:id', expenseController.getById);
  router.post('/:id/items', validateBody(createExpenseItemSchema), expenseController.addItem);
  router.delete('/:id/items/:itemId', expenseController.removeItem);
  router.post('/:id/submit', expenseController.submit);
  router.post('/:id/cancel', expenseController.cancel);

  return router;
}
