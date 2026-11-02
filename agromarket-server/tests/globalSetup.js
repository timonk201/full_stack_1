import { execSync } from 'node:child_process';

export default function setup() {
  const target = process.env.DATABASE_URL || process.env.PGDATABASE || '';
  if (!target.includes('test')) {
    throw new Error('Тесты должны работать с тестовой базой! Проверьте .env.test');
  }

  execSync('npm run db:init', { stdio: 'inherit' });
}