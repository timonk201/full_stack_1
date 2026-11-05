const API_URL = process.env.API_URL?.replace(/\/+$/, '');
const FRONTEND_URL = process.env.FRONTEND_URL;
const EXPECTED_VERSION = (process.env.EXPECTED_VERSION || '').slice(0, 7);

if (!API_URL) {
  console.error('Не задан API_URL');
  process.exit(1);
}

if (!FRONTEND_URL) {
  console.error('Не задан FRONTEND_URL');
  process.exit(1);
}

let frontendOrigin;
try {
  frontendOrigin = new URL(FRONTEND_URL).origin;
} catch {
  console.error('FRONTEND_URL должен быть корректным URL');
  process.exit(1);
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function waitForVersion() {
  for (let attempt = 1; attempt <= 40; attempt++) {
    try {
      const response = await fetch(`${API_URL}/health`, {
        signal: AbortSignal.timeout(20_000),
      });
      const body = await response.json();
      console.log(`#${attempt}: HTTP ${response.status}, версия ${body.version}`);
      if (response.ok && (!EXPECTED_VERSION || body.version === EXPECTED_VERSION)) {
        return body;
      }
    } catch (error) {
      console.log(`#${attempt}: сервер пока не отвечает (${error.message})`);
    }
    await sleep(15_000);
  }

  throw new Error(`Не дождались версии ${EXPECTED_VERSION || '(любой)'} за ~10 минут`);
}

const checks = [];
const check = (name, fn) => checks.push({ name, fn });
const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

check('каталог отдаёт непустой список', async () => {
  const response = await fetch(`${API_URL}/products`);
  const list = await response.json();
  assert(response.status === 200, `статус ${response.status}`);
  assert(Array.isArray(list) && list.length > 0, 'список пуст');
});

check('без токена товар не создать (401)', async () => {
  const response = await fetch(`${API_URL}/products`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'smoke', price: 1 }),
  });
  assert(response.status === 401, `ожидали 401, получили ${response.status}`);
});

check('CORS: фронтенд допущен', async () => {
  const response = await fetch(`${API_URL}/products`, {
    headers: { Origin: frontendOrigin },
  });
  assert(response.headers.get('access-control-allow-origin') === frontendOrigin,
    'сервер не разрешил Origin фронтенда');
});

check('несуществующий товар — 404', async () => {
  const response = await fetch(`${API_URL}/products/999999`);
  assert(response.status === 404, `ожидали 404, получили ${response.status}`);
});

async function main() {
  const health = await waitForVersion();
  assert(health.db === 'ok', `база недоступна: ${health.db}`);
  console.log(`API работает: версия ${health.version}, база ${health.db}`);

  let failed = 0;
  for (const { name, fn } of checks) {
    try {
      await fn();
      console.log(`✓ ${name}`);
    } catch (error) {
      failed++;
      console.log(`✗ ${name}: ${error.message}`);
    }
  }

  if (failed > 0) {
    throw new Error(`Провалено проверок: ${failed}`);
  }
  console.log('Smoke-тест пройден');
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
