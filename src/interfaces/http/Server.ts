import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import http from 'http';

import { config } from '../../config';
import { DatabasePool } from '../../infrastructure/database/DatabasePool';
import { logger } from '../../infrastructure/logging/AppLogger';
import { requestLoggerMiddleware } from './middlewares/request-logger.middleware';
import { errorHandlerMiddleware } from './middlewares/error-handler.middleware';
import { openApiSpec } from './docs/swagger.config';

// Repositories
import {
  UserRepository,
  DepartmentRepository,
  CostCenterRepository,
  BudgetRepository,
  ExpenseCategoryRepository,
  ExpenseRepository,
  ExpenseItemRepository,
  ExpenseReceiptRepository,
  ApprovalWorkflowRepository,
  ReimbursementBatchRepository,
  ReimbursementPaymentRepository,
  AuditLogRepository,
  NotificationRepository,
  PolicyRuleRepository,
  AdvancePaymentRepository,
  CurrencyRateRepository,
} from '../../infrastructure/repositories';

// Infrastructure Services
import { BcryptHasher, JwtService, TokenBlacklist } from '../../infrastructure/security';
import { NodeMailerSender } from '../../infrastructure/notifications';

// Application Services
import {
  AuthService,
  UserService,
  DepartmentService,
  CostCenterService,
  BudgetService,
  ExpenseCategoryService,
  ExpenseService,
  ApprovalWorkflowService,
  ReimbursementBatchService,
  AuditService,
  NotificationService,
  PolicyService,
  AdvancePaymentService,
  AnalyticsService,
} from '../../application/services';

// Controllers
import {
  AuthController,
  UserController,
  DepartmentController,
  CostCenterController,
  BudgetController,
  ExpenseCategoryController,
  ExpenseController,
  ApprovalController,
  ReimbursementController,
  AuditController,
  NotificationController,
  PolicyController,
  AdvancePaymentController,
  AnalyticsController,
  ReceiptController,
  HealthController,
} from './controllers';

import { createApiRouter } from './routes/api.router';

export class AppServer {
  private app: Express;
  private server?: http.Server;
  private dbPool: DatabasePool;

  constructor() {
    this.app = express();
    this.dbPool = DatabasePool.getInstance();
    this.configureMiddlewares();
    this.configureRoutes();
    this.configureErrorHandling();
  }

