import { BaseEntity } from './BaseEntity';
import { AuditAction } from '../enums';
import { ValidationError } from '../exceptions';

export interface AuditLogProps {
  id: string;
  userId?: string;
  userEmail?: string;
  action: AuditAction;
  entityName: string;
  entityId?: string;
  oldValues?: Record<string, unknown>;
  newValues?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
  createdAt?: Date;
}

export class AuditLog extends BaseEntity {
  private _userId?: string;
  private _userEmail?: string;
  private _action: AuditAction;
  private _entityName: string;
  private _entityId?: string;
  private _oldValues?: Record<string, unknown>;
  private _newValues?: Record<string, unknown>;
  private _ipAddress?: string;
  private _userAgent?: string;
  private _metadata: Record<string, unknown>;

  constructor(props: AuditLogProps) {
    super(props.id, props.createdAt);
    if (!props.action) {
      throw new ValidationError('Ação de auditoria é obrigatória');
    }
    if (!props.entityName) {
      throw new ValidationError('Nome da entidade auditada é obrigatório');
    }

    this._userId = props.userId;
    this._userEmail = props.userEmail;
    this._action = props.action;
    this._entityName = props.entityName;
    this._entityId = props.entityId;
    this._oldValues = props.oldValues;
    this._newValues = props.newValues;
    this._ipAddress = props.ipAddress;
    this._userAgent = props.userAgent;
    this._metadata = props.metadata || {};
  }

  public get userId(): string | undefined {
    return this._userId;
  }

  public get userEmail(): string | undefined {
    return this._userEmail;
  }

  public get action(): AuditAction {
    return this._action;
  }

  public get entityName(): string {
    return this._entityName;
  }

  public get entityId(): string | undefined {
    return this._entityId;
  }

  public get oldValues(): Record<string, unknown> | undefined {
    return this._oldValues;
  }

  public get newValues(): Record<string, unknown> | undefined {
    return this._newValues;
  }

  public get ipAddress(): string | undefined {
    return this._ipAddress;
  }

  public get userAgent(): string | undefined {
    return this._userAgent;
  }

  public get metadata(): Record<string, unknown> {
    return { ...this._metadata };
  }

  public toJSON(): Record<string, unknown> {
    return {
      id: this._id,
      userId: this._userId,
      userEmail: this._userEmail,
      action: this._action,
      entityName: this._entityName,
      entityId: this._entityId,
      oldValues: this._oldValues,
      newValues: this._newValues,
      ipAddress: this._ipAddress,
      userAgent: this._userAgent,
      metadata: this._metadata,
      createdAt: this._createdAt,
    };
  }
}
