import { test, expect } from '@playwright/test';

test('на Pixel 7 работают навигация и каталог', async ({ page }) => {
  await page.goto('/');

  const catalogLink = page
    .getByRole('navigation', { name: 'Основная навигация' })
    .getByRole('link', { name: 'Каталог' });
  await expect(catalogLink).toBeVisible();
  await catalogLink.click();
  await expect(page).toHaveURL(/#catalog$/);

  const firstProduct = page.getByRole('article').first();
  await expect(firstProduct).toBeVisible({ timeout: 75_000 });
  const bounds = await firstProduct.boundingBox();

  expect(bounds).not.toBeNull();
  expect(bounds.x).toBeGreaterThanOrEqual(0);
  expect(bounds.x + bounds.width).toBeLessThanOrEqual(page.viewportSize().width);
});