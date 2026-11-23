import { DatabasePool } from '../database/DatabasePool';
import { BcryptHasher } from '../security/BcryptHasher';
import { UserRole, UserStatus, CategoryType, PolicyViolationType, PolicySeverity, Currency } from '../../domain/enums';
import { logger } from '../logging/AppLogger';

export class SeedRunner {
  private readonly db: DatabasePool;
  private readonly hasher: BcryptHasher;

  constructor(db?: DatabasePool, hasher?: BcryptHasher) {
    this.db = db || DatabasePool.getInstance();
    this.hasher = hasher || new BcryptHasher();
  }

  public async run(): Promise<void> {
    logger.info('[SeedRunner] Iniciando carga de dados iniciais (Seeds)...');
    const passwordHash = await this.hasher.hash('SenhaForte@2026');

    // 1. Centros de Custo
    logger.info('[SeedRunner] Criando Centros de Custo...');
    const ccRes = await this.db.query(`
      INSERT INTO cost_centers (id, code, name, description, is_active)
      VALUES 
        ('11111111-1111-1111-1111-111111111101', 'CC-ENG', 'Engenharia de Software', 'Centro de custo do time de produto e tecnologia', true),
        ('11111111-1111-1111-1111-111111111102', 'CC-COM', 'Comercial e Vendas', 'Centro de custo do time comercial e prospecção', true),
        ('11111111-1111-1111-1111-111111111103', 'CC-FIN', 'Financeiro e Controladoria', 'Centro de custo da diretoria financeira', true),
        ('11111111-1111-1111-1111-111111111104', 'CC-OPS', 'Operações e RH', 'Centro de custo corporativo e operações', true)
      ON CONFLICT (code) DO NOTHING
      RETURNING id, code;
    `);

    // 2. Departamentos
    logger.info('[SeedRunner] Criando Departamentos...');
    await this.db.query(`
      INSERT INTO departments (id, code, name, cost_center_id, is_active)
      VALUES 
        ('22222222-2222-2222-2222-222222222201', 'DEP-ENG', 'Engenharia de Tecnologia', '11111111-1111-1111-1111-111111111101', true),
        ('22222222-2222-2222-2222-222222222202', 'DEP-VEN', 'Vendas Corporativas', '11111111-1111-1111-1111-111111111102', true),
        ('22222222-2222-2222-2222-222222222203', 'DEP-FIN', 'Controladoria Financeira', '11111111-1111-1111-1111-111111111103', true),
        ('22222222-2222-2222-2222-222222222204', 'DEP-RH', 'Recursos Humanos', '11111111-1111-1111-1111-111111111104', true)
      ON CONFLICT (code) DO NOTHING;
    `);

    // 3. Usuários Iniciais (Admin, Gestor, Diretor, Financeiro, Auditor, Colaborador)
    logger.info('[SeedRunner] Criando Usuários com diferentes perfis...');
    await this.db.query(`
      INSERT INTO users (id, name, email, password_hash, cpf, role, status, department_id, job_title, phone, bank_details)
      VALUES
        ('33333333-3333-3333-3333-333333333301', 'Administrador do Sistema', 'admin@reembolso.com.br', '${passwordHash}', '11144477735', 'ADMIN', 'ACTIVE', '22222222-2222-2222-2222-222222222201', 'Arquiteto Principal', '(11) 98888-0001', '{"bankCode":"001","bankName":"Banco do Brasil","agencyNumber":"1234","accountNumber":"98765-4","accountType":"CHECKING","pixKey":"admin@reembolso.com.br","pixKeyType":"EMAIL","preferredPaymentMethod":"PIX"}'::jsonb),
        ('33333333-3333-3333-3333-333333333302', 'Carlos Diretor', 'diretor@reembolso.com.br', '${passwordHash}', '22255588846', 'DIRECTOR', 'ACTIVE', '22222222-2222-2222-2222-222222222201', 'Diretor de Engenharia', '(11) 98888-0002', '{"bankCode":"237","bankName":"Bradesco","agencyNumber":"4321","accountNumber":"12345-6","accountType":"CHECKING","pixKey":"diretor@reembolso.com.br","pixKeyType":"EMAIL","preferredPaymentMethod":"PIX"}'::jsonb),
        ('33333333-3333-3333-3333-333333333303', 'Mariana Gestora', 'gestor@reembolso.com.br', '${passwordHash}', '33366699957', 'MANAGER', 'ACTIVE', '22222222-2222-2222-2222-222222222201', 'Gerente de Engenharia', '(11) 98888-0003', '{"bankCode":"341","bankName":"Itaú","agencyNumber":"5678","accountNumber":"54321-0","accountType":"CHECKING","pixKey":"gestor@reembolso.com.br","pixKeyType":"EMAIL","preferredPaymentMethod":"PIX"}'::jsonb),
        ('33333333-3333-3333-3333-333333333304', 'Fernando Financeiro', 'financeiro@reembolso.com.br', '${passwordHash}', '44477700068', 'FINANCIAL_MANAGER', 'ACTIVE', '22222222-2222-2222-2222-222222222203', 'Gerente Financeiro', '(11) 98888-0004', '{"bankCode":"033","bankName":"Santander","agencyNumber":"8765","accountNumber":"67890-1","accountType":"CHECKING","pixKey":"financeiro@reembolso.com.br","pixKeyType":"EMAIL","preferredPaymentMethod":"PIX"}'::jsonb),
        ('33333333-3333-3333-3333-333333333305', 'Alice Auditora', 'auditor@reembolso.com.br', '${passwordHash}', '55588811179', 'AUDITOR', 'ACTIVE', '22222222-2222-2222-2222-222222222203', 'Auditora de Conformidade', '(11) 98888-0005', '{"bankCode":"260","bankName":"Nubank","agencyNumber":"0001","accountNumber":"11223-4","accountType":"CHECKING","pixKey":"auditor@reembolso.com.br","pixKeyType":"EMAIL","preferredPaymentMethod":"PIX"}'::jsonb),
        ('33333333-3333-3333-3333-333333333306', 'João Colaborador', 'colaborador@reembolso.com.br', '${passwordHash}', '66699922280', 'EMPLOYEE', 'ACTIVE', '22222222-2222-2222-2222-222222222201', 'Engenheiro de Software Pleno', '(11) 98888-0006', '{"bankCode":"260","bankName":"Nubank","agencyNumber":"0001","accountNumber":"99887-6","accountType":"CHECKING","pixKey":"colaborador@reembolso.com.br","pixKeyType":"EMAIL","preferredPaymentMethod":"PIX"}'::jsonb)
      ON CONFLICT (email) DO NOTHING;
    `);

    // Atualiza gestores de departamentos
    await this.db.query(`
      UPDATE departments SET manager_id = '33333333-3333-3333-3333-333333333303', director_id = '33333333-3333-3333-3333-333333333302' WHERE code = 'DEP-ENG';
      UPDATE users SET manager_id = '33333333-3333-3333-3333-333333333303' WHERE id = '33333333-3333-3333-3333-333333333306';
      UPDATE users SET manager_id = '33333333-3333-3333-3333-333333333302' WHERE id = '33333333-3333-3333-3333-333333333303';
    `);

    // 4. Categorias de Despesas
    logger.info('[SeedRunner] Criando Categorias de Despesas...');
    await this.db.query(`
      INSERT INTO expense_categories (id, code, name, type, description, max_limit_per_expense_cents, max_daily_limit_cents, requires_receipt, requires_itemization, requires_justification, mileage_rate_per_km, is_active)
      VALUES
        ('44444444-4444-4444-4444-444444444401', 'CAT-ALIM', 'Alimentação e Refeições', 'MEALS', 'Despesas com almoço, jantar e lanches em viagens corporativas', 25000, 35000, true, false, false, null, true),
        ('44444444-4444-4444-4444-444444444402', 'CAT-HOSP', 'Hospedagem e Hotelaria', 'LODGING', 'Estadias em hotéis para viagens a trabalho', 120000, 120000, true, true, true, null, true),
        ('44444444-4444-4444-4444-444444444403', 'CAT-TR-AER', 'Transporte Aéreo', 'TRANSPORT_AIR', 'Passagens aéreas nacionais e internacionais', 800000, null, true, true, true, null, true),
        ('44444444-4444-4444-4444-444444444404', 'CAT-TR-TER', 'Transporte Terrestre (Táxi/Uber)', 'TRANSPORT_LAND', 'Deslocamentos urbanos por aplicativo, táxi ou ônibus', 15000, 30000, true, false, false, null, true),
        ('44444444-4444-4444-4444-444444444405', 'CAT-KM', 'Quilometragem (Veículo Próprio)', 'TRANSPORT_MILEAGE', 'Reembolso por km rodado em veículo próprio a serviço', null, null, false, false, true, 1.2500, true),
        ('44444444-4444-4444-4444-444444444406', 'CAT-CONF', 'Treinamentos e Cursos', 'TRAINING_EDUCATION', 'Cursos técnicos, inscrições em eventos e certificações', 300000, null, true, false, true, null, true),
        ('44444444-4444-4444-4444-444444444407', 'CAT-SOFT', 'Softwares e Assinaturas', 'SOFTWARE_SUBSCRIPTION', 'Licenças mensais e ferramentas SaaS para projetos', 50000, null, true, false, true, null, true),
        ('44444444-4444-4444-4444-444444444408', 'CAT-SUPP', 'Suprimentos e Equipamentos', 'SUPPLIES', 'Material de escritório e periféricos de informática', 40000, null, true, false, true, null, true)
      ON CONFLICT (code) DO NOTHING;
    `);

    // 5. Orçamentos Anuais (Ano Atual)
    logger.info('[SeedRunner] Criando Orçamentos Anuais...');
    const currentYear = new Date().getFullYear();
    await this.db.query(`
      INSERT INTO budgets (cost_center_id, year, month, allocated_amount_cents, consumed_amount_cents, reserved_amount_cents, currency, alert_threshold_percentage, is_active)
      VALUES
        ('11111111-1111-1111-1111-111111111101', ${currentYear}, null, 50000000, 0, 0, 'BRL', 80, true),
        ('11111111-1111-1111-1111-111111111102', ${currentYear}, null, 80000000, 0, 0, 'BRL', 80, true),
        ('11111111-1111-1111-1111-111111111103', ${currentYear}, null, 30000000, 0, 0, 'BRL', 80, true),
        ('11111111-1111-1111-1111-111111111104', ${currentYear}, null, 25000000, 0, 0, 'BRL', 80, true)
      ON CONFLICT (cost_center_id, year, month) DO NOTHING;
    `);

    // 6. Regras de Política Corporativa
    logger.info('[SeedRunner] Criando Regras de Políticas Corporativas...');
    await this.db.query(`
      INSERT INTO policy_rules (id, code, name, description, violation_type, severity, max_amount_cents, max_daily_amount_cents, max_age_in_days, requires_receipt, requires_justification, allow_weekend, allow_alcohol, is_active)
      VALUES
        ('55555555-5555-5555-5555-555555555501', 'POL-REC-GLOBAL', 'Comprovante Fiscal Obrigatório Geral', 'Todo gasto exige comprovante fiscal legível', 'RECEIPT_MISSING', 'BLOCKING', null, null, null, true, false, null, null, true),
        ('55555555-5555-5555-5555-555555555502', 'POL-AGE-60D', 'Idade Máxima de 60 Dias para Despesa', 'Despesas com mais de 60 dias necessitam justificativa', 'EXPENSE_TOO_OLD', 'WARNING', null, null, 60, null, true, null, null, true),
        ('55555555-5555-5555-5555-555555555503', 'POL-NO-ALCOHOL', 'Proibição Absoluta de Bebidas Alcoólicas', 'Gasto com bebidas alcoólicas não é reembolsável', 'ALCOHOL_NOT_PERMITTED', 'BLOCKING', null, null, null, null, null, null, false, true),
        ('55555555-5555-5555-5555-555555555504', 'POL-WND-JUST', 'Justificativa Obrigatória em Fins de Semana', 'Gastos aos sábados e domingos exigem motivo claro', 'WEEKEND_WITHOUT_JUSTIFICATION', 'WARNING', null, null, null, null, true, false, null, true)
      ON CONFLICT (code) DO NOTHING;
    `);

    // 7. Cotações de Moedas
    logger.info('[SeedRunner] Cadastrando Taxas de Câmbio de Referência...');
    await this.db.query(`
      INSERT INTO currency_rates (source_currency, target_currency, rate, effective_date, source)
      VALUES
        ('USD', 'BRL', 5.500000, CURRENT_DATE, 'BACEN'),
        ('EUR', 'BRL', 6.000000, CURRENT_DATE, 'BACEN'),
        ('GBP', 'BRL', 7.100000, CURRENT_DATE, 'BACEN'),
        ('BRL', 'BRL', 1.000000, CURRENT_DATE, 'PADRAO')
      ON CONFLICT (source_currency, target_currency, effective_date) DO UPDATE SET rate = EXCLUDED.rate;
    `);

    logger.info('[SeedRunner] Carga inicial de dados concluída com sucesso!');
  }
}
