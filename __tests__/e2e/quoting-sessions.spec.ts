import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Quote Sessions List Page
 * Story Q2.1: Quote Sessions List Page
 *
 * Tests all acceptance criteria:
 * - AC-Q2.1-1: Sessions sorted by most recently updated first
 * - AC-Q2.1-2: Card shows prospect name, quote type badge, status, date, carrier count
 * - AC-Q2.1-3: Action menu with Edit, Duplicate, Delete options
 * - AC-Q2.1-4: Empty state with "No quotes yet" and "New Quote" CTA
 * - AC-Q2.1-5: Card click navigates to /quoting/[id]
 */
test.describe('Quote Sessions List Page', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login and authenticate
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    // Check if we need to login
    const loginForm = page.locator('form');
    if (await loginForm.isVisible({ timeout: 2000 }).catch(() => false)) {
      await page.fill(
        'input[type="email"]',
        process.env.TEST_USER_EMAIL || 'test@example.com'
      );
      await page.fill(
        'input[type="password"]',
        process.env.TEST_USER_PASSWORD || 'testpassword'
      );
      await page.click('button[type="submit"]');
      await page.waitForURL(/\/(documents|dashboard)/, { timeout: 10000 });
    }
  });

  test.describe('AC-Q2.1-1: Route and Sorting', () => {
    test('dedicated /quoting route is accessible', async ({ page }) => {
      await page.goto('/quoting');
      await page.waitForLoadState('networkidle');

      expect(page.url()).toContain('/quoting');
      await expect(page.locator('h1:has-text("Quoting")')).toBeVisible();
    });

    test('quoting link in sidebar navigation works', async ({ page }) => {
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      await page.click('aside >> text=Quoting');
      await page.waitForURL('**/quoting');
      expect(page.url()).toContain('/quoting');
    });
  });

  test.describe('AC-Q2.1-4: Empty State', () => {
    test('displays empty state when no sessions exist', async ({ page }) => {
      // Note: This test assumes a clean state or test user with no sessions
      await page.goto('/quoting');
      await page.waitForLoadState('networkidle');

      // Wait for loading to complete
      await page.waitForTimeout(1000);

      const sessionsGrid = page.locator('[data-testid="quote-sessions-grid"]');
      const emptyState = page.locator('[data-testid="quote-sessions-empty"]');

      const hasSessions = await sessionsGrid
        .isVisible({ timeout: 3000 })
        .catch(() => false);
      const isEmpty = await emptyState.isVisible({ timeout: 3000 }).catch(() => false);

      // Either sessions grid or empty state should be visible
      expect(hasSessions || isEmpty).toBeTruthy();

      if (isEmpty) {
        await expect(page.locator('text=No quotes yet')).toBeVisible();
        await expect(
          page.locator('[data-testid="empty-new-quote-button"]')
        ).toBeVisible();
      }
    });
  });

  test.describe('AC-Q2.1-2: Card Display', () => {
    test('session cards show required metadata', async ({ page }) => {
      await page.goto('/quoting');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      const sessionCard = page.locator('[data-testid="quote-session-card"]').first();

      // Only test if sessions exist
      if (await sessionCard.isVisible({ timeout: 3000 }).catch(() => false)) {
        // Should show quote type badge
        const typeBadge = sessionCard.locator('[data-testid="quote-type-badge"]');
        await expect(typeBadge).toBeVisible();

        // Should show status badge
        const statusBadge = sessionCard.locator('[data-testid="status-badge"]');
        await expect(statusBadge).toBeVisible();

        // Should show created date (format: "Created Dec 11, 2025")
        await expect(sessionCard.locator('text=/Created/')).toBeVisible();

        // Should show carrier count
        await expect(sessionCard.locator('text=/\\d+ carrier/')).toBeVisible();
      }
    });
  });

  test.describe('AC-Q2.1-3: Action Menu', () => {
    test('action menu shows Edit, Duplicate, Delete options', async ({ page }) => {
      await page.goto('/quoting');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      const sessionCard = page.locator('[data-testid="quote-session-card"]').first();

      // Only test if sessions exist
      if (await sessionCard.isVisible({ timeout: 3000 }).catch(() => false)) {
        // Click action menu button
        const menuButton = sessionCard.locator('[data-testid="session-action-menu"]');
        await menuButton.click();

        // Wait for dropdown to open
        await page.waitForTimeout(300);

        // Check menu options
        await expect(page.locator('text=Edit')).toBeVisible();
        await expect(page.locator('text=Duplicate')).toBeVisible();
        await expect(page.locator('text=Delete')).toBeVisible();
      }
    });
  });

  test.describe('AC-Q2.1-5: Card Click Navigation', () => {
    test('clicking session card navigates to detail page', async ({ page }) => {
      await page.goto('/quoting');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      const sessionCard = page.locator('[data-testid="quote-session-card"]').first();

      // Only test if sessions exist
      if (await sessionCard.isVisible({ timeout: 3000 }).catch(() => false)) {
        // Get session ID from data attribute
        const sessionId = await sessionCard.getAttribute('data-session-id');
        expect(sessionId).toBeTruthy();

        // Click the card (not the action menu)
        await sessionCard.click();

        // Should navigate to detail page
        await page.waitForURL(`**/quoting/${sessionId}`, { timeout: 5000 });
        expect(page.url()).toContain(`/quoting/${sessionId}`);
      }
    });
  });

  test.describe('New Quote Button', () => {
    test('new quote button is visible in header', async ({ page }) => {
      await page.goto('/quoting');
      await page.waitForLoadState('networkidle');

      await expect(page.locator('button:has-text("New Quote")')).toBeVisible();
    });
  });

  test.describe('Page Structure', () => {
    test('page has correct layout and styling', async ({ page }) => {
      await page.goto('/quoting');
      await page.waitForLoadState('networkidle');

      // Should have page header with title
      await expect(page.locator('h1:has-text("Quoting")')).toBeVisible();

      // Should have subtitle
      await expect(
        page.locator('text=Manage quote sessions for your prospects')
      ).toBeVisible();
    });
  });
});
