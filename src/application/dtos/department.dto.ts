export interface CreateDepartmentDto {
  code: string;
  name: string;
  managerId?: string;
  directorId?: string;
  costCenterId?: string;
}

export interface UpdateDepartmentDto {
  name?: string;
  managerId?: string;
  directorId?: string;
  costCenterId?: string;
  isActive?: boolean;
}

export interface DepartmentResponseDto {
  id: string;
  code: string;
  name: string;
  managerId?: string;
  directorId?: string;
  costCenterId?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
