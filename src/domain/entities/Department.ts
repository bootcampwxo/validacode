import { BaseEntity } from './BaseEntity';
import { ValidationError } from '../exceptions';

export interface DepartmentProps {
  id: string;
  code: string;
  name: string;
  managerId?: string;
  directorId?: string;
  costCenterId?: string;
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Department extends BaseEntity {
  private _code: string;
  private _name: string;
  private _managerId?: string;
  private _directorId?: string;
  private _costCenterId?: string;
  private _isActive: boolean;

  constructor(props: DepartmentProps) {
    super(props.id, props.createdAt, props.updatedAt);
    if (!props.code || props.code.trim().length === 0) {
      throw new ValidationError('Código do departamento é obrigatório');
    }
    if (!props.name || props.name.trim().length === 0) {
      throw new ValidationError('Nome do departamento é obrigatório');
    }
    this._code = props.code.trim().toUpperCase();
    this._name = props.name.trim();
    this._managerId = props.managerId;
    this._directorId = props.directorId;
    this._costCenterId = props.costCenterId;
    this._isActive = props.isActive !== undefined ? props.isActive : true;
  }

  public get code(): string {
    return this._code;
  }

  public get name(): string {
    return this._name;
  }

  public get managerId(): string | undefined {
    return this._managerId;
  }

  public get directorId(): string | undefined {
    return this._directorId;
  }

  public get costCenterId(): string | undefined {
    return this._costCenterId;
  }

  public get isActive(): boolean {
    return this._isActive;
  }

  public update(name: string, managerId?: string, directorId?: string, costCenterId?: string): void {
    if (!name || name.trim().length === 0) {
      throw new ValidationError('Nome do departamento não pode ser vazio');
    }
    this._name = name.trim();
    this._managerId = managerId;
    this._directorId = directorId;
    this._costCenterId = costCenterId;
    this.touch();
  }

  public activate(): void {
    this._isActive = true;
    this.touch();
  }

  public deactivate(): void {
    this._isActive = false;
    this.touch();
  }

  public toJSON(): Record<string, unknown> {
    return {
      id: this._id,
      code: this._code,
      name: this._name,
      managerId: this._managerId,
      directorId: this._directorId,
      costCenterId: this._costCenterId,
      isActive: this._isActive,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    };
  }
}
