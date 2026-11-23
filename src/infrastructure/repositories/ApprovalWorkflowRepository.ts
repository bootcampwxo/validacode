import { BasePostgresRepository } from './BasePostgresRepository';
import { IApprovalWorkflowRepository } from './IApprovalWorkflowRepository';
import { ApprovalWorkflow } from '../../domain/entities/ApprovalWorkflow';
import { ApprovalStep } from '../../domain/entities/ApprovalStep';
import { ApprovalAction } from '../../domain/entities/ApprovalAction';
import { ApprovalLevel, ApprovalStatus } from '../../domain/enums';
import { Money } from '../../domain/value-objects';

export class ApprovalWorkflowRepository
  extends BasePostgresRepository<ApprovalWorkflow>
  implements IApprovalWorkflowRepository
{
  protected readonly tableName = 'approval_workflows';

  protected mapToEntity(row: any, steps: ApprovalStep[] = []): ApprovalWorkflow {
    return new ApprovalWorkflow({
      id: row.id,
      expenseId: row.expense_id,
      status: row.status as ApprovalStatus,
      currentStepOrder: row.current_step_order,
      totalSteps: row.total_steps,
      steps,
      startedAt: new Date(row.started_at),
      completedAt: row.completed_at ? new Date(row.completed_at) : undefined,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    });
  }

  protected mapToRow(entity: ApprovalWorkflow): Record<string, any> {
    return {
      id: entity.id,
      expense_id: entity.expenseId,
      status: entity.status,
      current_step_order: entity.currentStepOrder,
      total_steps: entity.totalSteps,
      started_at: entity.startedAt,
      completed_at: entity.completedAt || null,
      created_at: entity.createdAt,
      updated_at: entity.updatedAt,
    };
  }

  public async findByExpenseId(expenseId: string): Promise<ApprovalWorkflow | null> {
    const wfRes = await this.db.query(`SELECT * FROM ${this.tableName} WHERE expense_id = $1 LIMIT 1`, [
      expenseId,
    ]);
    if (wfRes.rows.length === 0) return null;

    const stepsRes = await this.db.query(
      `SELECT * FROM approval_steps WHERE workflow_id = $1 ORDER BY step_order ASC`,
      [wfRes.rows[0].id]
    );

    const steps = stepsRes.rows.map((row) => {
      return new ApprovalStep({
        id: row.id,
        workflowId: row.workflow_id,
        stepOrder: row.step_order,
        level: row.level as ApprovalLevel,
        approverId: row.approver_id,
        approverRoleId: row.approver_role_id,
        status: row.status as ApprovalStatus,
        thresholdAmount: row.threshold_amount_cents
          ? Money.fromCents(parseInt(row.threshold_amount_cents, 10))
          : undefined,
        assignedAt: row.assigned_at ? new Date(row.assigned_at) : undefined,
        decidedAt: row.decided_at ? new Date(row.decided_at) : undefined,
        comments: row.comments,
        isAutoApproved: row.is_auto_approved,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
      });
    });

    return this.mapToEntity(wfRes.rows[0], steps);
  }

  public async findPendingStepsByApprover(approverId: string): Promise<ApprovalStep[]> {
    const sql = `
      SELECT ast.*
      FROM approval_steps ast
      JOIN approval_workflows aw ON aw.id = ast.workflow_id
      WHERE ast.approver_id = $1
        AND ast.status = 'PENDING'
        AND ast.step_order = aw.current_step_order
        AND aw.status = 'PENDING'
      ORDER BY ast.created_at ASC
    `;
    const result = await this.db.query(sql, [approverId]);
    return result.rows.map((row) => {
      return new ApprovalStep({
        id: row.id,
        workflowId: row.workflow_id,
        stepOrder: row.step_order,
        level: row.level as ApprovalLevel,
        approverId: row.approver_id,
        approverRoleId: row.approver_role_id,
        status: row.status as ApprovalStatus,
        thresholdAmount: row.threshold_amount_cents
          ? Money.fromCents(parseInt(row.threshold_amount_cents, 10))
          : undefined,
        assignedAt: row.assigned_at ? new Date(row.assigned_at) : undefined,
        decidedAt: row.decided_at ? new Date(row.decided_at) : undefined,
        comments: row.comments,
        isAutoApproved: row.is_auto_approved,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
      });
    });
  }

  public async save(entity: ApprovalWorkflow): Promise<ApprovalWorkflow> {
    const row = this.mapToRow(entity);
    const sql = `
      INSERT INTO ${this.tableName} (
        id, expense_id, status, current_step_order, total_steps,
        started_at, completed_at, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *;
    `;
    const params = [
      row.id,
      row.expense_id,
      row.status,
      row.current_step_order,
      row.total_steps,
      row.started_at,
      row.completed_at,
      row.created_at,
      row.updated_at,
    ];
    const result = await this.db.query(sql, params);

    for (const step of entity.steps) {
      await this.saveStep(step);
    }

    return this.mapToEntity(result.rows[0], entity.steps);
  }

  public async update(entity: ApprovalWorkflow): Promise<ApprovalWorkflow> {
    const row = this.mapToRow(entity);
    const sql = `
      UPDATE ${this.tableName} SET
        status = $2,
        current_step_order = $3,
        total_steps = $4,
        completed_at = $5,
        updated_at = $6
      WHERE id = $1
      RETURNING *;
    `;
    const params = [
      row.id,
      row.status,
      row.current_step_order,
      row.total_steps,
      row.completed_at,
      row.updated_at,
    ];
    const result = await this.db.query(sql, params);

    for (const step of entity.steps) {
      await this.updateStep(step);
    }

    return this.mapToEntity(result.rows[0], entity.steps);
  }

  public async saveStep(step: ApprovalStep): Promise<ApprovalStep> {
    const sql = `
      INSERT INTO approval_steps (
        id, workflow_id, step_order, level, approver_id,
        approver_role_id, status, threshold_amount_cents,
        assigned_at, decided_at, comments, is_auto_approved,
        created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      ON CONFLICT (workflow_id, step_order) DO UPDATE SET
        status = EXCLUDED.status,
        approver_id = EXCLUDED.approver_id,
        decided_at = EXCLUDED.decided_at,
        comments = EXCLUDED.comments,
        is_auto_approved = EXCLUDED.is_auto_approved,
        updated_at = EXCLUDED.updated_at
      RETURNING *;
    `;
    const params = [
      step.id,
      step.workflowId,
      step.stepOrder,
      step.level,
      step.approverId || null,
      step.approverRoleId || null,
      step.status,
      step.thresholdAmount ? step.thresholdAmount.amountInCents : null,
      step.assignedAt || null,
      step.decidedAt || null,
      step.comments || null,
      step.isAutoApproved,
      step.createdAt,
      step.updatedAt,
    ];
    await this.db.query(sql, params);
    return step;
  }

  public async updateStep(step: ApprovalStep): Promise<ApprovalStep> {
    const sql = `
      UPDATE approval_steps SET
        status = $2,
        approver_id = $3,
        decided_at = $4,
        comments = $5,
        is_auto_approved = $6,
        updated_at = $7
      WHERE id = $1
      RETURNING *;
    `;
    const params = [
      step.id,
      step.status,
      step.approverId || null,
      step.decidedAt || null,
      step.comments || null,
      step.isAutoApproved,
      step.updatedAt,
    ];
    await this.db.query(sql, params);
    return step;
  }

  public async recordAction(action: ApprovalAction): Promise<ApprovalAction> {
    const sql = `
      INSERT INTO approval_actions (
        id, step_id, workflow_id, expense_id, actor_id,
        action, comments, delegated_from_id, ip_address, user_agent,
        created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *;
    `;
    const params = [
      action.id,
      action.stepId,
      action.workflowId,
      action.expenseId,
      action.actorId,
      action.action,
      action.comments || null,
      action.delegatedFromId || null,
      action.ipAddress || null,
      action.userAgent || null,
      action.createdAt,
      action.updatedAt,
    ];
    await this.db.query(sql, params);
    return action;
  }

  public async getActionsByExpenseId(expenseId: string): Promise<ApprovalAction[]> {
    const sql = `SELECT * FROM approval_actions WHERE expense_id = $1 ORDER BY created_at ASC`;
    const result = await this.db.query(sql, [expenseId]);
    return result.rows.map((row) => {
      return new ApprovalAction({
        id: row.id,
        stepId: row.step_id,
        workflowId: row.workflow_id,
        expenseId: row.expense_id,
        actorId: row.actor_id,
        action: row.action as ApprovalStatus,
        comments: row.comments,
        delegatedFromId: row.delegated_from_id,
        ipAddress: row.ip_address,
        userAgent: row.user_agent,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
      });
    });
  }
}
