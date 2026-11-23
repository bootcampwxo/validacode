export interface CreateCostCenterDto {
  code: string;
  name: string;
  description?: string;
  managerId?: string;
}

export interface UpdateCostCenterDto {
  name?: string;
  description?: string;
  managerId?: string;
  isActive?: boolean;
}

export interface CostCenterResponseDto {
  id: string;
  code: string;
  name: string;
  description?: string;
  managerId?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
