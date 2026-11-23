import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { configDefaults } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',             // в тестах есть document, window
    globals: true,
    setupFiles: './src/test/setup.js',
    exclude: [...configDefaults.exclude, 'e2e/**'],
    include: ['src/**/*.test.{js,jsx}'], // e2e-тесты Playwright сюда не попадут
    css: false,
  },
});