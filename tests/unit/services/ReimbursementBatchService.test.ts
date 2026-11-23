import { ReimbursementBatchService } from '../../../src/application/services/ReimbursementBatchService';
import { IReimbursementBatchRepository } from '../../../src/infrastructure/repositories/IReimbursementBatchRepository';
import { IReimbursementPaymentRepository } from '../../../src/infrastructure/repositories/IReimbursementPaymentRepository';
import { IExpenseRepository } from '../../../src/infrastructure/repositories/IExpenseRepository';
import { IUserRepository } from '../../../src/infrastructure/repositories/IUserRepository';
import { IAuditLogRepository } from '../../../src/infrastructure/repositories/IAuditLogRepository';
import { INotificationRepository } from '../../../src/infrastructure/repositories/INotificationRepository';
import { IEmailSender } from '../../../src/infrastructure/notifications/IEmailSender';
import { Expense } from '../../../src/domain/entities/Expense';
import { User } from '../../../src/domain/entities/User';
import { Email, CPF, Money, BankDetails } from '../../../src/domain/value-objects';
import { ExpenseStatus, PaymentMethod, UserRole, PaymentStatus } from '../../../src/domain/enums';

describe('ReimbursementBatchService', () => {
  let batchService: ReimbursementBatchService;
  let mockBatchRepo: jest.Mocked<IReimbursementBatchRepository>;
  let mockPaymentRepo: jest.Mocked<IReimbursementPaymentRepository>;
  let mockExpenseRepo: jest.Mocked<IExpenseRepository>;
  let mockUserRepo: jest.Mocked<IUserRepository>;
  let mockAuditRepo: jest.Mocked<IAuditLogRepository>;
  let mockNotifRepo: jest.Mocked<INotificationRepository>;
  let mockEmailSender: jest.Mocked<IEmailSender>;

  beforeEach(() => {
    mockBatchRepo = {
      findById: jest.fn(),
      findByBatchCode: jest.fn(),
      findPendingBatches: jest.fn(),
      findByStatus: jest.fn(),
      findWithPayments: jest.fn(),
      generateNextBatchCode: jest.fn().mockResolvedValue('BATCH-202611-0001'),
      findAll: jest.fn(),
      save: jest.fn().mockImplementation((b) => Promise.resolve(b)),
      update: jest.fn().mockImplementation((b) => Promise.resolve(b)),
      delete: jest.fn(),
      exists: jest.fn(),
    };

    mockPaymentRepo = {
      findById: jest.fn(),
      findByExpenseId: jest.fn(),
      findByRecipientId: jest.fn(),
      findByBatchId: jest.fn(),
      findByStatus: jest.fn(),
      findAll: jest.fn(),
      save: jest.fn().mockImplementation((p) => Promise.resolve(p)),
      update: jest.fn().mockImplementation((p) => Promise.resolve(p)),
      delete: jest.fn(),
      exists: jest.fn(),
    };

    mockExpenseRepo = {
      findById: jest.fn(),
      findByCode: jest.fn(),
      findWithDetails: jest.fn(),
      searchExpenses: jest.fn(),
      findPendingApprovalByApprover: jest.fn(),
      findUserDailyExpenses: jest.fn(),
      generateNextCode: jest.fn(),
      findAll: jest.fn(),
      save: jest.fn(),
      update: jest.fn().mockImplementation((e) => Promise.resolve(e)),
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

    batchService = new ReimbursementBatchService(
      mockBatchRepo,
      mockPaymentRepo,
      mockExpenseRepo,
      mockUserRepo,
      mockAuditRepo,
      mockNotifRepo,
      mockEmailSender
    );
  });

  it('deve criar um lote de reembolso com despesas aprovadas', async () => {
    const expense = new Expense({
      id: 'exp-1',
      code: 'EXP-001',
      title: 'Despesa Aprovada',
      userId: 'user-1',
      departmentId: 'dept-1',
      costCenterId: 'cc-1',
      status: ExpenseStatus.APPROVED_FOR_PAYMENT,
      totalAmount: Money.fromDecimal(300.0),
    });

    const user = new User({
      id: 'user-1',
      name: 'Beneficiário',
      email: new Email('user@empresa.com'),
      passwordHash: 'hash',
      cpf: new CPF('11144477735'),
      role: UserRole.EMPLOYEE,
      bankDetails: new BankDetails({
        bankCode: '001',
        bankName: 'Banco do Brasil',
        agencyNumber: '1234',
        accountNumber: '99887-6',
        accountType: 'CHECKING',
        pixKey: 'user@empresa.com',
        preferredPaymentMethod: PaymentMethod.PIX,
      }),
    });

    mockExpenseRepo.findWithDetails.mockResolvedValue(expense);
    mockUserRepo.findById.mockResolvedValue(user);

    const batch = await batchService.createBatch(
      {
        description: 'Lote Semanal de Reembolsos',
        expenseIds: ['exp-1'],
      },
      'admin-1'
    );

    expect(batch.batchCode).toBe('BATCH-202611-0001');
    expect(batch.totalExpensesCount).toBe(1);
    expect(batch.status).toBe(PaymentStatus.PENDING);
    expect(mockBatchRepo.save).toHaveBeenCalled();
    expect(mockPaymentRepo.save).toHaveBeenCalled();
  });
});
