-- Migration 006: Relatórios de Despesas e Itens
CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) NOT NULL UNIQUE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  department_id UUID NOT NULL REFERENCES departments(id) ON DELETE RESTRICT,
  cost_center_id UUID NOT NULL REFERENCES cost_centers(id) ON DELETE RESTRICT,
  status expense_status_enum NOT NULL DEFAULT 'DRAFT',
  currency currency_enum NOT NULL DEFAULT 'BRL',
  total_amount_cents BIGINT NOT NULL DEFAULT 0,
  reimbursable_amount_cents BIGINT NOT NULL DEFAULT 0,
  advance_payment_id UUID,
  submitted_at TIMESTAMP WITH TIME ZONE,
  approved_at TIMESTAMP WITH TIME ZONE,
  paid_at TIMESTAMP WITH TIME ZONE,
  rejected_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  revision_notes TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS expense_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_id UUID NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES expense_categories(id) ON DELETE RESTRICT,
  description VARCHAR(255) NOT NULL,
  amount_cents BIGINT NOT NULL,
  currency currency_enum NOT NULL DEFAULT 'BRL',
  expense_date DATE NOT NULL,
  merchant_name VARCHAR(255),
  merchant_tax_id VARCHAR(50),
  invoice_number VARCHAR(100),
  kilometers DECIMAL(10, 2),
  participants_count INT DEFAULT 1,
  participants_names TEXT[],
  justification TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_expenses_user ON expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_status ON expenses(status);
CREATE INDEX IF NOT EXISTS idx_expenses_cost_center ON expenses(cost_center_id);
CREATE INDEX IF NOT EXISTS idx_expenses_department ON expenses(department_id);
CREATE INDEX IF NOT EXISTS idx_expenses_created_at ON expenses(created_at);
CREATE INDEX IF NOT EXISTS idx_expense_items_expense ON expense_items(expense_id);
CREATE INDEX IF NOT EXISTS idx_expense_items_category ON expense_items(category_id);
CREATE INDEX IF NOT EXISTS idx_expense_items_date ON expense_items(expense_date);
