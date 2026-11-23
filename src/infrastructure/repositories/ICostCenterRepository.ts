import { CostCenter } from '../../domain/entities/CostCenter';
import { IBaseRepository } from './IBaseRepository';

export interface ICostCenterRepository extends IBaseRepository<CostCenter> {
  findByCode(code: string): Promise<CostCenter | null>;
  findActiveCostCenters(): Promise<CostCenter[]>;
}
