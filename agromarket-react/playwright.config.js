import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 90_000,               // сервер Free может «просыпаться» до минуты
  expect: { timeout: 15_000 },
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  projects: [
    {
      name: 'desktop',
      testMatch: '**/buyer.spec.js',
    },
    {
      name: 'Pixel 7',
      testMatch: '**/mobile.spec.js',
      use: { ...devices['Pixel 7'] },
    },
  ],
  use: {
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:5173',
    trace: 'retain-on-failure',  // при падении — «запись» каждого шага
    screenshot: 'only-on-failure',
  },
});