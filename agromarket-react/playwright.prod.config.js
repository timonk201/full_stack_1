import { defineConfig } from '@playwright/test';
import baseConfig from './playwright.config.js';

const baseURL = process.env.E2E_BASE_URL;

if (!baseURL) {
  throw new Error('Set E2E_BASE_URL to the production site URL before running production E2E tests.');
}

export default defineConfig({
  ...baseConfig,
  use: {
    ...baseConfig.use,
    baseURL,
  },
});