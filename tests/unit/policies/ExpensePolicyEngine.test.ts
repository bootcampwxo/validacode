import { ExpensePolicyEngine } from '../../../src/domain/policies/ExpensePolicyEngine';
import { Expense } from '../../../src/domain/entities/Expense';
import { ExpenseItem } from '../../../src/domain/entities/ExpenseItem';
import { ExpenseReceipt } from '../../../src/domain/entities/ExpenseReceipt';
import { ExpenseCategory } from '../../../src/domain/entities/ExpenseCategory';
import { Budget } from '../../../src/domain/entities/Budget';
import { CategoryType, ExpenseStatus, Currency, PolicyViolationType } from '../../../src/domain/enums';
import { Money } from '../../../src/domain/value-objects/Money';

describe('ExpensePolicyEngine', () => {
  let engine: ExpensePolicyEngine;
  let categories: Map<string, ExpenseCategory>;

  beforeEach(() => {
    engine = new ExpensePolicyEngine();
    categories = new Map();

    const catMeals = new ExpenseCategory({
      id: 'cat-meals',
      code: 'CAT-MEALS',
      name: 'Refeições',
      type: CategoryType.MEALS,
      maxLimitPerExpense: Money.fromDecimal(100.0),
      maxDailyLimit: Money.fromDecimal(200.0),
      requiresReceipt: true,
      requiresItemization: false,
      requiresJustification: false,
    });

    categories.set(catMeals.id, catMeals);
  });

  it('deve identificar violação de comprovante ausente quando a categoria exige', async () => {
    const expense = new Expense({
      id: 'exp-1',
      code: 'EXP-001',
      title: 'Almoço SP',
      userId: 'user-1',
      departmentId: 'dep-1',
      costCenterId: 'cc-1',
    });

    const item = new ExpenseItem({
      id: 'item-1',
      expenseId: expense.id,
      categoryId: 'cat-meals',
      description: 'Almoço',
      amount: Money.fromDecimal(50.0),
      expenseDate: new Date(),
    });
    expense.addItem(item);

    const result = await engine.evaluate({
      expense,
      categories,
      policyRules: [],
    });

    expect(result.isValid).toBe(false);
    expect(result.hasBlockingViolations).toBe(true);
    expect(result.blockingViolations.some((v) => v.violationType === PolicyViolationType.RECEIPT_MISSING)).toBe(true);
  });

  it('deve aprovar quando o comprovante estiver anexado e limites respeitados', async () => {
    const expense = new Expense({
      id: 'exp-1',
      code: 'EXP-001',
      title: 'Almoço SP',
      userId: 'user-1',
      departmentId: 'dep-1',
      costCenterId: 'cc-1',
    });

    const item = new ExpenseItem({
      id: 'item-1',
      expenseId: expense.id,
      categoryId: 'cat-meals',
      description: 'Almoço comercial',
      amount: Money.fromDecimal(50.0),
      expenseDate: new Date('2026-11-20'), // Dia útil (sexta)
    });
    expense.addItem(item);

    const receipt = new ExpenseReceipt({
      id: 'rec-1',
      expenseId: expense.id,
      expenseItemId: item.id,
      originalFileName: 'nf.pdf',
      storedFileName: 'stored_nf.pdf',
      filePath: '/tmp/nf.pdf',
      fileSize: 1024,
      mimeType: 'application/pdf',
      fileHash: 'sha256hash123',
      uploadedById: 'user-1',
    });
    expense.addReceipt(receipt);

    const budget = new Budget({
      id: 'bdg-1',
      costCenterId: 'cc-1',
      year: 2026,
      allocatedAmount: Money.fromDecimal(1000.0),
    });

    const result = await engine.evaluate({
      expense,
      categories,
      policyRules: [],
      budget,
    });

    expect(result.isValid).toBe(true);
    expect(result.hasBlockingViolations).toBe(false);
  });

  it('deve bloquear despesa que contém bebida alcoólica', async () => {
    const expense = new Expense({
      id: 'exp-1',
      code: 'EXP-001',
      title: 'Jantar SP',
      userId: 'user-1',
      departmentId: 'dep-1',
      costCenterId: 'cc-1',
    });

    const item = new ExpenseItem({
      id: 'item-1',
      expenseId: expense.id,
      categoryId: 'cat-meals',
      description: 'Jantar com chope artesanal',
      amount: Money.fromDecimal(80.0),
      expenseDate: new Date(),
    });
    expense.addItem(item);

    const result = await engine.evaluate({
      expense,
      categories,
      policyRules: [],
    });

    expect(result.hasBlockingViolations).toBe(true);
    expect(result.blockingViolations.some((v) => v.violationType === PolicyViolationType.ALCOHOL_NOT_PERMITTED)).toBe(true);
  });
});
