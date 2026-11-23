import { Request, Response, NextFunction } from 'express';
import { AnalyticsService } from '../../../application/services/AnalyticsService';
import { CsvExporter } from '../../../infrastructure/export/CsvExporter';

export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  public getDashboard = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const year = req.query.year ? parseInt(req.query.year as string, 10) : undefined;
      const month = req.query.month ? parseInt(req.query.month as string, 10) : undefined;
      const metrics = await this.analyticsService.getDashboardMetrics(year, month);
      res.status(200).json({ success: true, data: metrics });
    } catch (error) {
      next(error);
    }
  };

  public getTopSpenders = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;
      const year = req.query.year ? parseInt(req.query.year as string, 10) : undefined;
      const spenders = await this.analyticsService.getTopSpenders(limit, year);
      res.status(200).json({ success: true, data: spenders });
    } catch (error) {
      next(error);
    }
  };

  public exportTopSpendersCsv = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const year = req.query.year ? parseInt(req.query.year as string, 10) : undefined;
      const spenders = await this.analyticsService.getTopSpenders(100, year);

      const columns = [
        { key: 'userName', label: 'Nome do Colaborador' },
        { key: 'userEmail', label: 'Email' },
        { key: 'departmentName', label: 'Departamento' },
        { key: 'totalExpensesCount', label: 'Qtd Despesas' },
      ];

      const rows = spenders.map((s) => ({
        userName: s.userName,
        userEmail: s.userEmail,
        departmentName: s.departmentName,
        totalExpensesCount: s.totalExpensesCount,
      }));

      const csv = CsvExporter.toCsv(rows, columns);

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename=relatorio-despesas-colaboradores.csv');
      res.status(200).send(csv);
    } catch (error) {
      next(error);
    }
  };
}
