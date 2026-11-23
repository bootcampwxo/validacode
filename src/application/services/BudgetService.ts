import { v4 as uuidv4 } from 'uuid';
import { IBudgetRepository } from '../../infrastructure/repositories/IBudgetRepository';
import { ICostCenterRepository } from '../../infrastructure/repositories/ICostCenterRepository';
import { CreateBudgetDto, UpdateBudgetDto, BudgetResponseDto } from '../dtos/budget.dto';
import { Budget } from '../../domain/entities/Budget';
import { Money } from '../../domain/value-objects';
import { Currency } from '../../domain/enums';
import { ConflictError, NotFoundError } from '../../domain/exceptions';

export class BudgetService {
  constructor(
    private readonly budgetRepository: IBudgetRepository,
    private readonly costCenterRepository: ICostCenterRepository
  ) {}

  public async createBudget(dto: CreateBudgetDto): Promise<BudgetResponseDto> {
    const cc = await this.costCenterRepository.findById(dto.costCenterId);
    if (!cc) {
      throw new NotFoundError('Centro de Custo', dto.costCenterId);
    }

    const existing = await this.budgetRepository.findByCostCenterAndPeriod(
      dto.costCenterId,
      dto.year,
      dto.month
    );
    if (existing) {
      throw new ConflictError(
        `Já existe um orçamento cadastrado para este centro de custo no período ${dto.year}${
          dto.month ? `/${dto.month}` : ''
        }`
      );
    }

    const currency = dto.currency || Currency.BRL;
    const budget = new Budget({
      id: uuidv4(),
      costCenterId: dto.costCenterId,
      year: dto.year,
      month: dto.month,
      allocatedAmount: Money.fromDecimal(dto.allocatedAmount, currency),
      alertThresholdPercentage: dto.alertThresholdPercentage || 80,
      isActive: true,
    });

    const saved = await this.budgetRepository.save(budget);
    return this.mapToResponse(saved);
  }

  public async getBudgetById(id: string): Promise<BudgetResponseDto> {
    const budget = await this.budgetRepository.findById(id);
    if (!budget) {
      throw new NotFoundError('Orçamento', id);
    }
    return this.mapToResponse(budget);
  }

  public async getBudgetsByYear(year: number): Promise<BudgetResponseDto[]> {
    const budgets = await this.budgetRepository.findBudgetsByYear(year);
    return budgets.map((b) => this.mapToResponse(b));
  }

  public async getBudgetForCostCenter(
    costCenterId: string,
    year: number,
    month?: number
  ): Promise<BudgetResponseDto | null> {
    const budget = await this.budgetRepository.findByCostCenterAndPeriod(costCenterId, year, month);
    if (!budget) return null;
    return this.mapToResponse(budget);
  }

  private mapToResponse(budget: Budget): BudgetResponseDto {
    return {
      id: budget.id,
      costCenterId: budget.costCenterId,
      year: budget.year,
      month: budget.month,
      allocatedAmount: budget.allocatedAmount.toJSON(),
      consumedAmount: budget.consumedAmount.toJSON(),
      reservedAmount: budget.reservedAmount.toJSON(),
      availableAmount: budget.availableAmount.toJSON(),
      consumptionPercentage: parseFloat(budget.consumptionPercentage.toFixed(2)),
      isThresholdExceeded: budget.isThresholdExceeded(),
      isActive: budget.isActive,
      createdAt: budget.createdAt,
      updatedAt: budget.updatedAt,
    };
  }
}
