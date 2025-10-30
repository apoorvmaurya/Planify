import { test, expect } from '@playwright/test';

test('homepage has title and correct content', async ({ page }) => {
  await page.goto('/');

  await expect(page).toHaveTitle(/Planora/);
  
  const heading = page.getByRole('heading', { name: /Welcome to Planora/i });
  await expect(heading).toBeVisible();
});

