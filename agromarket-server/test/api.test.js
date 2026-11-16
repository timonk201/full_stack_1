import assert from 'node:assert/strict';
import express from 'express';
import test from 'node:test';
import { errorHandler } from '../middleware/errorHandler.js';
import { requireRole } from '../middleware/auth.js';
import authRouter from '../routes/auth.js';
import { parseOrder, ordersRouter } from '../routes/orders.js';
import { productsRouter } from '../routes/products.js';

test('role middleware rejects other roles and forwards matching roles', () => {
  let statusCode;
  let responseBody;
  let nextCalled = false;
  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(body) {
      responseBody = body;
      return this;
    },
  };

  requireRole('admin')({ user: { role: 'user' } }, res, () => {});
  assert.equal(statusCode, 403);
  assert.deepEqual(responseBody, { error: 'Недостаточно прав' });

  requireRole('admin')({ user: { role: 'admin' } }, res, () => {
    nextCalled = true;
  });
  assert.equal(nextCalled, true);
});

test('duplicate database entries return 409', () => {
  let statusCode;
  let responseBody;
  const res = {
    headersSent: false,
    status(code) {
      statusCode = code;
      return this;
    },
    json(body) {
      responseBody = body;
      return this;
    },
  };

  errorHandler({ code: '23505' }, {}, res, () => {});
  assert.equal(statusCode, 409);
  assert.deepEqual(responseBody, { error: 'Такая запись уже существует' });
});

test('oversized JSON bodies return 413', () => {
  let statusCode;
  let responseBody;
  const res = {
    headersSent: false,
    status(code) {
      statusCode = code;
      return this;
    },
    json(body) {
      responseBody = body;
      return this;
    },
  };

  errorHandler({ type: 'entity.too.large' }, {}, res, () => {});
  assert.equal(statusCode, 413);
  assert.deepEqual(responseBody, { error: 'Слишком большой запрос' });
});

test('login route applies a rate limiter before its handler', () => {
  const loginRoute = authRouter.stack.find((layer) => layer.route?.path === '/login');
  assert.equal(loginRoute.route.stack.length, 3);
});

test('auth rate limiter blocks attempts after the tenth failed request', async () => {
  const previousNodeEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = 'development';
  const app = express();
  app.use(express.json());
  app.use('/api/auth', authRouter);
  const server = app.listen(0);

  try {
    const { port } = server.address();
    const statuses = [];
    for (let attempt = 0; attempt < 11; attempt += 1) {
      const response = await fetch(`http://127.0.0.1:${port}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{}',
      });
      statuses.push(response.status);
      await response.arrayBuffer();
    }

    assert.deepEqual(statuses, [...Array(10).fill(400), 429]);
  } finally {
    await new Promise((resolve) => server.close(resolve));
    if (previousNodeEnv === undefined) {
      delete process.env.NODE_ENV;
    } else {
      process.env.NODE_ENV = previousNodeEnv;
    }
  }
});

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
    { path: '/:id', methods: ['patch'] },
    { path: '/:id', methods: ['delete'] },
  ]);
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
  assert.deepEqual(ordersRouter.stack.map((layer) => layer.route.stack.length), [3, 1, 4]);
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
