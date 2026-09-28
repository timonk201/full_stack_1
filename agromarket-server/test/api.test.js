import assert from 'node:assert/strict';
import test from 'node:test';
import { parseOrder, ordersRouter } from '../routes/orders.js';
import { productsRouter, searchProducts } from '../routes/products.js';

const validOrder = {
  name: 'Ферма "Рассвет"',
  email: 'farm@example.kz',
  phone: '+7 700 123 45 67',
  volume: 25,
  deliveryDate: '2026-10-12',
  comment: 'Позвонить перед доставкой',
};

test('product search is case-insensitive and returns all products for an empty query', () => {
  assert.deepEqual(searchProducts('МЁД').map((product) => product.id), [2]);
  assert.equal(searchProducts('   ').length, 4);
  assert.deepEqual(searchProducts('not found'), []);
});

test('product router exposes list and item GET routes', () => {
  const routes = productsRouter.stack.map((layer) => layer.route.path);
  assert.deepEqual(routes, ['/', '/:id']);
  assert.ok(productsRouter.stack.every((layer) => layer.route.methods.get));
});

test('orders router accepts POST requests', () => {
  assert.equal(ordersRouter.stack[0].route.path, '/');
  assert.ok(ordersRouter.stack[0].route.methods.post);
});

test('order parser normalizes valid form data', () => {
  const result = parseOrder({ ...validOrder, 'delivery-date': validOrder.deliveryDate });
  assert.deepEqual(result.order, {
    ...validOrder,
    deliveryDate: validOrder.deliveryDate,
  });
});

test('order parser rejects missing fields, invalid email, short volume, and impossible dates', () => {
  assert.ok(parseOrder({}).error);
  assert.ok(parseOrder({ ...validOrder, email: 'not-an-email' }).error);
  assert.ok(parseOrder({ ...validOrder, volume: 9 }).error);
  assert.ok(parseOrder({ ...validOrder, deliveryDate: '2026-02-30' }).error);
});