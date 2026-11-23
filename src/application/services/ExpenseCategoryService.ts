import { v4 as uuidv4 } from 'uuid';
import { IExpenseCategoryRepository } from '../../infrastructure/repositories/IExpenseCategoryRepository';
import {
  CreateExpenseCategoryDto,
  UpdateExpenseCategoryDto,
  ExpenseCategoryResponseDto,
} from '../dtos/expense-category.dto';
import { ExpenseCategory } from '../../domain/entities/ExpenseCategory';
import { Money } from '../../domain/value-objects';
import { ConflictError, NotFoundError } from '../../domain/exceptions';

export class ExpenseCategoryService {
  constructor(private readonly categoryRepository: IExpenseCategoryRepository) {}

  public async createCategory(dto: CreateExpenseCategoryDto): Promise<ExpenseCategoryResponseDto> {
    const existing = await this.categoryRepository.findByCode(dto.code);
    if (existing) {
      throw new ConflictError(`Categoria com código '${dto.code}' já cadastrada`);
    }

    const category = new ExpenseCategory({
      id: uuidv4(),
      code: dto.code,
      name: dto.name,
      type: dto.type,
      description: dto.description,
      maxLimitPerExpense: dto.maxLimitPerExpense
        ? Money.fromDecimal(dto.maxLimitPerExpense)
        : undefined,
      maxDailyLimit: dto.maxDailyLimit ? Money.fromDecimal(dto.maxDailyLimit) : undefined,
      requiresReceipt: dto.requiresReceipt !== undefined ? dto.requiresReceipt : true,
      requiresItemization: dto.requiresItemization || false,
      requiresJustification: dto.requiresJustification || false,
      mileageRatePerKm: dto.mileageRatePerKm,
      isActive: true,
    });

    const saved = await this.categoryRepository.save(category);
    return this.mapToResponse(saved);
  }

  public async getCategoryById(id: string): Promise<ExpenseCategoryResponseDto> {
    const cat = await this.categoryRepository.findById(id);
    if (!cat) {
      throw new NotFoundError('Categoria de Despesa', id);
    }
    return this.mapToResponse(cat);
  }

  public async listActiveCategories(): Promise<ExpenseCategoryResponseDto[]> {
    const list = await this.categoryRepository.findActiveCategories();
    return list.map((c) => this.mapToResponse(c));
  }

  public async updateCategory(
    id: string,
    dto: UpdateExpenseCategoryDto
  ): Promise<ExpenseCategoryResponseDto> {
    const cat = await this.categoryRepository.findById(id);
    if (!cat) {
      throw new NotFoundError('Categoria de Despesa', id);
    }

    cat.update({
      name: dto.name,
      type: dto.type,
      description: dto.description,
      maxLimitPerExpense: dto.maxLimitPerExpense
        ? Money.fromDecimal(dto.maxLimitPerExpense)
        : undefined,
      maxDailyLimit: dto.maxDailyLimit ? Money.fromDecimal(dto.maxDailyLimit) : undefined,
      requiresReceipt: dto.requiresReceipt,
      requiresItemization: dto.requiresItemization,
      requiresJustification: dto.requiresJustification,
      mileageRatePerKm: dto.mileageRatePerKm,
      isActive: dto.isActive,
    });

    const updated = await this.categoryRepository.update(cat);
    return this.mapToResponse(updated);
  }

  private mapToResponse(c: ExpenseCategory): ExpenseCategoryResponseDto {
    return {
      id: c.id,
      code: c.code,
      name: c.name,
      type: c.type,
      description: c.description,
      maxLimitPerExpense: c.maxLimitPerExpense ? c.maxLimitPerExpense.toJSON() : null,
      maxDailyLimit: c.maxDailyLimit ? c.maxDailyLimit.toJSON() : null,
      requiresReceipt: c.requiresReceipt,
      requiresItemization: c.requiresItemization,
      requiresJustification: c.requiresJustification,
      mileageRatePerKm: c.mileageRatePerKm,
      isActive: c.isActive,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    };
  }
}
