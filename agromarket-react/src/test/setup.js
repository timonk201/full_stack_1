import '@testing-library/jest-dom/vitest'; // матчеры toBeInTheDocument, toBeDisabled...
import { cleanup } from '@testing-library/react';
import { afterAll, afterEach, beforeAll, vi } from 'vitest';
import { server } from './server.js';

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));

afterEach(() => {
  server.resetHandlers();
  cleanup();             // убираем отрисованное после каждого теста
  vi.restoreAllMocks();  // и все подмены
  localStorage.clear();  // токен из прошлого теста не должен мешать
});

afterAll(() => server.close());