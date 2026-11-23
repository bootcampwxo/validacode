import { v4 as uuidv4 } from 'uuid';
import { IDepartmentRepository } from '../../infrastructure/repositories/IDepartmentRepository';
import { CreateDepartmentDto, UpdateDepartmentDto, DepartmentResponseDto } from '../dtos/department.dto';
import { Department } from '../../domain/entities/Department';
import { ConflictError, NotFoundError } from '../../domain/exceptions';

export class DepartmentService {
  constructor(private readonly departmentRepository: IDepartmentRepository) {}

  public async createDepartment(dto: CreateDepartmentDto): Promise<DepartmentResponseDto> {
    const existing = await this.departmentRepository.findByCode(dto.code);
    if (existing) {
      throw new ConflictError(`Departamento com o código '${dto.code}' já existe`);
    }

    const department = new Department({
      id: uuidv4(),
      code: dto.code,
      name: dto.name,
      managerId: dto.managerId,
      directorId: dto.directorId,
      costCenterId: dto.costCenterId,
      isActive: true,
    });

    const saved = await this.departmentRepository.save(department);
    return this.mapToResponse(saved);
  }

  public async getDepartmentById(id: string): Promise<DepartmentResponseDto> {
    const dept = await this.departmentRepository.findById(id);
    if (!dept) {
      throw new NotFoundError('Departamento', id);
    }
    return this.mapToResponse(dept);
  }

  public async listActiveDepartments(): Promise<DepartmentResponseDto[]> {
    const departments = await this.departmentRepository.findActiveDepartments();
    return departments.map((d) => this.mapToResponse(d));
  }

  public async updateDepartment(id: string, dto: UpdateDepartmentDto): Promise<DepartmentResponseDto> {
    const dept = await this.departmentRepository.findById(id);
    if (!dept) {
      throw new NotFoundError('Departamento', id);
    }

    if (dto.name !== undefined) {
      dept.update(dto.name, dto.managerId, dto.directorId, dto.costCenterId);
    }
    if (dto.isActive === true) dept.activate();
    if (dto.isActive === false) dept.deactivate();

    const updated = await this.departmentRepository.update(dept);
    return this.mapToResponse(updated);
  }

  private mapToResponse(dept: Department): DepartmentResponseDto {
    return {
      id: dept.id,
      code: dept.code,
      name: dept.name,
      managerId: dept.managerId,
      directorId: dept.directorId,
      costCenterId: dept.costCenterId,
      isActive: dept.isActive,
      createdAt: dept.createdAt,
      updatedAt: dept.updatedAt,
    };
  }
}
