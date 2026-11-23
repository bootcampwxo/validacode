import { v4 as uuidv4 } from 'uuid';
import { ICostCenterRepository } from '../../infrastructure/repositories/ICostCenterRepository';
import { CreateCostCenterDto, UpdateCostCenterDto, CostCenterResponseDto } from '../dtos/cost-center.dto';
import { CostCenter } from '../../domain/entities/CostCenter';
import { ConflictError, NotFoundError } from '../../domain/exceptions';

export class CostCenterService {
  constructor(private readonly costCenterRepository: ICostCenterRepository) {}

  public async createCostCenter(dto: CreateCostCenterDto): Promise<CostCenterResponseDto> {
    const existing = await this.costCenterRepository.findByCode(dto.code);
    if (existing) {
      throw new ConflictError(`Centro de custo com o código '${dto.code}' já existe`);
    }

    const cc = new CostCenter({
      id: uuidv4(),
      code: dto.code,
      name: dto.name,
      description: dto.description,
      managerId: dto.managerId,
      isActive: true,
    });

    const saved = await this.costCenterRepository.save(cc);
    return this.mapToResponse(saved);
  }

  public async getCostCenterById(id: string): Promise<CostCenterResponseDto> {
    const cc = await this.costCenterRepository.findById(id);
    if (!cc) {
      throw new NotFoundError('Centro de Custo', id);
    }
    return this.mapToResponse(cc);
  }

  public async listActiveCostCenters(): Promise<CostCenterResponseDto[]> {
    const list = await this.costCenterRepository.findActiveCostCenters();
    return list.map((cc) => this.mapToResponse(cc));
  }

  public async updateCostCenter(id: string, dto: UpdateCostCenterDto): Promise<CostCenterResponseDto> {
    const cc = await this.costCenterRepository.findById(id);
    if (!cc) {
      throw new NotFoundError('Centro de Custo', id);
    }

    if (dto.name !== undefined) {
      cc.update(dto.name, dto.description, dto.managerId);
    }
    if (dto.isActive === true) cc.activate();
    if (dto.isActive === false) cc.deactivate();

    const updated = await this.costCenterRepository.update(cc);
    return this.mapToResponse(updated);
  }

  private mapToResponse(cc: CostCenter): CostCenterResponseDto {
    return {
      id: cc.id,
      code: cc.code,
      name: cc.name,
      description: cc.description,
      managerId: cc.managerId,
      isActive: cc.isActive,
      createdAt: cc.createdAt,
      updatedAt: cc.updatedAt,
    };
  }
}
