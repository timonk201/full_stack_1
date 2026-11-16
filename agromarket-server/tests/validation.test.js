import { beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import { getAdminToken, uniqueEmail } from './helpers.js';

describe('Валидация API', () => {
  let adminToken;

  beforeAll(async () => {
    adminToken = await getAdminToken();
  });

  it('возвращает детали при некорректном e-mail регистрации', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Покупатель', email: 'не-почта', password: 'qwerty123' });

    expect(response.status).toBe(400);
    expect(response.body.details.map((detail) => detail.field)).toContain('email');
  });

  it('отклоняет пароль короче восьми символов', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Покупатель', email: uniqueEmail(), password: '1234567' });

    expect(response.status).toBe(400);
    expect(response.body.details.map((detail) => detail.field)).toContain('password');
  });

  it('удаляет неподдерживаемое поле role при регистрации', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Покупатель',
        email: uniqueEmail('role'),
        password: 'qwerty123',
        role: 'admin',
      });

    expect(response.status).toBe(201);
    expect(response.body.user.role).toBe('user');
  });

  it('отклоняет товар с отрицательной ценой', async () => {
    const response = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Мёд', price: -500, category: 'Мёд' });

    expect(response.status).toBe(400);
    expect(response.body.details.map((detail) => detail.field)).toContain('price');
  });

  it('отклоняет PATCH товара с пустым телом', async () => {
    const response = await request(app)
      .patch('/api/products/1')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({});

    expect(response.status).toBe(400);
  });

  it('отвечает 400 на нечисловой id товара', async () => {
    const response = await request(app).get('/api/products/abc');

    expect(response.status).toBe(400);
  });

  it('ограничивает размер JSON-тела до 100 КБ', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'a@a.kz', password: 'x'.repeat(102_400) });

    expect(response.status).toBe(413);
  });
});
