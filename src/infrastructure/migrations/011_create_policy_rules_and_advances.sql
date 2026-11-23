-- Migration 011: Regras de Políticas Corporativas e Adiantamentos
CREATE TABLE IF NOT EXISTS policy_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  violation_type policy_violation_enum NOT NULL,
  severity policy_severity_enum NOT NULL DEFAULT 'WARNING',
  category_type category_type_enum,
  category_id UUID REFERENCES expense_categories(id) ON DELETE SET NULL,
  max_amount_cents BIGINT,
  max_daily_amount_cents BIGINT,
  max_age_in_days INT,
  requires_receipt BOOLEAN,
  requires_justification BOOLEAN,
  allow_weekend BOOLEAN,
  allow_alcohol BOOLEAN,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS advance_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) NOT NULL UNIQUE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  department_id UUID NOT NULL REFERENCES departments(id) ON DELETE RESTRICT,
  cost_center_id UUID NOT NULL REFERENCES cost_centers(id) ON DELETE RESTRICT,
  purpose TEXT NOT NULL,
  requested_amount_cents BIGINT NOT NULL,
  approved_amount_cents BIGINT,
  currency currency_enum NOT NULL DEFAULT 'BRL',
  status advance_status_enum NOT NULL DEFAULT 'PENDING',
  request_date DATE NOT NULL DEFAULT CURRENT_DATE,
  expected_reconciliation_date DATE NOT NULL,
  actual_reconciliation_date TIMESTAMP WITH TIME ZONE,
  approved_by_id UUID REFERENCES users(id) ON DELETE SET NULL,
  approved_at TIMESTAMP WITH TIME ZONE,
  disbursed_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  reconciled_expense_id UUID REFERENCES expenses(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS currency_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_currency currency_enum NOT NULL,
  target_currency currency_enum NOT NULL,
  rate DECIMAL(18, 6) NOT NULL,
  effective_date DATE NOT NULL,
  source VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT uq_currency_rate UNIQUE (source_currency, target_currency, effective_date)
);

-- Foreign Key para ligar adiantamento à despesa
ALTER TABLE expenses
  DROP CONSTRAINT IF EXISTS fk_expenses_advance,
  ADD CONSTRAINT fk_expenses_advance FOREIGN KEY (advance_payment_id) REFERENCES advance_payments(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_policy_rules_code ON policy_rules(code);
CREATE INDEX IF NOT EXISTS idx_advances_user ON advance_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_advances_status ON advance_payments(status);
