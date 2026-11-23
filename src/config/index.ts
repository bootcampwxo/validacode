import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

export const config = {
  app: {
    name: process.env.APP_NAME || 'SistemaReembolsoDespesas',
    env: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT || '3000', 10),
    apiPrefix: process.env.API_PREFIX || '/api/v1',
    url: process.env.APP_URL || 'http://localhost:3000',
    isProduction: process.env.NODE_ENV === 'production',
    isTest: process.env.NODE_ENV === 'test',
  },
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'reembolso_db',
    ssl: process.env.DB_SSL === 'true',
    poolMin: parseInt(process.env.DB_POOL_MIN || '2', 10),
    poolMax: parseInt(process.env.DB_POOL_MAX || '20', 10),
    timeoutMs: parseInt(process.env.DB_TIMEOUT_MS || '30000', 10),
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'chave_secreta_jwt_padrao_reembolso_2026',
    expiresIn: process.env.JWT_EXPIRES_IN || '8h',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'chave_secreta_refresh_padrao_2026',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    saltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS || '12', 10),
  },
  policies: {
    autoApprovalLimit: parseFloat(process.env.AUTO_APPROVAL_LIMIT || '100.00'),
    directorApprovalThreshold: parseFloat(process.env.DIRECTOR_APPROVAL_THRESHOLD || '5000.00'),
    vpApprovalThreshold: parseFloat(process.env.VP_APPROVAL_THRESHOLD || '20000.00'),
    maxExpenseAgeDays: parseInt(process.env.MAX_EXPENSE_AGE_DAYS || '60', 10),
    defaultCurrency: process.env.DEFAULT_CURRENCY || 'BRL',
  },
  smtp: {
    host: process.env.SMTP_HOST || 'localhost',
    port: parseInt(process.env.SMTP_PORT || '2525', 10),
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.SMTP_FROM || 'nao-responda@reembolsotech.com.br',
    enableNotifications: process.env.ENABLE_EMAIL_NOTIFICATIONS === 'true',
  },
  uploads: {
    dir: path.resolve(process.cwd(), process.env.UPLOAD_DIR || 'uploads'),
    maxFileSizeMb: parseInt(process.env.MAX_FILE_SIZE_MB || '10', 10),
    allowedMimeTypes: (
      process.env.ALLOWED_FILE_TYPES ||
      'image/jpeg,image/png,image/webp,application/pdf'
    ).split(','),
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    filePath: process.env.LOG_FILE_PATH || 'logs/app.log',
    enableAudit: process.env.ENABLE_AUDIT_LOG !== 'false',
  },
};
