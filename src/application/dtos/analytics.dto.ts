export interface DashboardMetricsDto {
  period: {
    year: number;
    month?: number;
  };
  overview: {
    totalExpensesCount: number;
    totalAmount: { amount: number; cents: number; formatted: string };
    totalPaidAmount: { amount: number; cents: number; formatted: string };
    totalPendingApprovalCount: number;
    totalPendingApprovalAmount: { amount: number; cents: number; formatted: string };
    totalRejectedCount: number;
    averageReimbursementDays: number;
  };
  expensesByStatus: Array<{
    status: string;
    count: number;
    totalAmount: { amount: number; cents: number; formatted: string };
  }>;
  spendByDepartment: Array<{
    departmentId: string;
    departmentName: string;
    costCenterName: string;
    totalExpensesCount: number;
    totalAmount: { amount: number; cents: number; formatted: string };
    paidAmount: { amount: number; cents: number; formatted: string };
  }>;
  spendByCategory: Array<{
    categoryId: string;
    categoryName: string;
    categoryType: string;
    itemsCount: number;
    totalAmount: { amount: number; cents: number; formatted: string };
    percentageOfTotal: number;
  }>;
  monthlyTrend: Array<{
    month: number;
    year: number;
    totalAmount: { amount: number; cents: number; formatted: string };
    expensesCount: number;
  }>;
}

export interface SpendByEmployeeDto {
  userId: string;
  userName: string;
  userEmail: string;
  departmentName: string;
  totalExpensesCount: number;
  totalAmount: { amount: number; cents: number; formatted: string };
}
