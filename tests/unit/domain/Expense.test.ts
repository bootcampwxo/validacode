import { Expense } from '../../../src/domain/entities/Expense';
import { ExpenseItem } from '../../../src/domain/entities/ExpenseItem';
import { ExpenseStatus, Currency } from '../../../src/domain/enums';
import { Money } from '../../../src/domain/value-objects/Money';
import { BusinessRuleViolationError } from '../../../src/domain/exceptions';

describe('Expense Entity', () => {
  const createMockExpense = () => {
    return new Expense({
      id: 'exp-1',
      code: 'EXP-2026-000001',
      title: 'Viagem de Negócios SP',
      userId: 'user-1',
      departmentId: 'dept-1',
      costCenterId: 'cc-1',
      status: ExpenseStatus.DRAFT,
      currency: Currency.BRL,
    });
  };

  it('deve adicionar item e recalcular o total da despesa automaticamente', () => {
    const expense = createMockExpense();

    const item1 = new ExpenseItem({
      id: 'item-1',
      expenseId: expense.id,
      categoryId: 'cat-1',
      description: 'Almoço executivo',
      amount: Money.fromDecimal(45.5),
      expenseDate: new Date(),
    });

    const item2 = new ExpenseItem({
      id: 'item-2',
      expenseId: expense.id,
      categoryId: 'cat-2',
      description: 'Uber Aeroporto',
      amount: Money.fromDecimal(80.0),
      expenseDate: new Date(),
    });

    expense.addItem(item1);
    expense.addItem(item2);

    expect(expense.items.length).toBe(2);
    expect(expense.totalAmount.decimalValue).toBe(125.5);
    expect(expense.reimbursableAmount.decimalValue).toBe(125.5);
  });

  it('deve impedir a submissão de despesa sem itens', () => {
    const expense = createMockExpense();
    expect(() => expense.submit()).toThrow(BusinessRuleViolationError);
  });

  it('deve submeter com sucesso quando houver itens e valor positivo', () => {
    const expense = createMockExpense();
    const item = new ExpenseItem({
      id: 'item-1',
      expenseId: expense.id,
      categoryId: 'cat-1',
      description: 'Hospedagem',
      amount: Money.fromDecimal(350.0),
      expenseDate: new Date(),
    });
    expense.addItem(item);

    expense.submit();

    expect(expense.status).toBe(ExpenseStatus.SUBMITTED);
    expect(expense.submittedAt).toBeDefined();
  });

  it('deve bloquear alterações em despesa já submetida/aprovada', () => {
    const expense = createMockExpense();
    const item = new ExpenseItem({
      id: 'item-1',
      expenseId: expense.id,
      categoryId: 'cat-1',
      description: 'Almoço',
      amount: Money.fromDecimal(50.0),
      expenseDate: new Date(),
    });
    expense.addItem(item);
    expense.submit();

    const newItem = new ExpenseItem({
      id: 'item-2',
      expenseId: expense.id,
      categoryId: 'cat-2',
      description: 'Novo item',
      amount: Money.fromDecimal(20.0),
      expenseDate: new Date(),
    });

    expect(() => expense.addItem(newItem)).toThrow(BusinessRuleViolationError);
  });
});
