import { describe, expect, it } from 'vitest';
import request from 'supertest';
import app from '../app.js';

describe('Каталог: публичный доступ', () => {
  it('возвращает непустой список товаров', async () => {
    const response = await request(app).get('/api/products');
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBeGreaterThan(0);
  });

  it('у товара есть id, name и price', async () => {
    const response = await request(app).get('/api/products');
    expect(response.body[0]).toHaveProperty('id');
    expect(response.body[0]).toHaveProperty('name');
    expect(response.body[0]).toHaveProperty('price');
  });

  it('несуществующий товар — 404', async () => {
    const response = await request(app).get('/api/products/999999');
    expect(response.status).toBe(404);
  });

  it('по id возвращается тот же товар, что и в списке', async () => {
    const listResponse = await request(app).get('/api/products');
    const firstProduct = listResponse.body[0];
    const productResponse = await request(app).get(`/api/products/${firstProduct.id}`);
    expect(productResponse.status).toBe(200);
    expect(productResponse.body.name).toBe(firstProduct.name);
  });
});