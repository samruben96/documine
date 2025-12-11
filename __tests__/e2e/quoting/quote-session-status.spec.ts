/**
 * Quote Session Status E2E Tests
 * Story Q2.4: Quote Session Status Management
 *
 * Tests for:
 * - AC-Q2.4-1: Draft status with gray badge
 * - AC-Q2.4-2: In Progress status with amber badge (stub - requires Q3 forms)
 * - AC-Q2.4-3: Quotes Received status with blue badge (stub - requires Q5 results)
 * - AC-Q2.4-4: Complete status with green badge (stub - requires Q5 comparison)
 */

import { test, expect } from '@playwright/test';

// Test user credentials (test account)
const TEST_EMAIL = process.env.TEST_USER_EMAIL || 'test@example.com';
const TEST_PASSWORD = process.env.TEST_USER_PASSWORD || 'testpassword123';

test.describe('Quote Session Status Management', () => {
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

  test.describe('AC-Q2.4-1: Draft Status Display', () => {
    test('newly created session displays "Draft" status badge', async ({ page }) => {
      // Navigate to quoting list
      await page.goto('/quoting');

      // Create a new session
      await page.click('button:has-text("New Quote")');
      await page.fill('input[placeholder="Enter prospect name"]', 'Status Test Draft');
      await page.click('button[value="bundle"]');
      await page.click('button:has-text("Create Session")');

      // Wait for navigation to detail page
      await page.waitForURL(/\/quoting\/[a-f0-9-]+/);

      // Verify status badge shows "Draft"
      const statusBadge = page.locator('[data-testid="status-badge"]');
      await expect(statusBadge).toBeVisible();
      await expect(statusBadge).toHaveText('Draft');
      await expect(statusBadge).toHaveAttribute('data-status', 'draft');
    });

    test('draft session on list page shows gray status badge', async ({ page }) => {
      // Navigate to quoting list
      await page.goto('/quoting');

      // Create a new session
      await page.click('button:has-text("New Quote")');
      await page.fill('input[placeholder="Enter prospect name"]', 'Status Test List Draft');
      await page.click('button[value="home"]');
      await page.click('button:has-text("Create Session")');

      // Wait for detail page then go back to list
      await page.waitForURL(/\/quoting\/[a-f0-9-]+/);
      await page.goto('/quoting');

      // Find the session card we just created
      const sessionCard = page.locator('[data-testid="quote-session-card"]').filter({
        hasText: 'Status Test List Draft',
      });

      // Verify status badge on card shows "Draft"
      const statusBadge = sessionCard.locator('[data-testid="status-badge"]');
      await expect(statusBadge).toBeVisible();
      await expect(statusBadge).toHaveText('Draft');
      await expect(statusBadge).toHaveAttribute('data-status', 'draft');
    });
  });

  test.describe('Status Badge Visibility', () => {
    test('status badge is visible on list page session cards', async ({ page }) => {
      await page.goto('/quoting');

      // Wait for session cards to load
      const sessionCard = page.locator('[data-testid="quote-session-card"]').first();

      // Skip if no sessions exist
      if (!(await sessionCard.isVisible({ timeout: 5000 }).catch(() => false))) {
        test.skip(true, 'No quote sessions available to test');
        return;
      }

      // Verify status badge is present
      const statusBadge = sessionCard.locator('[data-testid="status-badge"]');
      await expect(statusBadge).toBeVisible();

      // Verify it has a valid status attribute
      const statusValue = await statusBadge.getAttribute('data-status');
      expect(['draft', 'in_progress', 'quotes_received', 'complete']).toContain(statusValue);
    });

    test('status badge is visible on detail page header', async ({ page }) => {
      await page.goto('/quoting');

      // Create a session to test
      await page.click('button:has-text("New Quote")');
      await page.fill('input[placeholder="Enter prospect name"]', 'Status Visibility Test');
      await page.click('button[value="auto"]');
      await page.click('button:has-text("Create Session")');

      // Wait for detail page
      await page.waitForURL(/\/quoting\/[a-f0-9-]+/);

      // Verify status badge in header
      const statusBadge = page.locator('[data-testid="status-badge"]');
      await expect(statusBadge).toBeVisible();
      await expect(statusBadge).toHaveAttribute('data-status', 'draft');
    });
  });

  /**
   * AC-Q2.4-2: In Progress Status
   *
   * STUB: Cannot fully test until Q3 implements client data forms.
   * The in_progress status is set when client firstName + lastName are entered,
   * which requires the Client Info tab forms from Epic Q3.
   *
   * Test Scenario (to implement in Q3):
   * 1. Create new session
   * 2. Navigate to Client Info tab
   * 3. Enter firstName and lastName
   * 4. Verify status badge changes to "In Progress" with amber color
   */
  test.describe('AC-Q2.4-2: In Progress Status (Stub)', () => {
    test.skip('in_progress status displays amber badge when client name entered', async () => {
      // TODO: Implement when Q3 client forms are available
      // This test requires entering client data via forms
    });
  });

  /**
   * AC-Q2.4-3: Quotes Received Status
   *
   * STUB: Cannot fully test until Q5 implements quote result entry.
   * The quotes_received status is set when at least one quote_result exists,
   * which requires the Results tab functionality from Epic Q5.
   *
   * Test Scenario (to implement in Q5):
   * 1. Create session with client data
   * 2. Navigate to Results tab
   * 3. Add a quote result from a carrier
   * 4. Verify status badge changes to "Quotes Received" with blue color
   */
  test.describe('AC-Q2.4-3: Quotes Received Status (Stub)', () => {
    test.skip('quotes_received status displays blue badge when quote results exist', async () => {
      // TODO: Implement when Q5 quote results are available
      // This test requires adding quote results via Results tab
    });
  });

  /**
   * AC-Q2.4-4: Complete Status
   *
   * STUB: Cannot fully test until Q5 implements comparison generation.
   * The complete status is set when a comparison document is generated,
   * which requires the comparison functionality from Epic Q5.
   *
   * Test Scenario (to implement in Q5):
   * 1. Create session with client data and quote results
   * 2. Generate comparison document
   * 3. Verify status badge changes to "Complete" with green color
   */
  test.describe('AC-Q2.4-4: Complete Status (Stub)', () => {
    test.skip('complete status displays green badge when comparison generated', async () => {
      // TODO: Implement when Q5 comparison generation is available
      // This test requires generating a comparison document
    });
  });
});
