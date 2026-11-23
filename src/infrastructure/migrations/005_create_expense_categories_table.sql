-- Migration 005: Categorias de Despesas
CREATE TABLE IF NOT EXISTS expense_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(150) NOT NULL,
  type category_type_enum NOT NULL,
  description TEXT,
  max_limit_per_expense_cents BIGINT,
  max_daily_limit_cents BIGINT,
  requires_receipt BOOLEAN NOT NULL DEFAULT TRUE,
  requires_itemization BOOLEAN NOT NULL DEFAULT FALSE,
  requires_justification BOOLEAN NOT NULL DEFAULT FALSE,
  mileage_rate_per_km DECIMAL(10, 4),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_categories_code ON expense_categories(code);
CREATE INDEX IF NOT EXISTS idx_categories_type ON expense_categories(type);
