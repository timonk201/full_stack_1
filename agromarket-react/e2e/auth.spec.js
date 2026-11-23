import { test, expect } from '@playwright/test';

test('неверный пароль показывает ошибку и не меняет страницу входа', async ({ page }) => {
  await page.goto('/');
  const loginForm = page.getByRole('form', { name: 'Вход' });
  await loginForm.getByLabel(/email/i).fill('nobody@agromarket.test');
  await loginForm.getByLabel(/пароль/i).fill('wrong-password');
  await loginForm.getByRole('button', { name: 'Войти' }).click();

  await expect(page.getByText(/неверн/i)).toBeVisible();
});
