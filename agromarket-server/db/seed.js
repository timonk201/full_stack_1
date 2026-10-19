import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { pool } from './pool.js';
import bcrypt from 'bcryptjs';

const currentDirectory = dirname(fileURLToPath(import.meta.url));
const serverDirectory = resolve(currentDirectory, '..');
const schema = readFileSync(resolve(currentDirectory, 'schema.sql'), 'utf8');
const { products } = JSON.parse(
  readFileSync(resolve(serverDirectory, 'data/db.json'), 'utf8'),
);

if (!Array.isArray(products)) {
  throw new Error('Ожидался массив products в data/db.json');
}

try {
  await pool.query(schema);

  const { rows } = await pool.query('SELECT COUNT(*)::integer AS count FROM products');
  if (rows[0].count > 0) {
    console.log(`Таблицы готовы; существующие товары сохранены (${rows[0].count})`);
  } else {
    const validProducts = products.filter((product) => {
      const price = Number(product.price);
      const isValid = typeof product.name === 'string'
        && product.name.trim().length > 0
        && Number.isInteger(price)
        && price >= 0;

      if (!isValid) {
        console.warn(`Товар пропущен при импорте из-за некорректных данных: ${JSON.stringify(product)}`);
      }

      return isValid;
    });

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      for (const product of validProducts) {
        await client.query(
          `INSERT INTO products (name, category, price, unit, image)
           VALUES ($1, $2, $3, $4, $5)`,
          [
            product.name.trim(),
            product.category ?? null,
            Number(product.price),
            product.unit ?? 'кг',
            product.image ?? null,
          ],
        );
      }
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

    const hash = await bcrypt.hash(process.env.ADMIN_PASSWORD, 10);
    await pool.query(
      `INSERT INTO users (name, email, password_hash, role)
      VALUES ($1, $2, $3, 'admin')`,
      ['Администратор', process.env.ADMIN_EMAIL, hash]
    );

    console.log(
      `Готово: товаров — ${products.length}, админ — ${process.env.ADMIN_EMAIL}`
    );
  }
} finally {
  await pool.end();
}
