import assert from 'node:assert/strict';
import test from 'node:test';
import { parseOrder, ordersRouter } from '../routes/orders.js';
import { productsRouter, validateProduct } from '../routes/products.js';

test('products router exposes the complete CRUD routes', () => {
  const routes = productsRouter.stack.map((layer) => ({
    path: layer.route.path,
    methods: Object.keys(layer.route.methods),
  }));

  assert.deepEqual(routes, [
    { path: '/', methods: ['get'] },
    { path: '/:id', methods: ['get'] },
    { path: '/', methods: ['post'] },
    { path: '/:id', methods: ['put'] },
    { path: '/:id', methods: ['delete'] },
  ]);
});

test('product validation accepts a non-negative integer price', () => {
  assert.equal(validateProduct({ name: 'Мёд', price: 450 }), null);
  assert.equal(validateProduct({ name: 'Мёд', price: '450' }), null);
});

test('product validation rejects missing names and invalid prices', () => {
  assert.equal(validateProduct({ price: 10 }), 'Поле name обязательно');
  assert.match(validateProduct({ name: 'Мёд', price: -1 }), /price/);
  assert.match(validateProduct({ name: 'Мёд', price: 1.5 }), /price/);
  assert.match(validateProduct([]), /JSON-объект/);
});

test('orders router exposes persistent read, create, and status update routes', () => {
  const routes = ordersRouter.stack.map((layer) => ({
    path: layer.route.path,
    methods: Object.keys(layer.route.methods),
  }));

  assert.deepEqual(routes, [
    { path: '/', methods: ['get'] },
    { path: '/', methods: ['post'] },
    { path: '/:id', methods: ['patch'] },
  ]);
});

test('order parser accepts the documented API fields', () => {
  const result = parseOrder({
    product_id: 3,
    name: ' Ферма "Рассвет" ',
    email: 'farm@example.kz',
    phone: '+7 700 123 45 67',
    quantity: 25,
    date: '2026-10-12',
    comment: 'Позвонить перед доставкой',
  });

  assert.deepEqual(result.order, {
    productId: 3,
    name: 'Ферма "Рассвет"',
    email: 'farm@example.kz',
    phone: '+7 700 123 45 67',
    quantity: 25,
    deliveryDate: '2026-10-12',
    comment: 'Позвонить перед доставкой',
  });
});

test('order parser accepts the existing React form field names', () => {
  const result = parseOrder({
    name: 'Ферма',
    email: 'farm@example.kz',
    volume: '30',
    deliveryDate: '2026-10-12',
  });

  assert.equal(result.order.quantity, 30);
  assert.equal(result.order.deliveryDate, '2026-10-12');
});

test('order parser rejects missing fields, invalid email, short quantity, and bad dates', () => {
  assert.ok(parseOrder({}).error);
  assert.ok(parseOrder({ name: 'Ферма', email: 'invalid', quantity: 10 }).error);
  assert.match(parseOrder({ name: 'Ферма', email: 'a@b.kz', quantity: 5 }).error, /10 кг/);
  assert.ok(parseOrder({
    name: 'Ферма',
    email: 'a@b.kz',
    quantity: 10,
    date: '2026-02-30',
  }).error);
});
