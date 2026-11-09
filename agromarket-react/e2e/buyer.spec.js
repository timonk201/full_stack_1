import { test, expect } from '@playwright/test';

const email = `e2e+${Date.now()}@agromarket.test`;
const password = 'E2e-Test-Password-123';
const apiColdStartTimeout = 75_000;

test('каталог загружается с сервера', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/АгроМаркет/i);
  await expect(page.getByRole('article').first()).toBeVisible({ timeout: apiColdStartTimeout });
});

test('прямая ссылка на внутреннюю страницу не даёт 404', async ({ page }) => {
  const response = await page.goto('/login');

  expect(response).not.toBeNull();
  expect(response.status()).toBe(200);
  await expect(page.getByRole('heading', { name: 'Каталог' })).toBeVisible();
});

test('покупатель регистрируется, добавляет товар и отправляет заявку', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /нет аккаунта/i }).click();

  const registrationForm = page.locator('form').filter({
    has: page.getByRole('button', { name: 'Зарегистрироваться' }),
  });
  await registrationForm.getByRole('textbox', { name: 'Имя' }).fill('E2E Покупатель');
  await registrationForm.getByRole('textbox', { name: 'Email' }).fill(email);
  await registrationForm.getByRole('textbox', { name: 'Пароль' }).fill(password);
  await registrationForm.getByRole('button', { name: 'Зарегистрироваться' }).click();

  await expect(page.getByText(/вы вошли как E2E Покупатель/i)).toBeVisible({
    timeout: apiColdStartTimeout,
  });
  await page.getByRole('article').first().getByRole('button', { name: 'В корзину' }).click();
  await expect(page.getByText('Корзина: 1')).toBeVisible();

  const orderForm = page.locator('form').filter({
    has: page.getByRole('button', { name: 'Отправить заявку' }),
  });
  const deliveryDate = new Date(Date.now() + 86_400_000).toISOString().slice(0, 10);
  await orderForm.getByRole('textbox', { name: 'Имя / организация' }).fill('E2E Покупатель');
  await orderForm.getByRole('textbox', { name: 'Email' }).fill(email);
  await orderForm.getByRole('textbox', { name: 'Телефон' }).fill('+77010000000');
  await orderForm.getByRole('spinbutton', { name: 'Объём заказа, кг' }).fill('10');
  await orderForm.getByRole('textbox', { name: 'Желаемая дата доставки' }).fill(deliveryDate);
  await orderForm.getByRole('button', { name: 'Отправить заявку' }).click();

  await expect(orderForm.getByRole('status')).toHaveText('Заявка отправлена! Мы свяжемся с вами.');
});

test('гость не видит admin-инструменты по прямой ссылке', async ({ page }) => {
  const response = await page.goto('/admin');

  expect(response).not.toBeNull();
  expect(response.status()).toBe(200);
  const loginForm = page.locator('form').filter({
    has: page.getByRole('button', { name: 'Войти' }),
  });
  await expect(loginForm).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Новый товар' })).not.toBeVisible();
});