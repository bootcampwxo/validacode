import { BaseEntity } from './BaseEntity';
import { Money } from '../value-objects';
import { ValidationError } from '../exceptions';

export interface CostCenterProps {
  id: string;
  code: string;
  name: string;
  description?: string;
  managerId?: string;
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export class CostCenter extends BaseEntity {
  private _code: string;
  private _name: string;
  private _description?: string;
  private _managerId?: string;
  private _isActive: boolean;

  constructor(props: CostCenterProps) {
    super(props.id, props.createdAt, props.updatedAt);
    if (!props.code || props.code.trim().length === 0) {
      throw new ValidationError('Código do centro de custo é obrigatório');
    }
    if (!props.name || props.name.trim().length === 0) {
      throw new ValidationError('Nome do centro de custo é obrigatório');
    }
    this._code = props.code.trim().toUpperCase();
    this._name = props.name.trim();
    this._description = props.description;
    this._managerId = props.managerId;
    this._isActive = props.isActive !== undefined ? props.isActive : true;
  }

  public get code(): string {
    return this._code;
  }

  public get name(): string {
    return this._name;
  }

  public get description(): string | undefined {
    return this._description;
  }

  public get managerId(): string | undefined {
    return this._managerId;
  }

  public get isActive(): boolean {
    return this._isActive;
  }

  public update(name: string, description?: string, managerId?: string): void {
    if (!name || name.trim().length === 0) {
      throw new ValidationError('Nome do centro de custo não pode ser vazio');
    }
    this._name = name.trim();
    this._description = description;
    this._managerId = managerId;
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
      description: this._description,
      managerId: this._managerId,
      isActive: this._isActive,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    };
  }
}
