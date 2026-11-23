import { config } from '../../../config';

export const openApiSpec = {
  openapi: '3.0.0',
  info: {
    title: 'Sistema Corporativo de Reembolso de Despesas - API',
    version: '1.0.0',
    description:
      'API RESTful robusta para submissão, fluxo de aprovação multinível, conformidade com políticas, prestação de contas, auditoria e liquidação de reembolsos corporativos.',
    contact: {
      name: 'Equipe de Engenharia',
      email: 'engenharia@reembolsotech.com.br',
    },
  },
  servers: [
    {
      url: `http://localhost:${config.app.port}${config.app.apiPrefix}`,
      description: 'Servidor Local de Desenvolvimento',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Insira o token JWT no cabeçalho Authorization: Bearer <token>',
      },
    },
    schemas: {
      StandardResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          data: { type: 'object' },
          message: { type: 'string' },
        },
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          error: {
            type: 'object',
            properties: {
              type: { type: 'string', example: 'ValidationError' },
              message: { type: 'string', example: 'Dados de requisição inválidos' },
              statusCode: { type: 'number', example: 400 },
              timestamp: { type: 'string', example: '2026-11-23T18:00:00.000Z' },
              details: { type: 'array', items: { type: 'object' } },
            },
          },
        },
      },
      LoginRequest: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email', example: 'colaborador@reembolso.com.br' },
          password: { type: 'string', format: 'password', example: 'SenhaForte@2026' },
        },
      },
      CreateExpenseRequest: {
        type: 'object',
        required: ['title'],
        properties: {
          title: { type: 'string', example: 'Viagem Comercial São Paulo - Q4' },
          description: { type: 'string', example: 'Reuniões com clientes e parceiros estratégicos' },
          currency: { type: 'string', enum: ['BRL', 'USD', 'EUR', 'GBP'], example: 'BRL' },
          departmentId: { type: 'string', format: 'uuid' },
          costCenterId: { type: 'string', format: 'uuid' },
          items: {
            type: 'array',
            items: {
              type: 'object',
              required: ['categoryId', 'description', 'amount', 'expenseDate'],
              properties: {
                categoryId: { type: 'string', format: 'uuid' },
                description: { type: 'string', example: 'Almoço com cliente ABC' },
                amount: { type: 'number', example: 125.5 },
                expenseDate: { type: 'string', format: 'date', example: '2026-11-20' },
                merchantName: { type: 'string', example: 'Restaurante Sabor' },
                merchantTaxId: { type: 'string', example: '12.345.678/0001-90' },
                invoiceNumber: { type: 'string', example: 'NF-e 123456' },
                justification: { type: 'string', example: 'Alinhamento do projeto corporativo' },
              },
            },
          },
        },
      },
    },
  },
  paths: {
    '/auth/login': {
      post: {
        tags: ['Autenticação'],
        summary: 'Autentica um usuário e retorna tokens JWT',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/LoginRequest' },
            },
          },
        },
        responses: {
          200: {
            description: 'Autenticado com sucesso',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/StandardResponse' } } },
          },
          401: {
            description: 'Credenciais inválidas',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
          },
        },
      },
    },
    '/expenses': {
      get: {
        tags: ['Despesas'],
        summary: 'Lista relatórios de despesas com paginação e filtros avançados',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'status', in: 'query', schema: { type: 'string' } },
          { name: 'search', in: 'query', schema: { type: 'string' } },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
        ],
        responses: {
          200: { description: 'Lista de despesas retornada com sucesso' },
        },
      },
      post: {
        tags: ['Despesas'],
        summary: 'Cria um novo relatório de despesas (Rascunho)',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CreateExpenseRequest' },
            },
          },
        },
        responses: {
          201: { description: 'Despesa criada com sucesso' },
        },
      },
    },
    '/expenses/{id}/submit': {
      post: {
        tags: ['Despesas'],
        summary: 'Submete a despesa para o motor de políticas e fluxo de aprovação',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          200: { description: 'Despesa submetida com sucesso' },
          422: { description: 'Violação de regras de políticas corporativas' },
        },
      },
    },
    '/approvals/expenses/{id}/approve': {
      post: {
        tags: ['Aprovações'],
        summary: 'Aprova a etapa atual da despesa',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          200: { description: 'Etapa aprovada com sucesso' },
        },
      },
    },
    '/reimbursements/batches': {
      post: {
        tags: ['Reembolsos e Pagamentos'],
        summary: 'Gera um lote de pagamento com despesas aprovadas',
        security: [{ bearerAuth: [] }],
        responses: {
          201: { description: 'Lote de reembolso criado com sucesso' },
        },
      },
    },
    '/analytics/dashboard': {
      get: {
        tags: ['Analytics e Relatórios'],
        summary: 'Retorna indicadores de desempenho, métricas de gastos e tendências para o dashboard',
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Métricas analíticas consolidadas' },
        },
      },
    },
    '/health': {
      get: {
        tags: ['Monitoramento e Saúde'],
        summary: 'Healthcheck do serviço e conexão com PostgreSQL',
        responses: {
          200: { description: 'Sistema saudável e operacional' },
        },
      },
    },
  },
};
