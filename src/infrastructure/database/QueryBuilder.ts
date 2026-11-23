export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface FilterCondition {
  field: string;
  operator: '=' | '!=' | '>' | '>=' | '<' | '<=' | 'LIKE' | 'ILIKE' | 'IN' | 'IS NULL' | 'IS NOT NULL' | 'BETWEEN';
  value?: unknown;
}

export class QueryBuilder {
  private tableName: string;
  private selectedColumns: string[] = ['*'];
  private whereConditions: FilterCondition[] = [];
  private joins: string[] = [];
  private groupByColumns: string[] = [];
  private orderByColumn = 'created_at';
  private orderDirection: 'ASC' | 'DESC' = 'DESC';
  private page = 1;
  private limit = 20;

  constructor(tableName: string) {
    this.tableName = tableName;
  }

  public static table(tableName: string): QueryBuilder {
    return new QueryBuilder(tableName);
  }

  public select(columns: string[]): this {
    this.selectedColumns = columns;
    return this;
  }

  public where(field: string, operator: FilterCondition['operator'], value?: unknown): this {
    this.whereConditions.push({ field, operator, value });
    return this;
  }

  public whereEquals(field: string, value: unknown): this {
    if (value !== undefined && value !== null) {
      this.whereConditions.push({ field, operator: '=', value });
    }
    return this;
  }

  public whereLike(field: string, pattern: string): this {
    if (pattern) {
      this.whereConditions.push({ field, operator: 'ILIKE', value: `%${pattern}%` });
    }
    return this;
  }

  public whereIn(field: string, values: unknown[]): this {
    if (values && values.length > 0) {
      this.whereConditions.push({ field, operator: 'IN', value: values });
    }
    return this;
  }

  public whereBetween(field: string, start: unknown, end: unknown): this {
    if (start !== undefined && end !== undefined) {
      this.whereConditions.push({ field, operator: 'BETWEEN', value: [start, end] });
    }
    return this;
  }

  public join(joinClause: string): this {
    this.joins.push(joinClause);
    return this;
  }

  public groupBy(columns: string[]): this {
    this.groupByColumns = columns;
    return this;
  }

  public orderBy(column: string, direction: 'ASC' | 'DESC' = 'ASC'): this {
    this.orderByColumn = column;
    this.orderDirection = direction;
    return this;
  }

  public paginate(params?: PaginationParams): this {
    if (params) {
      this.page = Math.max(1, params.page || 1);
      this.limit = Math.min(100, Math.max(1, params.limit || 20));
      if (params.sortBy) this.orderByColumn = params.sortBy;
      if (params.sortOrder) this.orderDirection = params.sortOrder;
    }
    return this;
  }

  public buildSelect(): { sql: string; countSql: string; params: unknown[] } {
    const params: unknown[] = [];
    let paramIndex = 1;

    const whereClauses: string[] = [];
    for (const cond of this.whereConditions) {
      if (cond.operator === 'IS NULL' || cond.operator === 'IS NOT NULL') {
        whereClauses.push(`${cond.field} ${cond.operator}`);
      } else if (cond.operator === 'IN') {
        const arr = Array.isArray(cond.value) ? cond.value : [cond.value];
        const placeholders = arr.map(() => `$${paramIndex++}`).join(', ');
        whereClauses.push(`${cond.field} IN (${placeholders})`);
        params.push(...arr);
      } else if (cond.operator === 'BETWEEN') {
        const [start, end] = cond.value as [unknown, unknown];
        whereClauses.push(`${cond.field} BETWEEN $${paramIndex++} AND $${paramIndex++}`);
        params.push(start, end);
      } else {
        whereClauses.push(`${cond.field} ${cond.operator} $${paramIndex++}`);
        params.push(cond.value);
      }
    }

    const wherePart = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';
    const joinPart = this.joins.length > 0 ? this.joins.join(' ') : '';
    const groupPart = this.groupByColumns.length > 0 ? `GROUP BY ${this.groupByColumns.join(', ')}` : '';

    const countSql = `SELECT COUNT(*) AS total FROM ${this.tableName} ${joinPart} ${wherePart}`.trim();

    const offset = (this.page - 1) * this.limit;
    const selectColumns = this.selectedColumns.join(', ');
    const sql = `
      SELECT ${selectColumns}
      FROM ${this.tableName}
      ${joinPart}
      ${wherePart}
      ${groupPart}
      ORDER BY ${this.orderByColumn} ${this.orderDirection}
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `.trim();

    params.push(this.limit, offset);

    return { sql, countSql, params };
  }
}
