import { Router } from 'express';
import { ReceiptController } from '../controllers/ReceiptController';
import { authMiddleware } from '../middlewares/auth.middleware';
import { uploadReceiptMiddleware } from '../middlewares/upload.middleware';

export function createReceiptRoutes(receiptController: ReceiptController): Router {
  const router = Router();

  router.use(authMiddleware);

  router.post(
    '/expenses/:expenseId/receipts',
    uploadReceiptMiddleware.single('file'),
    receiptController.upload
  );
  router.get('/expenses/:expenseId/receipts', receiptController.getByExpenseId);
  router.delete('/receipts/:id', receiptController.delete);

  return router;
}
