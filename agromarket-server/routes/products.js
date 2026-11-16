import { Router } from 'express';
import { pool } from '../db/pool.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { idParam } from '../middleware/idParam.js';
import { validate } from '../middleware/validate.js';
import { productSchema, productUpdateSchema } from '../validation/schemas.js';

const router = Router();
const adminOnly = [requireAuth, requireRole('admin')];

router.get('/', async (req, res) => {
  const search = typeof req.query.search === 'string' ? req.query.search : '';
  const { rows } = await pool.query(
    'SELECT * FROM products WHERE name ILIKE $1 ORDER BY id',
    [`%${search}%`],
  );
  res.json(rows);
});

router.get('/:id', idParam, async (req, res) => {
  const { rows } = await pool.query(
    'SELECT * FROM products WHERE id = $1',
    [req.params.id],
  );
  if (rows.length === 0) {
    return res.status(404).json({ error: 'Товар не найден' });
  }

  res.json(rows[0]);
});

router.post('/', adminOnly, validate(productSchema), async (req, res) => {
  const body = req.body;
  const { name, category, price, unit, image } = body;
  const { rows } = await pool.query(
    `INSERT INTO products (name, category, price, unit, image)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [name, category ?? null, price, unit ?? 'кг', image ?? null],
  );
  res.status(201).json(rows[0]);
});

router.put('/:id', idParam, ...adminOnly, validate(productSchema), async (req, res) => {
  const body = req.body;
  const { name, category, price, unit, image } = body;
  const { rows } = await pool.query(
    `UPDATE products
     SET name = $1, category = $2, price = $3, unit = $4, image = $5
     WHERE id = $6
     RETURNING *`,
    [name, category ?? null, price, unit ?? 'кг', image ?? null, req.params.id],
  );
  if (rows.length === 0) {
    return res.status(404).json({ error: 'Товар не найден' });
  }

  res.json(rows[0]);
});

router.patch('/:id', idParam, ...adminOnly, validate(productUpdateSchema), async (req, res) => {
  const columns = {
    name: 'name',
    category: 'category',
    price: 'price',
    unit: 'unit',
    image: 'image',
  };
  const updates = Object.entries(req.body);
  const values = updates.map(([, value]) => value);
  const setClause = updates
    .map(([field], index) => `${columns[field]} = $${index + 1}`)
    .join(', ');
  values.push(req.params.id);

  const { rows } = await pool.query(
    `UPDATE products SET ${setClause} WHERE id = $${values.length} RETURNING *`,
    values,
  );
  if (rows.length === 0) {
    return res.status(404).json({ error: 'Товар не найден' });
  }

  res.json(rows[0]);
});

router.delete('/:id', idParam, ...adminOnly, async (req, res) => {
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