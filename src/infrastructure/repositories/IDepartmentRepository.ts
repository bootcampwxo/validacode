import { Department } from '../../domain/entities/Department';
import { IBaseRepository } from './IBaseRepository';

export interface IDepartmentRepository extends IBaseRepository<Department> {
  findByCode(code: string): Promise<Department | null>;
  findActiveDepartments(): Promise<Department[]>;
  findByCostCenter(costCenterId: string): Promise<Department[]>;
}
