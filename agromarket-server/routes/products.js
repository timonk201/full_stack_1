import { Router } from 'express';
import { pool } from '../db/pool.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();
const adminOnly = [requireAuth, requireRole('admin')]

export function validateProduct(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return 'Тело товара должно быть JSON-объектом';
  }

  if (typeof body.name !== 'string' || !body.name.trim()) {
    return 'Поле name обязательно';
  }

  const price = Number(body.price);
  if (
    body.price === undefined
    || body.price === null
    || body.price === ''
    || !Number.isInteger(price)
    || price < 0
  ) {
    return 'Поле price должно быть целым числом ≥ 0';
  }

  return null;
}

router.get('/', async (req, res) => {
  const search = typeof req.query.search === 'string' ? req.query.search : '';
  const { rows } = await pool.query(
    'SELECT * FROM products WHERE name ILIKE $1 ORDER BY id',
    [`%${search}%`],
  );
  res.json(rows);
});

router.get('/:id', async (req, res) => {
  const { rows } = await pool.query(
    'SELECT * FROM products WHERE id = $1',
    [req.params.id],
  );
  if (rows.length === 0) {
    return res.status(404).json({ error: 'Товар не найден' });
  }

  res.json(rows[0]);
});

router.post('/', adminOnly, async (req, res) => { 
  const body = req.body ?? {};
  const error = validateProduct(body);
  if (error) {
    return res.status(400).json({ error });
  }

  const { name, category, price, unit, image } = body;
  const { rows } = await pool.query(
    `INSERT INTO products (name, category, price, unit, image)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [name.trim(), category ?? null, Number(price), unit ?? 'кг', image ?? null],
  );
  res.status(201).json(rows[0]);
});

router.put('/:id', adminOnly, async (req, res) => { 
  const body = req.body ?? {};
  const error = validateProduct(body);
  if (error) {
    return res.status(400).json({ error });
  }

  const { name, category, price, unit, image } = body;
  const { rows } = await pool.query(
    `UPDATE products
     SET name = $1, category = $2, price = $3, unit = $4, image = $5
     WHERE id = $6
     RETURNING *`,
    [name.trim(), category ?? null, Number(price), unit ?? 'кг', image ?? null, req.params.id],
  );
  if (rows.length === 0) {
    return res.status(404).json({ error: 'Товар не найден' });
  }

  res.json(rows[0]);
});

router.delete('/:id', adminOnly, async (req, res) => { 
  const { rowCount } = await pool.query(
    'DELETE FROM products WHERE id = $1',
    [req.params.id],
  );
  if (rowCount === 0) {
    return res.status(404).json({ error: 'Товар не найден' });
  }

  res.status(204).end();
});

export { router as productsRouter };
export default router;