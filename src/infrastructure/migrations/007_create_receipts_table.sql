-- Migration 007: Comprovantes e Anexos Fiscais
CREATE TABLE IF NOT EXISTS expense_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_id UUID NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
  expense_item_id UUID REFERENCES expense_items(id) ON DELETE SET NULL,
  original_file_name VARCHAR(255) NOT NULL,
  stored_file_name VARCHAR(255) NOT NULL,
  file_path TEXT NOT NULL,
  file_size INT NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  file_hash VARCHAR(64) NOT NULL,
  ocr_extracted_text TEXT,
  ocr_extracted_amount_cents BIGINT,
  ocr_extracted_date DATE,
  ocr_extracted_cnpj VARCHAR(20),
  is_verified BOOLEAN NOT NULL DEFAULT FALSE,
  uploaded_by_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_receipts_expense ON expense_receipts(expense_id);
CREATE INDEX IF NOT EXISTS idx_receipts_item ON expense_receipts(expense_item_id);
CREATE INDEX IF NOT EXISTS idx_receipts_hash ON expense_receipts(file_hash);
