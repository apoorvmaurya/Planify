# Planora E2E Tests

Comprehensive end-to-end tests for Planora using Playwright.

## Test Coverage

### 1. Authentication (`auth.spec.ts`)
- Landing page navigation
- Login page functionality
- Sign up flow
- Form validation
- OAuth options
- Protected route redirects

### 2. Group Management (`group-management.spec.ts`)
- Group creation UI
- Group name validation
- Invitation system
- Member management

### 3. Event Planning (`event-planning.spec.ts`)
- Event creation flow
- Event detail pages
- Form validation
- RSVP functionality
- PlanPal integration

### 4. Polling System (`polling.spec.ts`)
- Poll rendering
- Emoji reactions
- Real-time updates
- Vote counting
- Poll lifecycle (active/closed)

### 5. Landing Page (`landing-page.spec.ts`)
- Hero section
- Feature cards
- How it works
- Testimonials
- CTAs
- Footer
- Responsive design
- Accessibility

### 6. UI Components (`ui-components.spec.ts`)
- Button variants
- Card styling
- Responsive behavior
- Accessibility checks
- Performance metrics

## Running Tests

### Run all tests
```bash
pnpm test:e2e
```

### Run specific test file
```bash
pnpm playwright test tests/auth.spec.ts
```

### Run tests in headed mode (see browser)
```bash
pnpm playwright test --headed
```

### Run tests in debug mode
```bash
pnpm playwright test --debug
```

### Run tests in specific browser
```bash
pnpm playwright test --project=chromium
pnpm playwright test --project=firefox
pnpm playwright test --project=webkit
```

### Generate test report
```bash
pnpm playwright show-report
```

## Test Structure

Each test file follows this structure:

```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    // Setup before each test
  });

  test('should do something', async ({ page }) => {
    // Test implementation
  });
});
```

## Important Notes

### Authentication Tests
The authentication tests are designed to work with unauthenticated sessions. For tests requiring authenticated users:

1. Create test users in your Supabase test environment
2. Use Supabase auth tokens in test setup
3. Store credentials in environment variables (never commit them)

Example setup for authenticated tests:
```typescript
test.beforeEach(async ({ page }) => {
  // Set auth token in local storage
  await page.goto('/');
  await page.evaluate((token) => {
    localStorage.setItem('supabase.auth.token', token);
  }, process.env.TEST_AUTH_TOKEN);
});
```

### Database State
Tests that modify database state should:
1. Use test-specific data
2. Clean up after themselves
3. Be idempotent (can run multiple times)

### Environment Variables
Create a `.env.test` file for test-specific configuration:

```env
NEXT_PUBLIC_SUPABASE_URL=your_test_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_test_supabase_key
TEST_USER_EMAIL=test@example.com
TEST_USER_PASSWORD=test_password
```

## CI/CD Integration

Tests automatically run in CI with:
- 2 retries on failure
- 1 worker (sequential execution)
- All browsers (chromium, firefox, webkit)

Configuration in `playwright.config.ts`:
```typescript
const config: PlaywrightTestConfig = {
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  // ...
};
```

## Writing New Tests

### Best Practices

1. **Use semantic selectors**
   ```typescript
   // Good
   page.getByRole('button', { name: /submit/i })
   page.getByText('Welcome')
   
   // Avoid
   page.locator('.btn-submit')
   page.locator('#welcome-text')
   ```

2. **Wait for elements properly**
   ```typescript
   // Good
   await expect(page.getByText('Success')).toBeVisible();
   
   // Avoid
   await page.waitForTimeout(5000);
   ```

3. **Test user flows, not implementation**
   ```typescript
   // Good - tests user perspective
   test('user can create a group', async ({ page }) => {
     await page.goto('/dashboard');
     await page.click('text=Create Group');
     await page.fill('input[name="name"]', 'My Group');
     await page.click('button[type="submit"]');
     await expect(page.getByText('Group created')).toBeVisible();
   });
   ```

4. **Use descriptive test names**
   ```typescript
   // Good
   test('should show validation error for empty email field')
   
   // Avoid
   test('test login')
   ```

5. **Keep tests independent**
   - Each test should be able to run in isolation
   - Don't depend on order of execution
   - Clean up test data

## Debugging Tests

### Visual debugging
```bash
pnpm playwright test --debug
```

### Trace viewer
```bash
pnpm playwright test --trace on
pnpm playwright show-trace trace.zip
```

### Screenshots on failure
Tests automatically capture screenshots on failure in `test-results/` directory.

### Video recording
Enable in `playwright.config.ts`:
```typescript
use: {
  video: 'on', // or 'retain-on-failure'
}
```

## Common Issues

### Test timeout
If tests are timing out:
1. Increase timeout in specific test:
   ```typescript
   test('slow test', async ({ page }) => {
     test.setTimeout(60000); // 60 seconds
     // ...
   });
   ```

2. Or globally in `playwright.config.ts`:
   ```typescript
   timeout: 60000,
   ```

### Flaky tests
If tests pass/fail inconsistently:
1. Add proper waits: `await expect(...).toBeVisible()`
2. Wait for network idle: `await page.waitForLoadState('networkidle')`
3. Use `test.setTimeout()` for slow operations
4. Check for race conditions

### Element not found
1. Check selector is correct
2. Wait for element: `await expect(element).toBeVisible()`
3. Check if element is in viewport
4. Verify page loaded correctly

## Test Maintenance

### Regular updates needed when:
- UI changes significantly
- New features are added
- Routes change
- Component structure changes

### Metrics to track:
- Test coverage (aim for >80%)
- Test execution time
- Flaky test rate
- Failed test rate in CI

## Resources

- [Playwright Documentation](https://playwright.dev)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [Selectors Guide](https://playwright.dev/docs/selectors)
- [Test Generation](https://playwright.dev/docs/codegen)

## Contributing

When adding new tests:
1. Follow existing patterns
2. Add comments for complex logic
3. Update this README if adding new test categories
4. Ensure tests pass locally before committing
5. Keep tests maintainable and readable