  private configureMiddlewares(): void {
    this.app.use(helmet());
    this.app.use(cors());
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));
    this.app.use(requestLoggerMiddleware);

    // Rate Limiting
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 1000,
      standardHeaders: true,
      legacyHeaders: false,
      message: {
        success: false,
        error: {
          type: 'RateLimitExceeded',
          message: 'Muitas requisições originadas deste IP. Tente novamente mais tarde.',
          statusCode: 429,
        },
      },
    });
    this.app.use(limiter);

    // Swagger UI Documentation
    this.app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openApiSpec));
  }

  private configureRoutes(): void {
    // 1. Instancia Repositórios
    const userRepo = new UserRepository(this.dbPool);
    const deptRepo = new DepartmentRepository(this.dbPool);
    const costCenterRepo = new CostCenterRepository(this.dbPool);
    const budgetRepo = new BudgetRepository(this.dbPool);
    const categoryRepo = new ExpenseCategoryRepository(this.dbPool);
    const expenseRepo = new ExpenseRepository(this.dbPool);
    const itemRepo = new ExpenseItemRepository(this.dbPool);
    const receiptRepo = new ExpenseReceiptRepository(this.dbPool);
    const workflowRepo = new ApprovalWorkflowRepository(this.dbPool);
    const batchRepo = new ReimbursementBatchRepository(this.dbPool);
    const paymentRepo = new ReimbursementPaymentRepository(this.dbPool);
    const auditRepo = new AuditLogRepository(this.dbPool);
    const notifRepo = new NotificationRepository(this.dbPool);
    const policyRepo = new PolicyRuleRepository(this.dbPool);
    const advanceRepo = new AdvancePaymentRepository(this.dbPool);

    // 2. Instancia Serviços Auxiliares
    const hasher = new BcryptHasher();
    const jwtService = new JwtService();
    const blacklist = TokenBlacklist.getInstance();
    const emailSender = new NodeMailerSender();

    // 3. Instancia Serviços de Aplicação
    const authService = new AuthService(userRepo, auditRepo, hasher, jwtService, blacklist);
    const userService = new UserService(userRepo, auditRepo, hasher);
    const deptService = new DepartmentService(deptRepo);
    const costCenterService = new CostCenterService(costCenterRepo);
    const budgetService = new BudgetService(budgetRepo, costCenterRepo);
    const categoryService = new ExpenseCategoryService(categoryRepo);
    const workflowService = new ApprovalWorkflowService(
      workflowRepo,
      expenseRepo,
      userRepo,
      deptRepo,
      auditRepo,
      notifRepo,
      emailSender
    );
    const expenseService = new ExpenseService(
      expenseRepo,
      itemRepo,
      receiptRepo,
      categoryRepo,
      userRepo,
      budgetRepo,
      policyRepo,
      auditRepo,
      notifRepo,
      emailSender,
      workflowService
    );
    const reimbursementService = new ReimbursementBatchService(
      batchRepo,
      paymentRepo,
      expenseRepo,
      userRepo,
      auditRepo,
      notifRepo,
      emailSender
    );
    const auditService = new AuditService(auditRepo);
    const notifService = new NotificationService(notifRepo);
    const policyService = new PolicyService(policyRepo);
    const advanceService = new AdvancePaymentService(advanceRepo, userRepo, deptRepo);
    const analyticsService = new AnalyticsService(this.dbPool);

    // 4. Instancia Controllers
    const authController = new AuthController(authService);
    const userController = new UserController(userService);
    const departmentController = new DepartmentController(deptService);
    const costCenterController = new CostCenterController(costCenterService);
    const budgetController = new BudgetController(budgetService);
    const categoryController = new ExpenseCategoryController(categoryService);
    const expenseController = new ExpenseController(expenseService);
    const approvalController = new ApprovalController(workflowService);
    const reimbursementController = new ReimbursementController(reimbursementService);
    const auditController = new AuditController(auditService);
    const notificationController = new NotificationController(notifService);
    const policyController = new PolicyController(policyService);
    const advanceController = new AdvancePaymentController(advanceService);
    const analyticsController = new AnalyticsController(analyticsService);
    const receiptController = new ReceiptController(receiptRepo, expenseRepo);
    const healthController = new HealthController(this.dbPool);

    // 5. Configura Roteador Principal da API
    const apiRouter = createApiRouter({
      authController,
      userController,
      departmentController,
      costCenterController,
      budgetController,
      categoryController,
      expenseController,
      approvalController,
      reimbursementController,
      auditController,
      notificationController,
      policyController,
      advanceController,
      analyticsController,
      receiptController,
      healthController,
    });

    this.app.use(config.app.apiPrefix, apiRouter);

    // Rota Raiz Informativa
    this.app.get('/', (_req, res) => {
      res.json({
        name: config.app.name,
        version: '1.0.0',
        environment: config.app.env,
        docs: '/api-docs',
        apiPrefix: config.app.apiPrefix,
      });
    });
  }

  private configureErrorHandling(): void {
    this.app.use(errorHandlerMiddleware);
  }

  public getApp(): Express {
    return this.app;
  }

  public async start(): Promise<http.Server> {
    const port = config.app.port;
    return new Promise((resolve) => {
      this.server = this.app.listen(port, () => {
        logger.info(`[Servidor HTTP] ${config.app.name} iniciado na porta ${port}`);
        logger.info(`[Documentação Swagger] Acesse: http://localhost:${port}/api-docs`);
        resolve(this.server!);
      });
    });
  }

  public async stop(): Promise<void> {
    if (this.server) {
      await new Promise<void>((resolve, reject) => {
        this.server!.close((err) => (err ? reject(err) : resolve()));
      });
    }
    await this.dbPool.close();
  }
}
