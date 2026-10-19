import { Router } from 'express';
import { pool } from '../db/pool.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();
const adminOnly = [requireAuth, requireRole('admin')];

export function parseOrder(payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return { error: 'Тело заявки должно быть JSON-объектом' };
  }

  const rawQuantity = payload.quantity ?? payload.volume;
  const rawDeliveryDate = payload.date ?? payload.deliveryDate ?? payload['delivery-date'];
  const order = {
    name: typeof payload.name === 'string' ? payload.name.trim() : '',
    email: typeof payload.email === 'string' ? payload.email.trim() : '',
    phone: typeof payload.phone === 'string' ? payload.phone.trim() : '',
    quantity: Number(rawQuantity),
    deliveryDate: typeof rawDeliveryDate === 'string' ? rawDeliveryDate.trim() : '',
    comment: typeof payload.comment === 'string' ? payload.comment.trim() : '',
    productId: payload.product_id ?? payload.productId ?? null,
  };

  if (!order.name || !order.email || rawQuantity === undefined || rawQuantity === null || rawQuantity === '') {
    return { error: 'Поля name, email и quantity обязательны' };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(order.email)) {
    return { error: 'Укажите корректный email' };
  }
  if (!Number.isInteger(order.quantity) || order.quantity < 10) {
    return { error: 'Минимальный объём заказа — 10 кг' };
  }
  if (
    order.productId !== null
    && (!Number.isInteger(Number(order.productId)) || Number(order.productId) < 1)
  ) {
    return { error: 'Поле product_id должно быть положительным целым числом' };
  }

  if (order.deliveryDate) {
    const parsedDate = new Date(`${order.deliveryDate}T00:00:00.000Z`);
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(order.deliveryDate)
      || Number.isNaN(parsedDate.getTime())
      || parsedDate.toISOString().slice(0, 10) !== order.deliveryDate
    ) {
      return { error: 'Укажите дату доставки в формате ГГГГ-ММ-ДД' };
    }
  }

  if (typeof payload.phone !== 'undefined' && typeof payload.phone !== 'string') {
    return { error: 'Поле phone должно быть строкой' };
  }
  if (typeof payload.comment !== 'undefined' && typeof payload.comment !== 'string') {
    return { error: 'Поле comment должно быть строкой' };
  }

  return {
    order: {
      ...order,
      phone: order.phone || null,
      deliveryDate: order.deliveryDate || null,
      comment: order.comment || null,
      productId: order.productId === null ? null : Number(order.productId),
    },
  };
}

router.get('/', adminOnly, async (req, res) => {
  const { rows } = await pool.query(`
    SELECT o.*, p.name AS product_name
    FROM orders o
    LEFT JOIN products p ON p.id = o.product_id
    ORDER BY o.created_at DESC
  `);
  res.json(rows);
});

router.post('/', async (req, res) => {
  const result = parseOrder(req.body);
  if (result.error) {
    return res.status(400).json({ error: result.error });
  }

  const { productId, name, email, phone, quantity, deliveryDate, comment } = result.order;
  const { rows } = await pool.query(
    `INSERT INTO orders (product_id, name, email, phone, quantity, delivery_date, comment)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [productId, name, email, phone, quantity, deliveryDate, comment],
  );
  res.status(201).json(rows[0]);
});

router.patch('/:id', adminOnly, async (req, res) => {
  const { status } = req.body ?? {};
  if (status === undefined || status === null || status === '') {
    return res.status(400).json({ error: 'Поле status обязательно' });
  }

  const { rows } = await pool.query(
    'UPDATE orders SET status = $1 WHERE id = $2 RETURNING *',
    [status, req.params.id],
  );
  if (rows.length === 0) {
    return res.status(404).json({ error: 'Заявка не найдена' });
  }

  res.json(rows[0]);
});

export { router as ordersRouter };
export default router;