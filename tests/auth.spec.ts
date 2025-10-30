import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display landing page with sign in and sign up buttons', async ({ page }) => {
    await expect(page.getByText('Plan Together, Decide Smarter')).toBeVisible();
    await expect(page.getByRole('link', { name: /sign in/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /get started/i })).toBeVisible();
  });

  test('should navigate to login page', async ({ page }) => {
    await page.getByRole('link', { name: /sign in/i }).first().click();
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByText('Welcome back')).toBeVisible();
  });

  test('should navigate to signup page', async ({ page }) => {
    await page.getByRole('link', { name: /get started/i }).first().click();
    await expect(page).toHaveURL(/\/signup/);
  });

  test('should show validation errors on empty login form submission', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: /sign in/i }).click();
    
    // Wait for form validation to appear
    await page.waitForTimeout(500);
    
    // Check for validation messages or that the form didn't submit
    const errorMessages = page.locator('text=/invalid|required|email/i');
    const count = await errorMessages.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should show OAuth options on login page', async ({ page }) => {
    await page.goto('/login');
    
    // Check for OAuth buttons
    await expect(page.getByRole('button', { name: /google/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /microsoft/i })).toBeVisible();
  });

  test('should have link to signup from login page', async ({ page }) => {
    await page.goto('/login');
    
    const signupLink = page.getByRole('link', { name: /sign up/i });
    await expect(signupLink).toBeVisible();
    await signupLink.click();
    await expect(page).toHaveURL(/\/signup/);
  });

  test('should redirect to dashboard when accessing protected route without auth', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Should redirect to login
    await page.waitForURL(/\/(login|auth)/);
    expect(page.url()).toMatch(/\/(login|auth)/);
  });
});

