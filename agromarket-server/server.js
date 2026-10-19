import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { logger } from './middleware/logger.js';
import { errorHandler } from './middleware/errorHandler.js';
import { pool } from './db/pool.js';
import { productsRouter } from './routes/products.js';
import { ordersRouter } from './routes/orders.js';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import authRouter from './routes/auth.js'

const app = express();
const PORT = process.env.PORT || 3000;

if (!process.env.JWT_SECRET) {
  console.error('Не задан JWT_SECRET в .env');
  process.exit(1);
}

app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:5173' }));
app.use(express.json({ limit: '10kb' }));
app.use(logger);

app.get('/', (req, res) => {
  res.send('АгроМаркет API работает');
});

app.get('/api/health', async (req, res) => {
  await pool.query('SELECT 1');
  res.json({ status: 'ok', db: 'connected', time: new Date().toISOString() });
});

app.use('/api/auth', authRouter);

app.use('/api/products', productsRouter);
app.use('/api/orders', ordersRouter);

app.use((req, res) => {
  res.status(404).json({ error: `Маршрут ${req.method} ${req.originalUrl} не найден` });
});

app.use(errorHandler);

export { app };

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  app.listen(PORT, () => {
    console.log(`API запущен: http://localhost:${PORT}`);
  });
}
