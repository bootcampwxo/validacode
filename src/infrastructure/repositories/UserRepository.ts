import { BasePostgresRepository } from './BasePostgresRepository';
import { IUserRepository, UserFilterParams } from './IUserRepository';
import { User } from '../../domain/entities/User';
import { UserRole, UserStatus } from '../../domain/enums';
import { Email, CPF, BankDetails } from '../../domain/value-objects';
import { PaginatedResult, QueryBuilder } from '../database/QueryBuilder';

export class UserRepository extends BasePostgresRepository<User> implements IUserRepository {
  protected readonly tableName = 'users';

  protected mapToEntity(row: any): User {
    let bankDetails: BankDetails | undefined;
    if (row.bank_details) {
      bankDetails = new BankDetails({
        bankCode: row.bank_details.bankCode,
        bankName: row.bank_details.bankName,
        agencyNumber: row.bank_details.agencyNumber,
        accountNumber: row.bank_details.accountNumber,
        accountType: row.bank_details.accountType,
        pixKey: row.bank_details.pixKey,
        pixKeyType: row.bank_details.pixKeyType,
        preferredPaymentMethod: row.bank_details.preferredPaymentMethod,
      });
    }

    return new User({
      id: row.id,
      name: row.name,
      email: new Email(row.email),
      passwordHash: row.password_hash,
      cpf: new CPF(row.cpf),
      role: row.role as UserRole,
      status: row.status as UserStatus,
      departmentId: row.department_id,
      managerId: row.manager_id,
      jobTitle: row.job_title,
      phone: row.phone,
      avatarUrl: row.avatar_url,
      bankDetails,
      lastLoginAt: row.last_login_at ? new Date(row.last_login_at) : undefined,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    });
  }

  protected mapToRow(entity: User): Record<string, any> {
    return {
      id: entity.id,
      name: entity.name,
      email: entity.email.value,
      password_hash: entity.passwordHash,
      cpf: entity.cpf.raw,
      role: entity.role,
      status: entity.status,
      department_id: entity.departmentId || null,
      manager_id: entity.managerId || null,
      job_title: entity.jobTitle || null,
      phone: entity.phone || null,
      avatar_url: entity.avatarUrl || null,
      bank_details: entity.bankDetails ? JSON.stringify(entity.bankDetails.toJSON()) : null,
      last_login_at: entity.lastLoginAt || null,
      created_at: entity.createdAt,
      updated_at: entity.updatedAt,
    };
  }

  public async findByEmail(email: string): Promise<User | null> {
    const sql = `SELECT * FROM ${this.tableName} WHERE LOWER(email) = LOWER($1) LIMIT 1`;
    const result = await this.db.query(sql, [email.trim()]);
    if (result.rows.length === 0) return null;
    return this.mapToEntity(result.rows[0]);
  }

  public async findByCpf(cpf: string): Promise<User | null> {
    const cleanCpf = cpf.replace(/\D/g, '');
    const sql = `SELECT * FROM ${this.tableName} WHERE cpf = $1 LIMIT 1`;
    const result = await this.db.query(sql, [cleanCpf]);
    if (result.rows.length === 0) return null;
    return this.mapToEntity(result.rows[0]);
  }

  public async findByDepartment(departmentId: string): Promise<User[]> {
    const sql = `SELECT * FROM ${this.tableName} WHERE department_id = $1 AND status = 'ACTIVE' ORDER BY name ASC`;
    const result = await this.db.query(sql, [departmentId]);
    return result.rows.map((r) => this.mapToEntity(r));
  }

  public async findByRole(role: UserRole): Promise<User[]> {
    const sql = `SELECT * FROM ${this.tableName} WHERE role = $1 AND status = 'ACTIVE' ORDER BY name ASC`;
    const result = await this.db.query(sql, [role]);
    return result.rows.map((r) => this.mapToEntity(r));
  }

  public async findDirectReports(managerId: string): Promise<User[]> {
    const sql = `SELECT * FROM ${this.tableName} WHERE manager_id = $1 AND status = 'ACTIVE' ORDER BY name ASC`;
    const result = await this.db.query(sql, [managerId]);
    return result.rows.map((r) => this.mapToEntity(r));
  }

  public async searchUsers(filters: UserFilterParams): Promise<PaginatedResult<User>> {
    const qb = QueryBuilder.table(this.tableName);

    if (filters.role) qb.whereEquals('role', filters.role);
    if (filters.status) qb.whereEquals('status', filters.status);
    if (filters.departmentId) qb.whereEquals('department_id', filters.departmentId);
    if (filters.search) {
      qb.whereLike('name', filters.search);
    }

    qb.paginate(filters);
    const { sql, countSql, params } = qb.buildSelect();

    const countResult = await this.db.query(countSql, params.slice(0, -2));
    const total = parseInt(countResult.rows[0]?.total || '0', 10);

    const rowsResult = await this.db.query(sql, params);
    const data = rowsResult.rows.map((r) => this.mapToEntity(r));

    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const totalPages = Math.ceil(total / limit);

    return {
      data,
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }

  public async save(entity: User): Promise<User> {
    const row = this.mapToRow(entity);
    const sql = `
      INSERT INTO ${this.tableName} (
        id, name, email, password_hash, cpf, role, status,
        department_id, manager_id, job_title, phone, avatar_url,
        bank_details, last_login_at, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      RETURNING *;
    `;
    const params = [
      row.id,
      row.name,
      row.email,
      row.password_hash,
      row.cpf,
      row.role,
      row.status,
      row.department_id,
      row.manager_id,
      row.job_title,
      row.phone,
      row.avatar_url,
      row.bank_details,
      row.last_login_at,
      row.created_at,
      row.updated_at,
    ];

    const result = await this.db.query(sql, params);
    return this.mapToEntity(result.rows[0]);
  }

  public async update(entity: User): Promise<User> {
    const row = this.mapToRow(entity);
    const sql = `
      UPDATE ${this.tableName} SET
        name = $2,
        email = $3,
        password_hash = $4,
        cpf = $5,
        role = $6,
        status = $7,
        department_id = $8,
        manager_id = $9,
        job_title = $10,
        phone = $11,
        avatar_url = $12,
        bank_details = $13,
        last_login_at = $14,
        updated_at = $15
      WHERE id = $1
      RETURNING *;
    `;
    const params = [
      row.id,
      row.name,
      row.email,
      row.password_hash,
      row.cpf,
      row.role,
      row.status,
      row.department_id,
      row.manager_id,
      row.job_title,
      row.phone,
      row.avatar_url,
      row.bank_details,
      row.last_login_at,
      row.updated_at,
    ];

    const result = await this.db.query(sql, params);
    return this.mapToEntity(result.rows[0]);
  }
}
