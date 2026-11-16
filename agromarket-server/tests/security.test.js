import { describe, expect, it } from 'vitest';
import request from 'supertest';
import app from '../app.js';

describe('HTTP security headers and CORS', () => {
  it('adds Helmet headers and removes X-Powered-By', async () => {
    const response = await request(app).get('/');

    expect(response.headers['x-powered-by']).toBeUndefined();
    expect(response.headers['x-content-type-options']).toBe('nosniff');
    expect(response.headers['strict-transport-security']).toBeTruthy();
  });

  it('does not allow a foreign browser origin', async () => {
    const response = await request(app)
      .get('/')
      .set('Origin', 'https://evil.example');

    expect(response.headers['access-control-allow-origin']).toBeUndefined();
  });

  it('allows an origin configured for the frontend', async () => {
    const allowedOrigin = (
      process.env.CORS_ORIGINS
      || process.env.CORS_ORIGIN
      || 'http://localhost:5173'
    ).split(',')[0].trim();
    const response = await request(app)
      .get('/')
      .set('Origin', allowedOrigin);

    expect(response.headers['access-control-allow-origin']).toBe(allowedOrigin);
  });
});
