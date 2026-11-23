import { DatabasePool } from '../../infrastructure/database/DatabasePool';
import { DashboardMetricsDto, SpendByEmployeeDto } from '../dtos/analytics.dto';
import { Money } from '../../domain/value-objects';

export class AnalyticsService {
  constructor(private readonly db: DatabasePool = DatabasePool.getInstance()) {}

  public async getDashboardMetrics(year?: number, month?: number): Promise<DashboardMetricsDto> {
    const targetYear = year || new Date().getFullYear();

    // 1. Visão Geral (Overview)
    let overviewSql = `
      SELECT
        COUNT(id) AS total_count,
        COALESCE(SUM(total_amount_cents), 0) AS total_amount,
        COALESCE(SUM(CASE WHEN status = 'PAID' THEN total_amount_cents ELSE 0 END), 0) AS total_paid_amount,
        COUNT(CASE WHEN status IN ('SUBMITTED', 'UNDER_REVIEW', 'APPROVED_BY_MANAGER', 'APPROVED_BY_DIRECTOR', 'APPROVED_BY_VP', 'APPROVED_FOR_PAYMENT') THEN 1 END) AS pending_count,
        COALESCE(SUM(CASE WHEN status IN ('SUBMITTED', 'UNDER_REVIEW', 'APPROVED_BY_MANAGER', 'APPROVED_BY_DIRECTOR', 'APPROVED_BY_VP', 'APPROVED_FOR_PAYMENT') THEN total_amount_cents ELSE 0 END), 0) AS pending_amount,
        COUNT(CASE WHEN status = 'REJECTED' THEN 1 END) AS rejected_count,
        COALESCE(AVG(CASE WHEN paid_at IS NOT NULL THEN EXTRACT(EPOCH FROM (paid_at - submitted_at)) / 86400 ELSE NULL END), 0) AS avg_reimbursement_days
      FROM expenses
      WHERE EXTRACT(YEAR FROM created_at) = $1
    `;
    const params: unknown[] = [targetYear];

    if (month !== undefined) {
      overviewSql += ` AND EXTRACT(MONTH FROM created_at) = $2`;
      params.push(month);
    }

    const overviewRes = await this.db.query(overviewSql, params);
    const ov = overviewRes.rows[0];

    const totalMoney = Money.fromCents(parseInt(ov.total_amount, 10));
    const paidMoney = Money.fromCents(parseInt(ov.total_paid_amount, 10));
    const pendingMoney = Money.fromCents(parseInt(ov.pending_amount, 10));

    // 2. Gastos por Status
    const statusSql = `
      SELECT status, COUNT(id) AS count, COALESCE(SUM(total_amount_cents), 0) AS total_amount
      FROM expenses
      WHERE EXTRACT(YEAR FROM created_at) = $1
      GROUP BY status
    `;
    const statusRes = await this.db.query(statusSql, [targetYear]);
    const expensesByStatus = statusRes.rows.map((r) => ({
      status: r.status,
      count: parseInt(r.count, 10),
      totalAmount: {
        amount: parseInt(r.total_amount, 10) / 100,
        cents: parseInt(r.total_amount, 10),
        formatted: Money.fromCents(parseInt(r.total_amount, 10)).format(),
      },
    }));

    // 3. Gastos por Departamento
    const deptSql = `
      SELECT
        d.id AS department_id,
        d.name AS department_name,
        c.name AS cost_center_name,
        COUNT(DISTINCT e.id) AS total_count,
        COALESCE(SUM(e.total_amount_cents), 0) AS total_amount,
        COALESCE(SUM(CASE WHEN e.status = 'PAID' THEN e.total_amount_cents ELSE 0 END), 0) AS paid_amount
      FROM departments d
      LEFT JOIN cost_centers c ON d.cost_center_id = c.id
      LEFT JOIN expenses e ON e.department_id = d.id AND EXTRACT(YEAR FROM e.created_at) = $1
      GROUP BY d.id, d.name, c.name
      ORDER BY total_amount DESC
    `;
    const deptRes = await this.db.query(deptSql, [targetYear]);
    const spendByDepartment = deptRes.rows.map((r) => ({
      departmentId: r.department_id,
      departmentName: r.department_name,
      costCenterName: r.cost_center_name || 'Geral',
      totalExpensesCount: parseInt(r.total_count, 10),
      totalAmount: {
        amount: parseInt(r.total_amount, 10) / 100,
        cents: parseInt(r.total_amount, 10),
        formatted: Money.fromCents(parseInt(r.total_amount, 10)).format(),
      },
      paidAmount: {
        amount: parseInt(r.paid_amount, 10) / 100,
        cents: parseInt(r.paid_amount, 10),
        formatted: Money.fromCents(parseInt(r.paid_amount, 10)).format(),
      },
    }));

    // 4. Gastos por Categoria
    const catSql = `
      SELECT
        ec.id AS category_id,
        ec.name AS category_name,
        ec.type AS category_type,
        COUNT(ei.id) AS items_count,
        COALESCE(SUM(ei.amount_cents), 0) AS total_amount
      FROM expense_categories ec
      LEFT JOIN expense_items ei ON ei.category_id = ec.id
      LEFT JOIN expenses e ON ei.expense_id = e.id AND EXTRACT(YEAR FROM e.created_at) = $1
      GROUP BY ec.id, ec.name, ec.type
      ORDER BY total_amount DESC
    `;
    const catRes = await this.db.query(catSql, [targetYear]);
    const globalTotalCents = totalMoney.amountInCents || 1;

    const spendByCategory = catRes.rows.map((r) => {
      const cents = parseInt(r.total_amount, 10);
      return {
        categoryId: r.category_id,
        categoryName: r.category_name,
        categoryType: r.category_type,
        itemsCount: parseInt(r.items_count, 10),
        totalAmount: {
          amount: cents / 100,
          cents,
          formatted: Money.fromCents(cents).format(),
        },
        percentageOfTotal: parseFloat(((cents / globalTotalCents) * 100).toFixed(2)),
      };
    });

    // 5. Tendência Mensal
    const trendSql = `
      SELECT
        EXTRACT(MONTH FROM created_at) AS month,
        EXTRACT(YEAR FROM created_at) AS year,
        COALESCE(SUM(total_amount_cents), 0) AS total_amount,
        COUNT(id) AS expenses_count
      FROM expenses
      WHERE EXTRACT(YEAR FROM created_at) = $1
      GROUP BY EXTRACT(MONTH FROM created_at), EXTRACT(YEAR FROM created_at)
      ORDER BY month ASC
    `;
    const trendRes = await this.db.query(trendSql, [targetYear]);
    const monthlyTrend = trendRes.rows.map((r) => {
      const cents = parseInt(r.total_amount, 10);
      return {
        month: parseInt(r.month, 10),
        year: parseInt(r.year, 10),
        totalAmount: {
          amount: cents / 100,
          cents,
          formatted: Money.fromCents(cents).format(),
        },
        expensesCount: parseInt(r.expenses_count, 10),
      };
    });

    return {
      period: { year: targetYear, month },
      overview: {
        totalExpensesCount: parseInt(ov.total_count, 10),
        totalAmount: {
          amount: totalMoney.decimalValue,
          cents: totalMoney.amountInCents,
          formatted: totalMoney.format(),
        },
        totalPaidAmount: {
          amount: paidMoney.decimalValue,
          cents: paidMoney.amountInCents,
          formatted: paidMoney.format(),
        },
        totalPendingApprovalCount: parseInt(ov.pending_count, 10),
        totalPendingApprovalAmount: {
          amount: pendingMoney.decimalValue,
          cents: pendingMoney.amountInCents,
          formatted: pendingMoney.format(),
        },
        totalRejectedCount: parseInt(ov.rejected_count, 10),
        averageReimbursementDays: parseFloat(parseFloat(ov.avg_reimbursement_days).toFixed(1)),
      },
      expensesByStatus,
      spendByDepartment,
      spendByCategory,
      monthlyTrend,
    };
  }

