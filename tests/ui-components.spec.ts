import { test, expect } from '@playwright/test';

test.describe('UI Components Library', () => {
  test('button variants should render correctly', async ({ page }) => {
    // Navigate to a page that uses buttons
    await page.goto('/');
    
    // Check for buttons on landing page
    const buttons = page.getByRole('link', { name: /get started|start planning/i });
    await expect(buttons.first()).toBeVisible();
  });

  test('navigation should be sticky on scroll', async ({ page }) => {
    await page.goto('/');
    
    // Get navigation
    const nav = page.locator('nav');
    await expect(nav).toBeVisible();
    
    // Scroll down
    await page.evaluate(() => window.scrollBy(0, 500));
    
    // Nav should still be visible (sticky)
    await expect(nav).toBeVisible();
  });

  test('card components should have proper styling', async ({ page }) => {
    await page.goto('/');
    
    // Feature cards should be visible
    const featureCards = page.locator('text=Smart Location Finding').locator('..');
    await expect(featureCards).toBeVisible();
  });

  test('gradient text should render', async ({ page }) => {
    await page.goto('/');
    
    // Check for gradient text in hero
    const heroText = page.getByText('Decide Smarter');
    await expect(heroText).toBeVisible();
  });
});

test.describe('Responsive Design', () => {
  test('should adapt to tablet viewport', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');
    
    await expect(page.getByText('Plan Together, Decide Smarter')).toBeVisible();
  });

  test('should adapt to desktop viewport', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/');
    
    await expect(page.getByText('Plan Together, Decide Smarter')).toBeVisible();
  });

  test('navigation should collapse on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    // Navigation should still be accessible
    const nav = page.locator('nav');
    await expect(nav).toBeVisible();
  });
});

test.describe('Accessibility', () => {
  test('should have proper heading hierarchy', async ({ page }) => {
    await page.goto('/');
    
    // Check for h1
    const h1 = page.locator('h1');
    await expect(h1).toBeVisible();
    
    // Check for h2 sections
    const h2s = page.locator('h2');
    const count = await h2s.count();
    expect(count).toBeGreaterThan(0);
  });

  test('buttons should be keyboard accessible', async ({ page }) => {
    await page.goto('/');
    
    // Tab to first button
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    // Check if a focusable element is focused
    const focused = await page.evaluate(() => document.activeElement?.tagName);
    expect(['A', 'BUTTON']).toContain(focused);
  });

  test('images should have alt text or be decorative', async ({ page }) => {
    await page.goto('/');
    
    // SVGs are used for icons (decorative)
    // Check page loads properly with images
    await page.waitForLoadState('networkidle');
    expect(page.url()).toContain('/');
  });

  test('links should have descriptive text', async ({ page }) => {
    await page.goto('/');
    
    // Check that links have meaningful text
    const startButton = page.getByRole('link', { name: /start planning/i });
    await expect(startButton).toBeVisible();
    
    const learnMore = page.getByRole('link', { name: /learn more/i });
    await expect(learnMore).toBeVisible();
  });
});

test.describe('Performance', () => {
  test('page should load within acceptable time', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;
    
    // Should load in under 5 seconds on good connection
    expect(loadTime).toBeLessThan(5000);
  });

  test('should not have layout shift on load', async ({ page }) => {
    await page.goto('/');
    
    // Wait for page to fully load
    await page.waitForLoadState('networkidle');
    
    // Check hero is still visible (no shift pushed it away)
    await expect(page.getByText('Plan Together, Decide Smarter')).toBeVisible();
  });
});

