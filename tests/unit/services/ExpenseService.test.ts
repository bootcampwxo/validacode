import { ExpenseService } from '../../../src/application/services/ExpenseService';
import { IExpenseRepository } from '../../../src/infrastructure/repositories/IExpenseRepository';
import { IExpenseItemRepository } from '../../../src/infrastructure/repositories/IExpenseItemRepository';
import { IExpenseReceiptRepository } from '../../../src/infrastructure/repositories/IExpenseReceiptRepository';
import { IExpenseCategoryRepository } from '../../../src/infrastructure/repositories/IExpenseCategoryRepository';
import { IUserRepository } from '../../../src/infrastructure/repositories/IUserRepository';
import { IBudgetRepository } from '../../../src/infrastructure/repositories/IBudgetRepository';
import { IPolicyRuleRepository } from '../../../src/infrastructure/repositories/IPolicyRuleRepository';
import { IAuditLogRepository } from '../../../src/infrastructure/repositories/IAuditLogRepository';
import { INotificationRepository } from '../../../src/infrastructure/repositories/INotificationRepository';
import { IEmailSender } from '../../../src/infrastructure/notifications/IEmailSender';
import { ApprovalWorkflowService } from '../../../src/application/services/ApprovalWorkflowService';
import { User } from '../../../src/domain/entities/User';
import { Expense } from '../../../src/domain/entities/Expense';
import { Email, CPF, Money } from '../../../src/domain/value-objects';
import { UserRole, UserStatus, ExpenseStatus, Currency } from '../../../src/domain/enums';

describe('ExpenseService', () => {
  let expenseService: ExpenseService;
  let mockExpenseRepo: jest.Mocked<IExpenseRepository>;
  let mockItemRepo: jest.Mocked<IExpenseItemRepository>;
  let mockReceiptRepo: jest.Mocked<IExpenseReceiptRepository>;
  let mockCategoryRepo: jest.Mocked<IExpenseCategoryRepository>;
  let mockUserRepo: jest.Mocked<IUserRepository>;
  let mockBudgetRepo: jest.Mocked<IBudgetRepository>;
  let mockPolicyRepo: jest.Mocked<IPolicyRuleRepository>;
  let mockAuditRepo: jest.Mocked<IAuditLogRepository>;
  let mockNotifRepo: jest.Mocked<INotificationRepository>;
  let mockEmailSender: jest.Mocked<IEmailSender>;
  let mockWorkflowService: jest.Mocked<ApprovalWorkflowService>;

  beforeEach(() => {
    mockExpenseRepo = {
      findById: jest.fn(),
      findByCode: jest.fn(),
      findWithDetails: jest.fn(),
      searchExpenses: jest.fn(),
      findPendingApprovalByApprover: jest.fn(),
      findUserDailyExpenses: jest.fn(),
      generateNextCode: jest.fn().mockResolvedValue('EXP-2026-000001'),
      findAll: jest.fn(),
      save: jest.fn().mockImplementation((e) => Promise.resolve(e)),
      update: jest.fn().mockImplementation((e) => Promise.resolve(e)),
      delete: jest.fn(),
      exists: jest.fn(),
    };

    mockItemRepo = {
      findById: jest.fn(),
      findByExpenseId: jest.fn(),
      findByCategoryId: jest.fn(),
      deleteByExpenseId: jest.fn(),
      findAll: jest.fn(),
      save: jest.fn().mockImplementation((i) => Promise.resolve(i)),
      update: jest.fn(),
      delete: jest.fn(),
      exists: jest.fn(),
    };

    mockReceiptRepo = {
      findById: jest.fn(),
      findByExpenseId: jest.fn(),
      findByItemId: jest.fn(),
      findByFileHash: jest.fn(),
      findAll: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      exists: jest.fn(),
    };

    mockCategoryRepo = {
      findById: jest.fn(),
      findByCode: jest.fn(),
      findByType: jest.fn(),
      findActiveCategories: jest.fn().mockResolvedValue([]),
      findAll: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      exists: jest.fn(),
    };

    mockUserRepo = {
      findById: jest.fn(),
      findByEmail: jest.fn(),
      findByCpf: jest.fn(),
      findByDepartment: jest.fn(),
      findByRole: jest.fn(),
      findDirectReports: jest.fn(),
      searchUsers: jest.fn(),
      findAll: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      exists: jest.fn(),
    };

    mockBudgetRepo = {
      findById: jest.fn(),
      findByCostCenterAndPeriod: jest.fn().mockResolvedValue(null),
      findBudgetsByYear: jest.fn(),
      findAll: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      exists: jest.fn(),
    };

    mockPolicyRepo = {
      findById: jest.fn(),
      findByCode: jest.fn(),
      findActiveRules: jest.fn().mockResolvedValue([]),
      findByCategoryType: jest.fn(),
      findByViolationType: jest.fn(),
      findAll: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      exists: jest.fn(),
    };

    mockAuditRepo = {
      findById: jest.fn(),
      searchAuditLogs: jest.fn(),
      findByEntity: jest.fn(),
      findAll: jest.fn(),
      save: jest.fn().mockImplementation((a) => Promise.resolve(a)),
      update: jest.fn(),
      delete: jest.fn(),
      exists: jest.fn(),
    };

    mockNotifRepo = {
      findById: jest.fn(),
      findByUserId: jest.fn(),
      findUnreadByUserId: jest.fn(),
      countUnreadByUserId: jest.fn(),
      markAllAsReadByUserId: jest.fn(),
      findPendingEmailNotifications: jest.fn(),
      findAll: jest.fn(),
      save: jest.fn().mockImplementation((n) => Promise.resolve(n)),
      update: jest.fn(),
      delete: jest.fn(),
      exists: jest.fn(),
    };

    mockEmailSender = {
      sendEmail: jest.fn().mockResolvedValue(true),
    };

    mockWorkflowService = {
      startWorkflow: jest.fn().mockResolvedValue({} as any),
      approve: jest.fn(),
      reject: jest.fn(),
      requestRevision: jest.fn(),
      getWorkflowByExpenseId: jest.fn(),
    } as any;

    expenseService = new ExpenseService(
      mockExpenseRepo,
      mockItemRepo,
      mockReceiptRepo,
      mockCategoryRepo,
      mockUserRepo,
      mockBudgetRepo,
      mockPolicyRepo,
      mockAuditRepo,
      mockNotifRepo,
      mockEmailSender,
      mockWorkflowService
    );
  });

  it('deve criar uma nova despesa no status DRAFT', async () => {
    const user = new User({
      id: 'u-1',
      name: 'João Colaborador',
      email: new Email('joao@empresa.com'),
      passwordHash: 'hash',
      cpf: new CPF('11144477735'),
      role: UserRole.EMPLOYEE,
      departmentId: 'dept-1',
    });

    mockUserRepo.findById.mockResolvedValue(user);

    const result = await expenseService.createExpense('u-1', {
      title: 'Despesa de Viagem',
      description: 'Reunião com parceiros',
      costCenterId: 'cc-1',
    });

    expect(result.title).toBe('Despesa de Viagem');
    expect(result.status).toBe(ExpenseStatus.DRAFT);
    expect(result.code).toBe('EXP-2026-000001');
    expect(mockExpenseRepo.save).toHaveBeenCalled();
  });
});
