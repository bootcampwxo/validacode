import { BaseEntity } from './BaseEntity';
import { ApprovalStatus } from '../enums';
import { ValidationError } from '../exceptions';

export interface ApprovalActionProps {
  id: string;
  stepId: string;
  workflowId: string;
  expenseId: string;
  actorId: string;
  action: ApprovalStatus;
  comments?: string;
  delegatedFromId?: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export class ApprovalAction extends BaseEntity {
  private _stepId: string;
  private _workflowId: string;
  private _expenseId: string;
  private _actorId: string;
  private _action: ApprovalStatus;
  private _comments?: string;
  private _delegatedFromId?: string;
  private _ipAddress?: string;
  private _userAgent?: string;

  constructor(props: ApprovalActionProps) {
    super(props.id, props.createdAt, props.updatedAt);
    if (!props.actorId) {
      throw new ValidationError('Identificador do autor da ação é obrigatório');
    }
    this._stepId = props.stepId;
    this._workflowId = props.workflowId;
    this._expenseId = props.expenseId;
    this._actorId = props.actorId;
    this._action = props.action;
    this._comments = props.comments;
    this._delegatedFromId = props.delegatedFromId;
    this._ipAddress = props.ipAddress;
    this._userAgent = props.userAgent;
  }

  public get stepId(): string {
    return this._stepId;
  }

  public get workflowId(): string {
    return this._workflowId;
  }

  public get expenseId(): string {
    return this._expenseId;
  }

  public get actorId(): string {
    return this._actorId;
  }

  public get action(): ApprovalStatus {
    return this._action;
  }

  public get comments(): string | undefined {
    return this._comments;
  }

  public get delegatedFromId(): string | undefined {
    return this._delegatedFromId;
  }

  public get ipAddress(): string | undefined {
    return this._ipAddress;
  }

  public get userAgent(): string | undefined {
    return this._userAgent;
  }

  public toJSON(): Record<string, unknown> {
    return {
      id: this._id,
      stepId: this._stepId,
      workflowId: this._workflowId,
      expenseId: this._expenseId,
      actorId: this._actorId,
      action: this._action,
      comments: this._comments,
      delegatedFromId: this._delegatedFromId,
      ipAddress: this._ipAddress,
      userAgent: this._userAgent,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    };
  }
}
