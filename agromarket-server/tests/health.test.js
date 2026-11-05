import { describe, expect, it } from 'vitest';
import request from 'supertest';
import app from '../app.js';

describe('GET /api/health', () => {
  it('сообщает, что база доступна, и показывает версию', async () => {
    const response = await request(app).get('/api/health');
    expect(response.status).toBe(200);
    expect(response.body.db).toBe('ok');
    expect(response.body.version).toBe('local');
  });

  it('разрешает CORS только для настроенных адресов', async () => {
    const allowed = await request(app)
      .get('/api/products')
      .set('Origin', 'http://localhost:5173');
    expect(allowed.headers['access-control-allow-origin']).toBe('http://localhost:5173');

    const disallowed = await request(app)
      .get('/api/products')
      .set('Origin', 'https://evil.example');
    expect(disallowed.headers['access-control-allow-origin']).toBeUndefined();
  });
});