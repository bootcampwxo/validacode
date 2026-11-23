# Sistema Corporativo de Reembolso de Despesas (ReembolsaTech)

> **Sistema robusto, modular e escalável para gestão, controle, políticas de conformidade, aprovação multinível e liquidação de reembolsos corporativos de despesas.**

Desenvolvido em **Node.js** com **TypeScript** e **PostgreSQL**, estruturado rigorosamente sob os princípios de **Clean Architecture** (Arquitetura Limpa), **Domain-Driven Design (DDD)** e **SOLID**.

---

## 🏛️ Visão Geral da Arquitetura

A aplicação está dividida em 4 camadas desacopladas e fortemente tipadas:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Interfaces (HTTP / REST)                        │
│  - Controllers, Rotas, Middlewares, OpenAPI/Swagger, Zod Validations   │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
┌───────────────────────────────────▼────────────────────────────────────┐
│                       Aplicação (Application)                          │
│  - Casos de Uso, Serviços de Negócio (Expense, Approval, Batch, etc.)  │
│  - DTOs de Entrada e Saída, Mappers e Orquestração                     │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
┌───────────────────────────────────▼────────────────────────────────────┐
│                         Domínio (Domain)                               │
│  - Entidades de Negócio (Expense, User, Budget, Workflow, Batch)       │
│  - Value Objects (Money, CPF, Email, BankDetails, DateRange)           │
│  - Motor de Políticas Corporativas (ExpensePolicyEngine)               │
│  - Enums e Hierarquia de Exceções Customizadas (AppError)              │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
┌───────────────────────────────────▼────────────────────────────────────┐
│                    Infraestrutura (Infrastructure)                     │
│  - PostgreSQL Pool, TransactionManager, QueryBuilder                   │
│  - Repositórios com DDL, Migrations SQL e Seeders                      │
│  - Segurança (Bcrypt, JWT, TokenBlacklist), Logging Winston, SMTP      │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 🚀 Funcionalidades Principais

1. **Gestão de Usuários e Perfis (RBAC):**
   - Perfis: `EMPLOYEE`, `MANAGER`, `DIRECTOR`, `VP`, `FINANCIAL_ANALYST`, `FINANCIAL_MANAGER`, `AUDITOR`, `ADMIN`.
   - Vínculo hierárquico (gestor direto, diretor da área, centro de custo).
   - Dados bancários e chaves PIX para liquidação direta.

2. **Submissão e Rastreamento de Despesas:**
   - Multi-itens por relatório com categorias diversas (Alimentação, Hospedagem, Transporte Aéreo, Quilometragem, etc.).
   - Upload de comprovantes fiscais com hash SHA-256 para prevenção de duplicidade e OCR integrado.
   - Cálculo automático de reembolsos, quilometragem e deduções de adiantamentos.

3. **Motor de Conformidade e Políticas Corporativas (`ExpensePolicyEngine`):**
   - Validação de comprovantes fiscais obrigatórios.
   - Tetos de gastos por item e diários por categoria.
   - Bloqueio automático de despesas contendo bebidas alcoólicas.
   - Justificativa obrigatória para despesas em fins de semana e feriados.
   - Verificação de idade máxima do comprovante (ex: 60 dias).
   - Checagem de disponibilidade orçamentária no centro de custo correspondente.

4. **Fluxo de Aprovação Multinível e Dinâmico:**
   - **Nível 1:** Gestor Direto (Manager).
   - **Nível 2:** Diretor da Área (para valores > R$ 5.000,00).
   - **Nível 3:** Vice-Presidente / C-Level (para valores > R$ 20.000,00).
   - **Nível 4:** Controladoria / Gestão Financeira.
   - Histórico completo de ações (Aprovar, Rejeitar, Solicitar Revisão).

5. **Processamento e Liquidação de Lotes de Reembolso:**
   - Agrupamento de despesas aprovadas em lotes financeiros (`ReimbursementBatch`).
   - Geração de ordens de pagamento (PIX / TED) e emissão de comprovantes de liquidação.

6. **Relatórios, Analytics e Dashboard Administrativo:**
   - Totalizadores de gastos corporativos por centro de custo e departamento.
   - Métricas de SLA médio de aprovação e pagamento.
   - Gráfico de tendência mensal e distribuição por categoria.
   - Exportação de relatórios em formato CSV.

7. **Trilha Completa de Auditoria (`AuditLog`):**
   - Registro imutável de todas as ações sensíveis com IP, User-Agent, dados anteriores e novos.

8. **Notificações por Email e In-App:**
   - Alertas automáticos para solicitantes e aprovadores em cada transição de status.

---

## 🛠️ Requisitos de Ambiente

- **Node.js** >= 20.x
- **PostgreSQL** >= 15.x
- **Docker & Docker Compose** (opcional, para execução conteinerizada)

---

## 📦 Instalação e Configuração

### 1. Clonar o repositório e instalar dependências

```bash
git clone <url-do-repositorio>
cd canario
npm install
```

### 2. Configurar Variáveis de Ambiente

Copie o arquivo de exemplo `.env.example` para `.env`:

```bash
cp .env.example .env
```

Ajuste as configurações no `.env` conforme necessário:

