-- Migration 008: Workflows de Aprovação Multinível e Ações
CREATE TABLE IF NOT EXISTS approval_workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_id UUID NOT NULL UNIQUE REFERENCES expenses(id) ON DELETE CASCADE,
  status approval_status_enum NOT NULL DEFAULT 'PENDING',
  current_step_order INT NOT NULL DEFAULT 1,
  total_steps INT NOT NULL DEFAULT 1,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS approval_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID NOT NULL REFERENCES approval_workflows(id) ON DELETE CASCADE,
  step_order INT NOT NULL,
  level approval_level_enum NOT NULL,
  approver_id UUID REFERENCES users(id) ON DELETE SET NULL,
  approver_role_id VARCHAR(50),
  status approval_status_enum NOT NULL DEFAULT 'PENDING',
  threshold_amount_cents BIGINT,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  decided_at TIMESTAMP WITH TIME ZONE,
  comments TEXT,
  is_auto_approved BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT uq_workflow_step UNIQUE (workflow_id, step_order)
);

CREATE TABLE IF NOT EXISTS approval_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  step_id UUID NOT NULL REFERENCES approval_steps(id) ON DELETE CASCADE,
  workflow_id UUID NOT NULL REFERENCES approval_workflows(id) ON DELETE CASCADE,
  expense_id UUID NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
  actor_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  action approval_status_enum NOT NULL,
  comments TEXT,
  delegated_from_id UUID REFERENCES users(id) ON DELETE SET NULL,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_workflow_expense ON approval_workflows(expense_id);
CREATE INDEX IF NOT EXISTS idx_workflow_status ON approval_workflows(status);
CREATE INDEX IF NOT EXISTS idx_steps_workflow ON approval_steps(workflow_id);
CREATE INDEX IF NOT EXISTS idx_steps_approver ON approval_steps(approver_id);
CREATE INDEX IF NOT EXISTS idx_actions_expense ON approval_actions(expense_id);
CREATE INDEX IF NOT EXISTS idx_actions_actor ON approval_actions(actor_id);
