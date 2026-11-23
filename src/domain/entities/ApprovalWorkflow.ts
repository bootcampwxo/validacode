import { BaseEntity } from './BaseEntity';
import { ApprovalStatus } from '../enums';
import { ApprovalStep } from './ApprovalStep';
import { ValidationError, BusinessRuleViolationError } from '../exceptions';

export interface ApprovalWorkflowProps {
  id: string;
  expenseId: string;
  status?: ApprovalStatus;
  currentStepOrder?: number;
  totalSteps?: number;
  steps?: ApprovalStep[];
  startedAt?: Date;
  completedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export class ApprovalWorkflow extends BaseEntity {
  private _expenseId: string;
  private _status: ApprovalStatus;
  private _currentStepOrder: number;
  private _totalSteps: number;
  private _steps: ApprovalStep[];
  private _startedAt: Date;
  private _completedAt?: Date;

  constructor(props: ApprovalWorkflowProps) {
    super(props.id, props.createdAt, props.updatedAt);
    if (!props.expenseId) {
      throw new ValidationError('ID da despesa é obrigatório para inicializar o fluxo de aprovação');
    }

    this._expenseId = props.expenseId;
    this._status = props.status || ApprovalStatus.PENDING;
    this._currentStepOrder = props.currentStepOrder || 1;
    this._steps = props.steps || [];
    this._totalSteps = props.totalSteps || this._steps.length || 1;
    this._startedAt = props.startedAt || new Date();
    this._completedAt = props.completedAt;
  }

  public get expenseId(): string {
    return this._expenseId;
  }

  public get status(): ApprovalStatus {
    return this._status;
  }

  public get currentStepOrder(): number {
    return this._currentStepOrder;
  }

  public get totalSteps(): number {
    return this._totalSteps;
  }

  public get steps(): ApprovalStep[] {
    return [...this._steps].sort((a, b) => a.stepOrder - b.stepOrder);
  }

  public get startedAt(): Date {
    return new Date(this._startedAt.getTime());
  }

  public get completedAt(): Date | undefined {
    return this._completedAt;
  }

  public getCurrentStep(): ApprovalStep | undefined {
    return this._steps.find((s) => s.stepOrder === this._currentStepOrder);
  }

  public addStep(step: ApprovalStep): void {
    this._steps.push(step);
    this._totalSteps = this._steps.length;
    this.touch();
  }

  public proceedToNextStep(): boolean {
    const nextStepOrder = this._currentStepOrder + 1;
    const nextStep = this._steps.find((s) => s.stepOrder === nextStepOrder);

    if (nextStep) {
      this._currentStepOrder = nextStepOrder;
      this.touch();
      return true;
    } else {
      this._status = ApprovalStatus.APPROVED;
      this._completedAt = new Date();
      this.touch();
      return false;
    }
  }

  public rejectWorkflow(): void {
    this._status = ApprovalStatus.REJECTED;
    this._completedAt = new Date();
    this.touch();
  }

  public requestRevisionWorkflow(): void {
    this._status = ApprovalStatus.RETURNED_FOR_REVISION;
    this._completedAt = new Date();
    this.touch();
  }

  public isComplete(): boolean {
    return this._status === ApprovalStatus.APPROVED || this._status === ApprovalStatus.REJECTED;
  }

  public toJSON(): Record<string, unknown> {
    return {
      id: this._id,
      expenseId: this._expenseId,
      status: this._status,
      currentStepOrder: this._currentStepOrder,
      totalSteps: this._totalSteps,
      steps: this.steps.map((s) => s.toJSON()),
      startedAt: this._startedAt,
      completedAt: this._completedAt,
      isComplete: this.isComplete(),
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    };
  }
}