```ini
PORT=3000
NODE_ENV=development
API_PREFIX=/api/v1

DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=reembolso_db

JWT_SECRET=super_secret_jwt_key_reembolso_despesas_2026_seguro
```

---

## 🗄️ Banco de Dados, Migrations e Seeds

### 1. Executar as Migrations do Banco

Cria todas as tabelas, tipos ENUM, chaves estrangeiras, índices e views analíticas:

```bash
npm run migrate
```

Para reverter o último lote de migrations (se necessário):
```bash
npm run migrate:rollback
```

### 2. Executar os Seeds Iniciais

Popula o banco com usuários de demonstração, departamentos, centros de custo, categorias, políticas e orçamentos:

```bash
npm run seed
```

**Credenciais padrão geradas pelo seed:**
- **Admin:** `admin@reembolso.com.br` | Senha: `SenhaForte@2026`
- **Diretor:** `diretor@reembolso.com.br` | Senha: `SenhaForte@2026`
- **Gestor:** `gestor@reembolso.com.br` | Senha: `SenhaForte@2026`
- **Financeiro:** `financeiro@reembolso.com.br` | Senha: `SenhaForte@2026`
- **Auditor:** `auditor@reembolso.com.br` | Senha: `SenhaForte@2026`
- **Colaborador:** `colaborador@reembolso.com.br` | Senha: `SenhaForte@2026`

---

## 🏃 Executando a Aplicação

### Modo Desenvolvimento (Hot Reload)

```bash
npm run dev
```

### Modo Produção (Compilação e Execução)

```bash
npm run build
npm start
```

---

## 🐳 Executando com Docker Compose

Suba toda a infraestrutura (Node.js + PostgreSQL) com um único comando:

```bash
docker-compose up --build -d
```

---

## 📖 Documentação da API (Swagger / OpenAPI)

Com o servidor em execução, acesse a interface interativa do Swagger UI:

🔗 **`http://localhost:3000/api-docs`**

### Principais Endpoints:

| Método | Endpoint | Descrição | Perfis Permitidos |
|---|---|---|---|
| `GET` | `/api/v1/health` | Healthcheck da API e PostgreSQL | Público |
| `POST` | `/api/v1/auth/login` | Autenticação e obtenção de token JWT | Público |
| `POST` | `/api/v1/auth/refresh-token` | Renovação do token de acesso | Público |
| `POST` | `/api/v1/auth/logout` | Revogação de token | Autenticado |
| `GET` | `/api/v1/users/me` | Dados do usuário autenticado | Autenticado |
| `GET` | `/api/v1/expenses` | Listagem paginada e filtros de despesas | Autenticado |
| `POST` | `/api/v1/expenses` | Criação de relatório de despesa (Rascunho) | Autenticado |
| `POST` | `/api/v1/expenses/:id/items` | Adição de itens na despesa | Solicitante |
| `POST` | `/api/v1/expenses/:id/submit` | Submissão para políticas e aprovação | Solicitante |
| `POST` | `/api/v1/expenses/:expenseId/receipts` | Upload de comprovante fiscal | Solicitante / Admin |
| `POST` | `/api/v1/approvals/expenses/:id/approve` | Aprovação da etapa do workflow | Gestor / Diretor / Financeiro |
| `POST` | `/api/v1/approvals/expenses/:id/reject` | Rejeição da despesa | Aprovadores |
| `POST` | `/api/v1/approvals/expenses/:id/request-revision` | Solicitação de ajuste no relatório | Aprovadores |
| `POST` | `/api/v1/reimbursements/batches` | Criação de lote de pagamento | Financeiro / Admin |
| `POST` | `/api/v1/reimbursements/batches/:id/process` | Liquidação e pagamento de lote | Financeiro / Admin |
| `GET` | `/api/v1/analytics/dashboard` | Indicadores e métricas de despesas | Gestores / Financeiro / Auditor |
| `GET` | `/api/v1/analytics/export/top-spenders` | Exportação de relatório em CSV | Gestores / Financeiro |
| `GET` | `/api/v1/audit/logs` | Consulta de trilha de auditoria | Auditor / Admin |

---

## 🧪 Suíte de Testes Automatizados

A aplicação conta com testes unitários e de integração utilizando **Jest**:

```bash
# Executa todos os testes
npm test

# Executa apenas testes unitários
npm run test:unit

# Executa apenas testes de integração
npm run test:integration

# Executa com relatório de cobertura de código
npm run test:coverage
```

---

## 🔒 Segurança e Boas Práticas

- **Proteção contra Injeção SQL:** Todas as consultas utilizam queries parametrizadas com `pg`.
- **Proteção de Headers:** Implementação de `helmet` com proteções CSP, HSTS e anti-clickjacking.
- **Rate Limiting:** Proteção contra ataques de força bruta e DoS com `express-rate-limit`.
- **Hashing Criptográfico:** Senhas cifradas com `bcrypt` (12 rounds de salt).
- **Tokens Seguros:** JWT com expiração configurável e suporte a revogação em blacklist.
- **Validação Estrita:** Esquemas `Zod` validando payload de entrada e parâmetros de consulta em todas as rotas.

---

## 📄 Licença

Este projeto está licenciado sob a Licença MIT.
