import express from 'express';
import { logger } from './middleware/logger.js';
import cors from 'cors';
import { productsRouter } from './routes/products.js';
import { ordersRouter } from './routes/orders.js';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const app = express();
app.use(cors({ origin: 'http://localhost:5173' })); // разрешаем только наш frontend
app.use(express.json());
app.use(logger);

app.get('/', (req, res) => {
  res.send('АгроМаркет API работает');
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

app.use('/api/products', productsRouter);
app.use('/api/orders', ordersRouter);

app.use((req, res) => {
  res.status(404).json({ error: `Маршрут ${req.method} ${req.originalUrl} не найден` });
});

app.use((error, req, res, next) => {
  if (res.headersSent) {
    return next(error);
  }

  const status = error.status || 500;
  res.status(status).json({
    error: status === 400 ? 'Некорректный JSON в теле запроса' : 'Внутренняя ошибка сервера',
  });
});

export { app };

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`API запущен: http://localhost:${PORT}`);
  });
}
