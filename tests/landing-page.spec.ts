import { test, expect } from '@playwright/test';

test.describe('Landing Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display hero section with main heading', async ({ page }) => {
    await expect(page.getByText('Plan Together, Decide Smarter')).toBeVisible();
    await expect(page.getByText(/AI-powered event planning/i)).toBeVisible();
  });

  test('should have prominent CTA buttons', async ({ page }) => {
    const startPlanningButton = page.getByRole('link', { name: /start planning free/i });
    await expect(startPlanningButton).toBeVisible();
    
    const learnMoreButton = page.getByRole('link', { name: /learn more/i });
    await expect(learnMoreButton).toBeVisible();
  });

  test('should display feature cards', async ({ page }) => {
    // Check for key features
    await expect(page.getByText('Smart Location Finding')).toBeVisible();
    await expect(page.getByText('Calendar Integration')).toBeVisible();
    await expect(page.getByText('AI Recommendations')).toBeVisible();
    await expect(page.getByText('Real-Time Polling')).toBeVisible();
    await expect(page.getByText('PlanPal AI Assistant')).toBeVisible();
    await expect(page.getByText('Learning Preferences')).toBeVisible();
  });

  test('should have navigation bar with Planora branding', async ({ page }) => {
    await expect(page.getByText('Planora').first()).toBeVisible();
  });

  test('should show how it works section with 4 steps', async ({ page }) => {
    await expect(page.getByText('Create a Group')).toBeVisible();
    await expect(page.getByText('Plan an Event')).toBeVisible();
    await expect(page.getByText('Vote Together')).toBeVisible();
    await expect(page.getByText('Enjoy!')).toBeVisible();
  });

  test('should display testimonials section', async ({ page }) => {
    await expect(page.getByText('Loved by Groups Everywhere')).toBeVisible();
    
    // Check for testimonial names
    await expect(page.getByText('Sarah Chen')).toBeVisible();
    await expect(page.getByText('Marcus Rodriguez')).toBeVisible();
    await expect(page.getByText('Aisha Patel')).toBeVisible();
  });

  test('should show rating stars in testimonials', async ({ page }) => {
    // Testimonials should have 5-star ratings
    const stars = page.locator('svg').filter({ hasText: '' });
    const count = await stars.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should have final CTA section', async ({ page }) => {
    await expect(page.getByText('Ready to Stop the Planning Chaos?')).toBeVisible();
    await expect(page.getByText(/join thousands of groups/i)).toBeVisible();
  });

  test('should have footer with links', async ({ page }) => {
    // Scroll to footer
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    
    const footer = page.locator('footer');
    await expect(footer).toBeVisible();
    
    // Check for footer sections
    await expect(footer.getByText('Product')).toBeVisible();
    await expect(footer.getByText('Company')).toBeVisible();
    await expect(footer.getByText('Legal')).toBeVisible();
  });

  test('feature cards should be hoverable', async ({ page }) => {
    const firstFeatureCard = page.locator('text=Smart Location Finding').locator('..');
    
    // Hover over the card
    await firstFeatureCard.hover();
    
    // Card should still be visible after hover
    await expect(firstFeatureCard).toBeVisible();
  });

  test('should show trust indicators', async ({ page }) => {
    await expect(page.getByText('Free Forever')).toBeVisible();
    await expect(page.getByText('No Credit Card')).toBeVisible();
    await expect(page.getByText('AI-Powered')).toBeVisible();
  });

  test('learn more button should scroll to features', async ({ page }) => {
    const learnMoreButton = page.getByRole('link', { name: /learn more/i });
    await learnMoreButton.click();
    
    // Should scroll to features section
    await page.waitForTimeout(500);
    
    // Check if features section is in viewport
    const featuresSection = page.locator('text=Everything You Need for Perfect Events');
    await expect(featuresSection).toBeVisible();
  });

  test('should be mobile responsive', async ({ page }) => {
    // Set viewport to mobile size
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Check that key elements are still visible
    await expect(page.getByText('Plan Together, Decide Smarter')).toBeVisible();
    await expect(page.getByRole('link', { name: /start planning free/i })).toBeVisible();
  });

  test('should load without JavaScript errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Should have no JavaScript errors
    expect(errors).toHaveLength(0);
  });
});

