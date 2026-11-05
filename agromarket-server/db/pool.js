import pg from 'pg';

pg.types.setTypeParser(1082, (value) => value);

export const pool = new pg.Pool({
  // Локально и в CI — ваша строка подключения; на Render — строка от Neon.
  // SSL включается параметром ?sslmode=require в самой строке.
  connectionString: process.env.DATABASE_URL,
  max: 5,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 10_000,
});

// Необработанная ошибка простаивающего соединения не должна завершать процесс.
pool.on('error', (err) => {
  console.error('PostgreSQL: соединение потеряно —', err.message);
});