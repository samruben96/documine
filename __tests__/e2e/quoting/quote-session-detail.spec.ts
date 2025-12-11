/**
 * Quote Session Detail E2E Tests
 * Story Q2.3: Quote Session Detail Page Structure
 *
 * E2E tests for:
 * - AC-Q2.3-1: Page displays back link, header, tabs, content, status
 * - AC-Q2.3-5: Client Info tab active by default
 * - Navigation from list to detail page
 */

import { test, expect } from '@playwright/test';

// Test user credentials (test account)
const TEST_EMAIL = process.env.TEST_USER_EMAIL || 'test@example.com';
const TEST_PASSWORD = process.env.TEST_USER_PASSWORD || 'testpassword123';

test.describe('Quote Session Detail Page', () => {
  // Skip if no test credentials configured
  test.skip(!process.env.TEST_USER_EMAIL, 'Test user credentials not configured');

  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('input[type="email"]', TEST_EMAIL);
    await page.fill('input[type="password"]', TEST_PASSWORD);
    await page.click('button[type="submit"]');

    // Wait for redirect to dashboard or quoting page
    await page.waitForURL(/\/(dashboard|quoting)/);
  });

  test.describe('Navigation', () => {
    test('navigates from list to detail page when clicking a session card', async ({ page }) => {
      // Go to quoting list
      await page.goto('/quoting');
      await page.waitForSelector('[data-testid="quote-sessions-grid"]', { timeout: 10000 });

      // Click the first session card
      const firstCard = page.locator('[data-testid="quote-session-card"]').first();

      // Skip if no sessions exist
      if (!(await firstCard.isVisible())) {
        test.skip(true, 'No quote sessions available to test');
        return;
      }

      await firstCard.click();

      // Should navigate to detail page
      await expect(page).toHaveURL(/\/quoting\/[a-f0-9-]+/);
    });

    test('back link returns to quoting list', async ({ page }) => {
      // Create a session first to ensure we have one to view
      await page.goto('/quoting');

      // Click New Quote button
      await page.click('button:has-text("New Quote")');

      // Fill in the dialog
      await page.fill('input[placeholder="Enter prospect name"]', 'E2E Test User');
      await page.click('button[value="bundle"]');
      await page.click('button:has-text("Create Session")');

      // Wait for navigation to detail page
      await page.waitForURL(/\/quoting\/[a-f0-9-]+/);

      // Click back link
      await page.click('[data-testid="back-link"]');

      // Should be back on list page
      await expect(page).toHaveURL('/quoting');
    });
  });

  test.describe('Page Elements', () => {
    test('detail page displays all required elements', async ({ page }) => {
      // Create a session to test
      await page.goto('/quoting');

      // Click New Quote button
      await page.click('button:has-text("New Quote")');

      // Fill in the dialog
      await page.fill('input[placeholder="Enter prospect name"]', 'Detail Test Prospect');
      await page.click('button[value="bundle"]');
      await page.click('button:has-text("Create Session")');

      // Wait for navigation to detail page
      await page.waitForURL(/\/quoting\/[a-f0-9-]+/);

      // AC-Q2.3-1: Verify back link
      await expect(page.locator('[data-testid="back-link"]')).toBeVisible();
      await expect(page.locator('[data-testid="back-link"]')).toContainText('Back to Quotes');

      // AC-Q2.3-1: Verify prospect name in header
      await expect(page.locator('[data-testid="prospect-name"]')).toContainText('Detail Test Prospect');

      // AC-Q2.3-1: Verify quote type badge
      await expect(page.locator('[data-testid="quote-type-badge"]')).toBeVisible();

      // AC-Q2.3-1: Verify status badge
      await expect(page.locator('[data-testid="status-badge"]')).toBeVisible();

      // AC-Q2.3-1: Verify tabs
      await expect(page.locator('[data-testid="tab-client-info"]')).toBeVisible();
      await expect(page.locator('[data-testid="tab-property"]')).toBeVisible();
      await expect(page.locator('[data-testid="tab-auto"]')).toBeVisible();
      await expect(page.locator('[data-testid="tab-drivers"]')).toBeVisible();
      await expect(page.locator('[data-testid="tab-carriers"]')).toBeVisible();
      await expect(page.locator('[data-testid="tab-results"]')).toBeVisible();
    });

    test('Client Info tab is active by default', async ({ page }) => {
      // Create a session to test
      await page.goto('/quoting');

      // Click New Quote button
      await page.click('button:has-text("New Quote")');

      // Fill in the dialog
      await page.fill('input[placeholder="Enter prospect name"]', 'Default Tab Test');
      await page.click('button[value="bundle"]');
      await page.click('button:has-text("Create Session")');

      // Wait for navigation to detail page
      await page.waitForURL(/\/quoting\/[a-f0-9-]+/);

      // AC-Q2.3-5: Client Info tab should be active
      const clientInfoTab = page.locator('[data-testid="tab-client-info"]');
      await expect(clientInfoTab).toHaveAttribute('data-state', 'active');
    });
  });

  test.describe('Conditional Tab Rendering', () => {
    test('auto-only quote hides Property tab', async ({ page }) => {
      // Create an auto-only session
      await page.goto('/quoting');
      await page.click('button:has-text("New Quote")');
      await page.fill('input[placeholder="Enter prospect name"]', 'Auto Only Test');
      await page.click('button[value="auto"]');
      await page.click('button:has-text("Create Session")');

      // Wait for navigation
      await page.waitForURL(/\/quoting\/[a-f0-9-]+/);

      // AC-Q2.3-3: Property tab should not be visible
      await expect(page.locator('[data-testid="tab-property"]')).not.toBeVisible();

      // Auto and Drivers tabs should be visible
      await expect(page.locator('[data-testid="tab-auto"]')).toBeVisible();
      await expect(page.locator('[data-testid="tab-drivers"]')).toBeVisible();
    });

    test('home-only quote hides Auto and Drivers tabs', async ({ page }) => {
      // Create a home-only session
      await page.goto('/quoting');
      await page.click('button:has-text("New Quote")');
      await page.fill('input[placeholder="Enter prospect name"]', 'Home Only Test');
      await page.click('button[value="home"]');
      await page.click('button:has-text("Create Session")');

      // Wait for navigation
      await page.waitForURL(/\/quoting\/[a-f0-9-]+/);

      // AC-Q2.3-4: Auto and Drivers tabs should not be visible
      await expect(page.locator('[data-testid="tab-auto"]')).not.toBeVisible();
      await expect(page.locator('[data-testid="tab-drivers"]')).not.toBeVisible();

      // Property tab should be visible
      await expect(page.locator('[data-testid="tab-property"]')).toBeVisible();
    });
  });

  test.describe('Tab Navigation', () => {
    test('can navigate between tabs', async ({ page }) => {
      // Create a bundle session (all tabs visible)
      await page.goto('/quoting');
      await page.click('button:has-text("New Quote")');
      await page.fill('input[placeholder="Enter prospect name"]', 'Tab Nav Test');
      await page.click('button[value="bundle"]');
      await page.click('button:has-text("Create Session")');

      // Wait for navigation
      await page.waitForURL(/\/quoting\/[a-f0-9-]+/);

      // Click Property tab
      await page.click('[data-testid="tab-property"]');
      await expect(page.locator('[data-testid="tab-property"]')).toHaveAttribute('data-state', 'active');
      await expect(page.locator('[data-testid="tab-client-info"]')).toHaveAttribute('data-state', 'inactive');

      // Click Auto tab
      await page.click('[data-testid="tab-auto"]');
      await expect(page.locator('[data-testid="tab-auto"]')).toHaveAttribute('data-state', 'active');
      await expect(page.locator('[data-testid="tab-property"]')).toHaveAttribute('data-state', 'inactive');
    });
  });

  test.describe('Error Handling', () => {
    test('redirects to /quoting for invalid session ID', async ({ page }) => {
      // Navigate directly to an invalid session ID
      await page.goto('/quoting/invalid-session-id-12345');

      // Should redirect to /quoting
      await page.waitForURL('/quoting', { timeout: 10000 });

      // Should show error toast (check for toast element)
      // Note: Toast might disappear quickly, so this is optional verification
    });
  });
});
