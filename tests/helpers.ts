import { Page } from '@playwright/test';

/**
 * Test helper utilities for Planora E2E tests
 */

/**
 * Setup authenticated session for tests
 * Note: This requires test user credentials in environment variables
 */
export async function setupAuthSession(page: Page) {
  const testEmail = process.env.TEST_USER_EMAIL;
  const testPassword = process.env.TEST_USER_PASSWORD;

  if (!testEmail || !testPassword) {
    console.warn('Test credentials not found. Some tests may fail.');
    return false;
  }

  // Navigate to login
  await page.goto('/login');

  // Fill in credentials
  await page.fill('input[type="email"]', testEmail);
  await page.fill('input[type="password"]', testPassword);

  // Submit form
  await page.click('button[type="submit"]');

  // Wait for redirect to dashboard
  await page.waitForURL('/dashboard', { timeout: 10000 });

  return true;
}

/**
 * Create a test group
 */
export async function createTestGroup(page: Page, name: string, description?: string) {
  await page.goto('/dashboard/create-group');

  await page.fill('input[name="name"]', name);
  
  if (description) {
    await page.fill('textarea[name="description"]', description);
  }

  await page.click('button[type="submit"]');

  // Wait for success or redirect
  await page.waitForTimeout(2000);

  return page.url();
}

/**
 * Create a test event
 */
export async function createTestEvent(page: Page, eventData: {
  title: string;
  groupId?: string;
  activityType?: string;
  mood?: string;
}) {
  await page.goto('/dashboard/create-event');

  await page.fill('input[name="title"]', eventData.title);

  if (eventData.groupId) {
    await page.selectOption('select[name="group_id"]', eventData.groupId);
  }

  if (eventData.activityType) {
    await page.fill('input[name="activity_type"]', eventData.activityType);
  }

  if (eventData.mood) {
    await page.fill('input[name="mood"]', eventData.mood);
  }

  await page.click('button[type="submit"]');

  // Wait for redirect
  await page.waitForTimeout(2000);

  return page.url();
}

/**
 * Wait for element to be visible with custom timeout
 */
export async function waitForVisible(page: Page, selector: string, timeout = 5000) {
  try {
    await page.waitForSelector(selector, { state: 'visible', timeout });
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(page: Page): Promise<boolean> {
  await page.goto('/dashboard');
  await page.waitForLoadState('networkidle');
  
  const url = page.url();
  return !url.includes('/login') && !url.includes('/auth');
}

/**
 * Logout user
 */
export async function logout(page: Page) {
  // Look for logout button/link
  const logoutButton = page.locator('text=/log out|sign out/i');
  
  if (await logoutButton.count() > 0) {
    await logoutButton.click();
    await page.waitForLoadState('networkidle');
  }
}

/**
 * Fill form with data
 */
export async function fillForm(page: Page, formData: Record<string, string>) {
  for (const [name, value] of Object.entries(formData)) {
    const input = page.locator(`input[name="${name}"], textarea[name="${name}"], select[name="${name}"]`);
    
    if (await input.count() > 0) {
      const tagName = await input.evaluate(el => el.tagName.toLowerCase());
      
      if (tagName === 'select') {
        await input.selectOption(value);
      } else {
        await input.fill(value);
      }
    }
  }
}

/**
 * Wait for navigation to complete
 */
export async function waitForNavigation(page: Page, timeout = 5000) {
  await page.waitForLoadState('networkidle', { timeout });
}

/**
 * Take screenshot with custom name
 */
export async function takeScreenshot(page: Page, name: string) {
  await page.screenshot({ 
    path: `test-results/screenshots/${name}-${Date.now()}.png`,
    fullPage: true 
  });
}

/**
 * Check for JavaScript errors on page
 */
export function captureConsoleErrors(page: Page): string[] {
  const errors: string[] = [];
  
  page.on('pageerror', error => {
    errors.push(error.message);
  });
  
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });
  
  return errors;
}

/**
 * Mock API response
 */
export async function mockApiResponse(
  page: Page,
  url: string,
  response: any,
  status = 200
) {
  await page.route(url, route => {
    route.fulfill({
      status,
      contentType: 'application/json',
      body: JSON.stringify(response),
    });
  });
}

/**
 * Wait for API call to complete
 */
export async function waitForApiCall(page: Page, urlPattern: string | RegExp) {
  return page.waitForResponse(
    response => {
      const url = response.url();
      if (typeof urlPattern === 'string') {
        return url.includes(urlPattern);
      }
      return urlPattern.test(url);
    },
    { timeout: 10000 }
  );
}

/**
 * Scroll to element
 */
export async function scrollToElement(page: Page, selector: string) {
  await page.locator(selector).scrollIntoViewIfNeeded();
}

/**
 * Check if element exists (without throwing)
 */
export async function elementExists(page: Page, selector: string): Promise<boolean> {
  return await page.locator(selector).count() > 0;
}

/**
 * Get text content of element
 */
export async function getTextContent(page: Page, selector: string): Promise<string | null> {
  const element = page.locator(selector);
  
  if (await element.count() > 0) {
    return await element.textContent();
  }
  
  return null;
}

/**
 * Wait for specific number of elements
 */
export async function waitForElementCount(
  page: Page,
  selector: string,
  count: number,
  timeout = 5000
) {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    const currentCount = await page.locator(selector).count();
    
    if (currentCount === count) {
      return true;
    }
    
    await page.waitForTimeout(100);
  }
  
  return false;
}

/**
 * Generate random test data
 */
export const testData = {
  randomEmail: () => `test-${Date.now()}@example.com`,
  randomName: () => `Test User ${Date.now()}`,
  randomGroupName: () => `Test Group ${Date.now()}`,
  randomEventTitle: () => `Test Event ${Date.now()}`,
  randomPassword: () => `Test@${Date.now()}`,
};

/**
 * Clear browser storage
 */
export async function clearStorage(page: Page) {
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
}

/**
 * Set viewport size for responsive testing
 */
export const viewports = {
  mobile: { width: 375, height: 667 },
  tablet: { width: 768, height: 1024 },
  desktop: { width: 1920, height: 1080 },
  laptop: { width: 1366, height: 768 },
};

