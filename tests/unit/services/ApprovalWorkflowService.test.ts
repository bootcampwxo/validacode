import { ApprovalWorkflowService } from '../../../src/application/services/ApprovalWorkflowService';
import { IApprovalWorkflowRepository } from '../../../src/infrastructure/repositories/IApprovalWorkflowRepository';
import { IExpenseRepository } from '../../../src/infrastructure/repositories/IExpenseRepository';
import { IUserRepository } from '../../../src/infrastructure/repositories/IUserRepository';
import { IDepartmentRepository } from '../../../src/infrastructure/repositories/IDepartmentRepository';
import { IAuditLogRepository } from '../../../src/infrastructure/repositories/IAuditLogRepository';
import { INotificationRepository } from '../../../src/infrastructure/repositories/INotificationRepository';
import { IEmailSender } from '../../../src/infrastructure/notifications/IEmailSender';
import { Expense } from '../../../src/domain/entities/Expense';
import { User } from '../../../src/domain/entities/User';
import { Department } from '../../../src/domain/entities/Department';
import { ApprovalWorkflow } from '../../../src/domain/entities/ApprovalWorkflow';
import { ApprovalStep } from '../../../src/domain/entities/ApprovalStep';
import { Email, CPF, Money } from '../../../src/domain/value-objects';
import { UserRole, ApprovalLevel, ApprovalStatus } from '../../../src/domain/enums';

describe('ApprovalWorkflowService', () => {
  let workflowService: ApprovalWorkflowService;
  let mockWfRepo: jest.Mocked<IApprovalWorkflowRepository>;
  let mockExpenseRepo: jest.Mocked<IExpenseRepository>;
  let mockUserRepo: jest.Mocked<IUserRepository>;
  let mockDeptRepo: jest.Mocked<IDepartmentRepository>;
  let mockAuditRepo: jest.Mocked<IAuditLogRepository>;
  let mockNotifRepo: jest.Mocked<INotificationRepository>;
  let mockEmailSender: jest.Mocked<IEmailSender>;

  beforeEach(() => {
    mockWfRepo = {
      findById: jest.fn(),
      findByExpenseId: jest.fn(),
      findPendingStepsByApprover: jest.fn(),
      saveStep: jest.fn(),
      updateStep: jest.fn(),
      recordAction: jest.fn(),
      getActionsByExpenseId: jest.fn(),
      findAll: jest.fn(),
      save: jest.fn().mockImplementation((wf) => Promise.resolve(wf)),
      update: jest.fn().mockImplementation((wf) => Promise.resolve(wf)),
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

    mockDeptRepo = {
      findById: jest.fn(),
      findByCode: jest.fn(),
      findActiveDepartments: jest.fn(),
      findByCostCenter: jest.fn(),
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

    workflowService = new ApprovalWorkflowService(
      mockWfRepo,
      mockExpenseRepo,
      mockUserRepo,
      mockDeptRepo,
      mockAuditRepo,
      mockNotifRepo,
      mockEmailSender
    );
  });

  it('deve inicializar o fluxo de aprovação com níveis proporcionais ao valor', async () => {
    const expense = new Expense({
      id: 'exp-1',
      code: 'EXP-001',
      title: 'Despesa Alto Valor',
      userId: 'user-1',
      departmentId: 'dept-1',
      costCenterId: 'cc-1',
      totalAmount: Money.fromDecimal(8000.0), // Acima de R$ 5.000 exige Diretor
    });

    const user = new User({
      id: 'user-1',
      name: 'Colaborador',
      email: new Email('colab@empresa.com'),
      passwordHash: 'hash',
      cpf: new CPF('11144477735'),
      role: UserRole.EMPLOYEE,
      managerId: 'manager-1',
    });

    const dept = new Department({
      id: 'dept-1',
      code: 'DEP-ENG',
      name: 'Engenharia',
      managerId: 'manager-1',
      directorId: 'director-1',
    });

    mockUserRepo.findById.mockResolvedValue(user);
    mockDeptRepo.findById.mockResolvedValue(dept);

    const wf = await workflowService.startWorkflow(expense);

    expect(wf.totalSteps).toBe(3); // Gestor, Diretor, Financeiro
    expect(mockWfRepo.save).toHaveBeenCalled();
  });
});
