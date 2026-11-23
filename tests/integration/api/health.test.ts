import request from 'supertest';
import { AppServer } from '../../../src/interfaces/http/Server';

describe('Integration: HealthCheck Endpoint', () => {
  let appServer: AppServer;

  beforeAll(() => {
    appServer = new AppServer();
  });

  afterAll(async () => {
    await appServer.stop();
  });

  it('GET /api/v1/health deve responder com status de saúde do sistema', async () => {
    const res = await request(appServer.getApp()).get('/api/v1/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBeDefined();
    expect(res.body.appName).toBeDefined();
    expect(res.body.components).toBeDefined();
  });

  it('GET / deve responder com metadados da aplicação e link para Swagger', async () => {
    const res = await request(appServer.getApp()).get('/');
    expect(res.status).toBe(200);
    expect(res.body.docs).toBe('/api-docs');
    expect(res.body.apiPrefix).toBe('/api/v1');
  });
});
