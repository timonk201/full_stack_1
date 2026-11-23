import { test, expect } from '@playwright/test';

test('@smoke главная открывается, каталог показывает товары', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/АгроМаркет/i);
  await expect(page.getByTestId('product-card').first()).toBeVisible();
});

test('@smoke поиск фильтрует каталог без изменения данных', async ({ page }) => {
  await page.goto('/');
  const firstProduct = page.getByTestId('product-card').first();
  await expect(firstProduct).toBeVisible();

  await page.getByRole('searchbox').fill('мёд');
  await expect(page.getByRole('heading', { name: 'Мёд натуральный, 1 л' })).toBeVisible();
  await expect(page.getByTestId('product-card')).toHaveCount(1);
});
