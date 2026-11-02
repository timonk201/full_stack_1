import { describe, expect, it } from 'vitest';
import request from 'supertest';
import app from '../app.js';

describe('GET /api/health', () => {
  it('отвечает 200', async () => {
    const response = await request(app).get('/api/health');
    expect(response.status).toBe(200);
  });
});