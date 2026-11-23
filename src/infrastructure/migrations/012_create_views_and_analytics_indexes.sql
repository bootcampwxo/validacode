-- Migration 012: Views Analíticas e Otimização para Dashboard
CREATE OR REPLACE VIEW vw_expense_summary AS
SELECT
  e.id AS expense_id,
  e.code AS expense_code,
  e.title AS expense_title,
  e.status AS expense_status,
  e.total_amount_cents,
  e.reimbursable_amount_cents,
  e.currency,
  e.created_at,
  e.submitted_at,
  e.approved_at,
  e.paid_at,
  u.id AS user_id,
  u.name AS user_name,
  u.email AS user_email,
  d.id AS department_id,
  d.name AS department_name,
  d.code AS department_code,
  c.id AS cost_center_id,
  c.name AS cost_center_name,
  c.code AS cost_center_code,
  COUNT(ei.id) AS total_items,
  COUNT(er.id) AS total_receipts
FROM expenses e
JOIN users u ON e.user_id = u.id
JOIN departments d ON e.department_id = d.id
JOIN cost_centers c ON e.cost_center_id = c.id
LEFT JOIN expense_items ei ON ei.expense_id = e.id
LEFT JOIN expense_receipts er ON er.expense_id = e.id
GROUP BY e.id, u.id, d.id, c.id;

CREATE OR REPLACE VIEW vw_department_monthly_spend AS
SELECT
  d.id AS department_id,
  d.name AS department_name,
  c.id AS cost_center_id,
  c.name AS cost_center_name,
  EXTRACT(YEAR FROM e.created_at) AS year,
  EXTRACT(MONTH FROM e.created_at) AS month,
  COUNT(DISTINCT e.id) AS total_expenses_count,
  SUM(e.total_amount_cents) AS total_amount_cents,
  SUM(CASE WHEN e.status = 'PAID' THEN e.total_amount_cents ELSE 0 END) AS paid_amount_cents
FROM expenses e
JOIN departments d ON e.department_id = d.id
JOIN cost_centers c ON e.cost_center_id = c.id
WHERE e.status NOT IN ('CANCELLED', 'REJECTED')
GROUP BY d.id, d.name, c.id, c.name, EXTRACT(YEAR FROM e.created_at), EXTRACT(MONTH FROM e.created_at);

CREATE OR REPLACE VIEW vw_category_spend_breakdown AS
SELECT
  ec.id AS category_id,
  ec.name AS category_name,
  ec.type AS category_type,
  EXTRACT(YEAR FROM ei.expense_date) AS year,
  EXTRACT(MONTH FROM ei.expense_date) AS month,
  COUNT(ei.id) AS items_count,
  SUM(ei.amount_cents) AS total_amount_cents
FROM expense_items ei
JOIN expense_categories ec ON ei.category_id = ec.id
JOIN expenses e ON ei.expense_id = e.id
WHERE e.status NOT IN ('CANCELLED', 'REJECTED')
GROUP BY ec.id, ec.name, ec.type, EXTRACT(YEAR FROM ei.expense_date), EXTRACT(MONTH FROM ei.expense_date);
