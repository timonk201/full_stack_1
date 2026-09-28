import { Router } from 'express';

export const ordersRouter = Router();

export function parseOrder(payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return { error: 'Тело заявки должно быть JSON-объектом' };
  }

  const order = {
    name: typeof payload.name === 'string' ? payload.name.trim() : '',
    email: typeof payload.email === 'string' ? payload.email.trim() : '',
    phone: typeof payload.phone === 'string' ? payload.phone.trim() : '',
    volume: Number(payload.volume),
    deliveryDate: String(payload.deliveryDate ?? payload['delivery-date'] ?? '').trim(),
    comment: typeof payload.comment === 'string' ? payload.comment.trim() : '',
  };

  if (!order.name || !order.email || !order.phone || !order.deliveryDate) {
    return { error: 'Заполните имя, email, телефон и дату доставки' };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(order.email)) {
    return { error: 'Укажите корректный email' };
  }
  if (!Number.isFinite(order.volume) || order.volume < 10) {
    return { error: 'Объём заказа должен быть не менее 10 кг' };
  }
  const parsedDate = new Date(`${order.deliveryDate}T00:00:00.000Z`);
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(order.deliveryDate) ||
    Number.isNaN(parsedDate.getTime()) ||
    parsedDate.toISOString().slice(0, 10) !== order.deliveryDate
  ) {
    return { error: 'Укажите дату доставки в формате ГГГГ-ММ-ДД' };
  }

  return { order };
}

let nextOrderId = 1;
const orders = [];

ordersRouter.post('/', (req, res) => {
  const result = parseOrder(req.body);
  if (result.error) {
    return res.status(400).json({ error: result.error });
  }

  const order = { id: nextOrderId++, ...result.order };
  orders.push(order);
  res.status(201).json({ message: 'Заявка принята', order });
});