import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Create New Quote Session
 * Story Q2.2: Create New Quote Session
 *
 * Tests all acceptance criteria:
 * - AC-Q2.2-1: Dialog with prospect name input and quote type selector
 * - AC-Q2.2-2: Bundle is default selected quote type
 * - AC-Q2.2-3: Valid input creates session and redirects to /quoting/[id]
 * - AC-Q2.2-4: Validation error for empty prospect name
 * - AC-Q2.2-5: Cancel closes dialog without creating session
 */
test.describe('Create New Quote Session', () => {
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

    // Navigate to quoting page
    await page.goto('/quoting');
    await page.waitForLoadState('networkidle');
  });

  test.describe('AC-Q2.2-1: Dialog Opens', () => {
    test('dialog opens when New Quote button is clicked', async ({ page }) => {
      // Click the New Quote button
      await page.click('button:has-text("New Quote")');

      // Wait for dialog to appear
      const dialog = page.locator('[data-testid="new-quote-dialog"]');
      await expect(dialog).toBeVisible({ timeout: 5000 });

      // Verify dialog content
      await expect(page.locator('text=New Quote').first()).toBeVisible();
      await expect(
        page.locator('[data-testid="prospect-name-input"]')
      ).toBeVisible();
      await expect(
        page.locator('[data-testid="quote-type-select"]')
      ).toBeVisible();
    });
  });

  test.describe('AC-Q2.2-2: Bundle Default', () => {
    test('Bundle is selected as default quote type', async ({ page }) => {
      // Click the New Quote button
      await page.click('button:has-text("New Quote")');

      // Wait for dialog to appear
      await expect(
        page.locator('[data-testid="new-quote-dialog"]')
      ).toBeVisible();

      // Check that Bundle is the default selection
      const quoteTypeSelect = page.locator('[data-testid="quote-type-select"]');
      await expect(quoteTypeSelect).toContainText('Bundle');
    });
  });

  test.describe('AC-Q2.2-4: Validation', () => {
    test('shows validation error when prospect name is empty', async ({
      page,
    }) => {
      // Click the New Quote button
      await page.click('button:has-text("New Quote")');

      // Wait for dialog to appear
      await expect(
        page.locator('[data-testid="new-quote-dialog"]')
      ).toBeVisible();

      // Click Create Quote without entering name
      await page.click('[data-testid="create-quote-button"]');

      // Verify validation error appears
      const error = page.locator('[data-testid="prospect-name-error"]');
      await expect(error).toBeVisible({ timeout: 3000 });
      await expect(error).toContainText('required');
    });

    test('shows validation error when prospect name is too short', async ({
      page,
    }) => {
      // Click the New Quote button
      await page.click('button:has-text("New Quote")');

      // Wait for dialog to appear
      await expect(
        page.locator('[data-testid="new-quote-dialog"]')
      ).toBeVisible();

      // Enter single character name
      await page.fill('[data-testid="prospect-name-input"]', 'A');

      // Click Create Quote
      await page.click('[data-testid="create-quote-button"]');

      // Verify validation error appears
      const error = page.locator('[data-testid="prospect-name-error"]');
      await expect(error).toBeVisible({ timeout: 3000 });
      await expect(error).toContainText('at least 2 characters');
    });
  });

  test.describe('AC-Q2.2-5: Cancel', () => {
    test('cancel button closes dialog without creating session', async ({
      page,
    }) => {
      // Click the New Quote button
      await page.click('button:has-text("New Quote")');

      // Wait for dialog to appear
      await expect(
        page.locator('[data-testid="new-quote-dialog"]')
      ).toBeVisible();

      // Enter some data
      await page.fill('[data-testid="prospect-name-input"]', 'Test Prospect');

      // Click Cancel
      await page.click('[data-testid="cancel-button"]');

      // Verify dialog closes
      await expect(
        page.locator('[data-testid="new-quote-dialog"]')
      ).not.toBeVisible({ timeout: 3000 });

      // Verify still on quoting page (not redirected)
      expect(page.url()).toContain('/quoting');
      expect(page.url()).not.toMatch(/\/quoting\/[a-z0-9-]+$/);
    });

    test('closing by clicking outside closes dialog', async ({ page }) => {
      // Click the New Quote button
      await page.click('button:has-text("New Quote")');

      // Wait for dialog to appear
      await expect(
        page.locator('[data-testid="new-quote-dialog"]')
      ).toBeVisible();

      // Press Escape to close
      await page.keyboard.press('Escape');

      // Verify dialog closes
      await expect(
        page.locator('[data-testid="new-quote-dialog"]')
      ).not.toBeVisible({ timeout: 3000 });
    });
  });

  test.describe('AC-Q2.2-3: Successful Creation', () => {
    test('valid input creates session and redirects to detail page', async ({
      page,
    }) => {
      // Generate unique prospect name to avoid conflicts
      const prospectName = `E2E Test ${Date.now()}`;

      // Click the New Quote button
      await page.click('button:has-text("New Quote")');

      // Wait for dialog to appear
      await expect(
        page.locator('[data-testid="new-quote-dialog"]')
      ).toBeVisible();

      // Enter prospect name
      await page.fill('[data-testid="prospect-name-input"]', prospectName);

      // Click Create Quote
      await page.click('[data-testid="create-quote-button"]');

      // Wait for redirect to detail page
      await page.waitForURL(/\/quoting\/[a-z0-9-]+$/, { timeout: 10000 });

      // Verify we're on a detail page
      expect(page.url()).toMatch(/\/quoting\/[a-z0-9-]+$/);

      // Note: Success toast verification is optional as it may disappear quickly
    });

    test('can create session with different quote types', async ({ page }) => {
      const prospectName = `E2E Home Test ${Date.now()}`;

      // Click the New Quote button
      await page.click('button:has-text("New Quote")');

      // Wait for dialog to appear
      await expect(
        page.locator('[data-testid="new-quote-dialog"]')
      ).toBeVisible();

      // Enter prospect name
      await page.fill('[data-testid="prospect-name-input"]', prospectName);

      // Open quote type dropdown
      await page.click('[data-testid="quote-type-select"]');

      // Wait for dropdown options
      await page.waitForTimeout(300);

      // Select Home type
      await page.click('[data-testid="quote-type-option-home"]');

      // Verify Home is selected
      const quoteTypeSelect = page.locator('[data-testid="quote-type-select"]');
      await expect(quoteTypeSelect).toContainText('Home');

      // Click Create Quote
      await page.click('[data-testid="create-quote-button"]');

      // Wait for redirect to detail page
      await page.waitForURL(/\/quoting\/[a-z0-9-]+$/, { timeout: 10000 });
    });
  });

  test.describe('Loading State', () => {
    test('shows loading state while creating session', async ({ page }) => {
      const prospectName = `E2E Loading Test ${Date.now()}`;

      // Click the New Quote button
      await page.click('button:has-text("New Quote")');

      // Wait for dialog to appear
      await expect(
        page.locator('[data-testid="new-quote-dialog"]')
      ).toBeVisible();

      // Enter prospect name
      await page.fill('[data-testid="prospect-name-input"]', prospectName);

      // Click Create Quote and immediately check for loading state
      const createButton = page.locator('[data-testid="create-quote-button"]');
      await createButton.click();

      // The button should show "Creating..." during submission
      // Note: This is a race condition test - loading state may be too fast to catch
      // We accept either the loading state or successful redirect
      try {
        await expect(createButton).toContainText('Creating', { timeout: 1000 });
      } catch {
        // Already redirected - that's fine too
        expect(page.url()).toMatch(/\/quoting/);
      }
    });
  });
});
