-- Migration 004: Orçamentos por Centro de Custo
CREATE TABLE IF NOT EXISTS budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cost_center_id UUID NOT NULL REFERENCES cost_centers(id) ON DELETE CASCADE,
  year INT NOT NULL,
  month INT,
  allocated_amount_cents BIGINT NOT NULL,
  consumed_amount_cents BIGINT NOT NULL DEFAULT 0,
  reserved_amount_cents BIGINT NOT NULL DEFAULT 0,
  currency currency_enum NOT NULL DEFAULT 'BRL',
  alert_threshold_percentage INT NOT NULL DEFAULT 80,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT uq_budget_period UNIQUE (cost_center_id, year, month)
);

CREATE INDEX IF NOT EXISTS idx_budgets_cost_center ON budgets(cost_center_id);
CREATE INDEX IF NOT EXISTS idx_budgets_period ON budgets(year, month);
