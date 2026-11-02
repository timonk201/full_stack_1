import { describe, expect, it } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import { uniqueEmail } from './helpers.js';

describe('POST /api/auth/register', () => {
  it('создаёт покупателя и возвращает токен', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Тестовый пользователь', email: uniqueEmail(), password: 'qwerty123' });
    expect(response.status).toBe(201);
    expect(response.body.token).toBeTruthy();
    expect(response.body.user.role).toBe('user');
    expect(response.body.user).not.toHaveProperty('password_hash');
  });

  it('не позволяет задать роль admin через тело запроса', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Тестовый пользователь', email: uniqueEmail(), password: 'qwerty123', role: 'admin' });
    expect(response.status).toBe(201);
    expect(response.body.user.role).toBe('user');
  });

  it('отклоняет короткий пароль', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Тест', email: uniqueEmail(), password: '123' });
    expect(response.status).toBe(400);
  });

  it('сохраняет e-mail в нижнем регистре', async () => {
    const email = `Test${Date.now()}@Mail.KZ`;
    const response = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Тест', email, password: 'qwerty123' });
    expect(response.status).toBe(201);
    expect(response.body.user.email).toBe(email.toLowerCase());
  });
});

describe('POST /api/auth/login', () => {
  it('администратор получает JWT из трёх частей', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD });
    expect(response.status).toBe(200);
    expect(response.body.token.split('.')).toHaveLength(3);
    expect(response.body.user.role).toBe('admin');
  });

  it('неверный пароль и неизвестный e-mail дают одинаковый ответ', async () => {
    const wrongPassword = await request(app)
      .post('/api/auth/login')
      .send({ email: process.env.ADMIN_EMAIL, password: 'неверный-пароль' });
    const unknownEmail = await request(app)
      .post('/api/auth/login')
      .send({ email: uniqueEmail('nobody'), password: 'неверный-пароль' });
    expect(wrongPassword.status).toBe(401);
    expect(unknownEmail.status).toBe(401);
    expect(wrongPassword.body).toEqual(unknownEmail.body);
  });
});

describe('GET /api/auth/me', () => {
  it('без токена отвечает 401', async () => {
    const response = await request(app).get('/api/auth/me');
    expect(response.status).toBe(401);
  });

  it('с токеном покупателя возвращает профиль без хэша пароля', async () => {
    const registration = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Тестовый пользователь', email: uniqueEmail(), password: 'qwerty123' });
    const response = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${registration.body.token}`);
    expect(response.status).toBe(200);
    expect(response.body).not.toHaveProperty('password_hash');
  });
});