import { defineConfig } from 'vitest/config';
import dotenv from 'dotenv';

const { parsed } = dotenv.config({ path: '.env.test', override: true, quiet: true });

export default defineConfig({
  test: {
    env: parsed,
    globalSetup: './tests/globalSetup.js',
    setupFiles: ['./tests/setup.js'],
    fileParallelism: false,
    include: ['tests/**/*.test.js'],
    coverage: {
      include: ['app.js', 'routes/**', 'middleware/**'],
    },
  },
});