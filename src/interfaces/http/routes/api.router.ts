import { Router } from 'express';
import { createAuthRoutes } from './auth.routes';
import { createUserRoutes } from './user.routes';
import { createDepartmentRoutes } from './department.routes';
import { createCostCenterRoutes } from './cost-center.routes';
import { createBudgetRoutes } from './budget.routes';
import { createExpenseCategoryRoutes } from './expense-category.routes';
import { createExpenseRoutes } from './expense.routes';
import { createApprovalRoutes } from './approval.routes';
import { createReimbursementRoutes } from './reimbursement.routes';
import { createAuditRoutes } from './audit.routes';
import { createNotificationRoutes } from './notification.routes';
import { createPolicyRoutes } from './policy.routes';
import { createAdvanceRoutes } from './advance.routes';
import { createAnalyticsRoutes } from './analytics.routes';
import { createReceiptRoutes } from './receipt.routes';
import { createHealthRoutes } from './health.routes';

import { AuthController } from '../controllers/AuthController';
import { UserController } from '../controllers/UserController';
import { DepartmentController } from '../controllers/DepartmentController';
import { CostCenterController } from '../controllers/CostCenterController';
import { BudgetController } from '../controllers/BudgetController';
import { ExpenseCategoryController } from '../controllers/ExpenseCategoryController';
import { ExpenseController } from '../controllers/ExpenseController';
import { ApprovalController } from '../controllers/ApprovalController';
import { ReimbursementController } from '../controllers/ReimbursementController';
import { AuditController } from '../controllers/AuditController';
import { NotificationController } from '../controllers/NotificationController';
import { PolicyController } from '../controllers/PolicyController';
import { AdvancePaymentController } from '../controllers/AdvancePaymentController';
import { AnalyticsController } from '../controllers/AnalyticsController';
import { ReceiptController } from '../controllers/ReceiptController';
import { HealthController } from '../controllers/HealthController';

export interface ApiRouterControllers {
  authController: AuthController;
  userController: UserController;
  departmentController: DepartmentController;
  costCenterController: CostCenterController;
  budgetController: BudgetController;
  categoryController: ExpenseCategoryController;
  expenseController: ExpenseController;
  approvalController: ApprovalController;
  reimbursementController: ReimbursementController;
  auditController: AuditController;
  notificationController: NotificationController;
  policyController: PolicyController;
  advanceController: AdvancePaymentController;
  analyticsController: AnalyticsController;
  receiptController: ReceiptController;
  healthController: HealthController;
}

export function createApiRouter(controllers: ApiRouterControllers): Router {
  const router = Router();

  router.use('/', createHealthRoutes(controllers.healthController));
  router.use('/auth', createAuthRoutes(controllers.authController));
  router.use('/users', createUserRoutes(controllers.userController));
  router.use('/departments', createDepartmentRoutes(controllers.departmentController));
  router.use('/cost-centers', createCostCenterRoutes(controllers.costCenterController));
  router.use('/budgets', createBudgetRoutes(controllers.budgetController));
  router.use('/categories', createExpenseCategoryRoutes(controllers.categoryController));
  router.use('/expenses', createExpenseRoutes(controllers.expenseController));
  router.use('/approvals', createApprovalRoutes(controllers.approvalController));
  router.use('/reimbursements', createReimbursementRoutes(controllers.reimbursementController));
  router.use('/audit', createAuditRoutes(controllers.auditController));
  router.use('/notifications', createNotificationRoutes(controllers.notificationController));
  router.use('/policies', createPolicyRoutes(controllers.policyController));
  router.use('/advances', createAdvanceRoutes(controllers.advanceController));
  router.use('/analytics', createAnalyticsRoutes(controllers.analyticsController));
  router.use('/', createReceiptRoutes(controllers.receiptController));

  return router;
}
