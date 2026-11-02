import 'dotenv/config';
import app from './app.js';
const PORT = process.env.PORT || 3000;

if (!process.env.JWT_SECRET) {
  console.error('Не задан JWT_SECRET в .env');
  process.exit(1);
}

app.listen(PORT, () => {
  console.log(`API запущен: http://localhost:${PORT}`);
});
