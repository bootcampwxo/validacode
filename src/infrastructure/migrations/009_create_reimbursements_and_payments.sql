-- Migration 009: Lotes de Reembolso e Pagamentos
CREATE TABLE IF NOT EXISTS reimbursement_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_code VARCHAR(50) NOT NULL UNIQUE,
  description TEXT,
  status payment_status_enum NOT NULL DEFAULT 'PENDING',
  total_amount_cents BIGINT NOT NULL DEFAULT 0,
  total_expenses_count INT NOT NULL DEFAULT 0,
  scheduled_date DATE,
  processed_at TIMESTAMP WITH TIME ZONE,
  processed_by_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS reimbursement_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID REFERENCES reimbursement_batches(id) ON DELETE SET NULL,
  expense_id UUID NOT NULL REFERENCES expenses(id) ON DELETE RESTRICT,
  recipient_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  amount_cents BIGINT NOT NULL,
  currency currency_enum NOT NULL DEFAULT 'BRL',
  payment_method payment_method_enum NOT NULL DEFAULT 'PIX',
  bank_details_snapshot JSONB,
  status payment_status_enum NOT NULL DEFAULT 'PENDING',
  transaction_reference VARCHAR(150),
  receipt_number VARCHAR(100),
  failure_reason TEXT,
  executed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_reimbursement_batches_status ON reimbursement_batches(status);
CREATE INDEX IF NOT EXISTS idx_reimbursement_payments_batch ON reimbursement_payments(batch_id);
CREATE INDEX IF NOT EXISTS idx_reimbursement_payments_expense ON reimbursement_payments(expense_id);
CREATE INDEX IF NOT EXISTS idx_reimbursement_payments_recipient ON reimbursement_payments(recipient_id);
CREATE INDEX IF NOT EXISTS idx_reimbursement_payments_status ON reimbursement_payments(status);
