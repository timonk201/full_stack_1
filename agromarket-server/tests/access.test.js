import { beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import { getAdminToken, getUserToken } from './helpers.js';

const newProduct = {
  name: `Тестовый мёд ${Date.now()}`,
  category: 'Мёд',
  price: 2500,
  unit: 'кг',
};

describe('Изменение каталога: только admin', () => {
  let userToken;
  let adminToken;

  beforeAll(async () => {
    userToken = await getUserToken();
    adminToken = await getAdminToken();
  });

  it('без токена отвечает 401', async () => {
    const response = await request(app).post('/api/products').send(newProduct);
    expect(response.status).toBe(401);
  });

  it('покупатель получает 403', async () => {
    const response = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${userToken}`)
      .send(newProduct);
    expect(response.status).toBe(403);
  });

  it('администратор создаёт, изменяет и удаляет товар', async () => {
    const authorization = `Bearer ${adminToken}`;
    const created = await request(app)
      .post('/api/products')
      .set('Authorization', authorization)
      .send(newProduct);
    expect(created.status).toBe(201);

    const updated = await request(app)
      .put(`/api/products/${created.body.id}`)
      .set('Authorization', authorization)
      .send({ ...newProduct, price: 2700 });
    expect(updated.status).toBe(200);
    expect(Number(updated.body.price)).toBe(2700);

    const deleted = await request(app)
      .delete(`/api/products/${created.body.id}`)
      .set('Authorization', authorization);
    expect(deleted.status).toBe(204);

    const missing = await request(app).get(`/api/products/${created.body.id}`);
    expect(missing.status).toBe(404);
  });

  it('покупатель не может удалить товар', async () => {
    const response = await request(app)
      .delete('/api/products/1')
      .set('Authorization', `Bearer ${userToken}`);
    expect(response.status).toBe(403);
  });
});

describe('Заявки: только admin может читать список', () => {
  let userToken;
  let adminToken;

  beforeAll(async () => {
    userToken = await getUserToken();
    adminToken = await getAdminToken();
  });

  it('без токена отвечает 401', async () => {
    const response = await request(app).get('/api/orders');
    expect(response.status).toBe(401);
  });

  it('покупателю отвечает 403', async () => {
    const response = await request(app)
      .get('/api/orders')
      .set('Authorization', `Bearer ${userToken}`);
    expect(response.status).toBe(403);
  });

  it('администратору возвращает массив', async () => {
    const response = await request(app)
      .get('/api/orders')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });
});