  public async getTopSpenders(limit = 10, year?: number): Promise<SpendByEmployeeDto[]> {
    const targetYear = year || new Date().getFullYear();
    const sql = `
      SELECT
        u.id AS user_id,
        u.name AS user_name,
        u.email AS user_email,
        d.name AS department_name,
        COUNT(e.id) AS total_count,
        COALESCE(SUM(e.total_amount_cents), 0) AS total_amount
      FROM users u
      LEFT JOIN departments d ON u.department_id = d.id
      JOIN expenses e ON e.user_id = u.id AND EXTRACT(YEAR FROM e.created_at) = $1
      WHERE e.status NOT IN ('CANCELLED', 'REJECTED')
      GROUP BY u.id, u.name, u.email, d.name
      ORDER BY total_amount DESC
      LIMIT $2
    `;
    const res = await this.db.query(sql, [targetYear, limit]);
    return res.rows.map((r) => {
      const cents = parseInt(r.total_amount, 10);
      return {
        userId: r.user_id,
        userName: r.user_name,
        userEmail: r.user_email,
        departmentName: r.department_name || 'Sem Departamento',
        totalExpensesCount: parseInt(r.total_count, 10),
        totalAmount: {
          amount: cents / 100,
          cents,
          formatted: Money.fromCents(cents).format(),
        },
      };
    });
  }
}
