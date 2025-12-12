/**
 * Auto-Save E2E Tests
 * Story Q3.2: Auto-Save Implementation
 *
 * End-to-end tests for auto-save functionality:
 * - AC-Q3.2-1: Auto-save on field blur
 * - AC-Q3.2-2: Saving indicator appears
 * - AC-Q3.2-3: Saved indicator appears and dismisses
 * - AC-Q3.2-4: Error indicator with retry
 * - AC-Q3.2-11: Data persists when navigating away
 * - AC-Q3.2-12: Data persists after browser refresh
 */

import { test, expect } from '@playwright/test';

// Test user credentials
const TEST_EMAIL = 'test@example.com';
const TEST_PASSWORD = 'testpassword123';

test.describe('Auto-Save Functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Login and navigate to quoting
    await page.goto('/auth');
    await page.fill('input[name="email"]', TEST_EMAIL);
    await page.fill('input[name="password"]', TEST_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/quoting|\/dashboard/);

    // Navigate to quoting if not already there
    await page.goto('/quoting');
    await page.waitForLoadState('networkidle');
  });

  test.describe('AC-Q3.2-1, AC-Q3.2-2, AC-Q3.2-3: Save States', () => {
    test('should show saving indicator when editing and saved indicator after completion', async ({
      page,
    }) => {
      // Create or open a quote session
      const createButton = page.getByRole('button', { name: /new quote/i });
      if (await createButton.isVisible()) {
        await createButton.click();
        await page.getByRole('textbox', { name: /prospect name/i }).fill('E2E Test');
        await page.getByRole('button', { name: /create/i }).click();
        await page.waitForURL(/\/quoting\/[a-f0-9-]+/);
      } else {
        // Click first existing session
        const sessionCard = page.locator('[data-testid="quote-session-card"]').first();
        await sessionCard.click();
        await page.waitForURL(/\/quoting\/[a-f0-9-]+/);
      }

      // Wait for page to load
      await page.waitForLoadState('networkidle');

      // Type in first name field
      const firstNameInput = page.getByTestId('firstName');
      await firstNameInput.fill('John');

      // Blur the field to trigger save
      await firstNameInput.blur();

      // AC-Q3.2-2: Should show saving indicator
      const savingIndicator = page.getByText('Saving...');
      await expect(savingIndicator).toBeVisible({ timeout: 1000 });

      // AC-Q3.2-3: Should show saved indicator after API completes
      const savedIndicator = page.getByText('Saved');
      await expect(savedIndicator).toBeVisible({ timeout: 5000 });

      // Saved indicator should dismiss after ~2 seconds
      await expect(savedIndicator).not.toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('AC-Q3.2-11: Navigation Persistence', () => {
    test('should persist data when navigating away and returning', async ({
      page,
    }) => {
      // Create a new quote session
      const createButton = page.getByRole('button', { name: /new quote/i });
      await createButton.click();

      // Fill in prospect name and create
      await page.getByRole('textbox', { name: /prospect name/i }).fill('Navigation Test');
      await page.getByRole('button', { name: /create/i }).click();
      await page.waitForURL(/\/quoting\/[a-f0-9-]+/);

      // Get the current URL
      const sessionUrl = page.url();

      // Edit client info
      const firstNameInput = page.getByTestId('firstName');
      await firstNameInput.fill('NavigationTest');
      await firstNameInput.blur();

      // Wait for save to complete
      await page.getByText('Saved').waitFor({ state: 'visible', timeout: 5000 });

      // Navigate away
      await page.goto('/quoting');
      await page.waitForLoadState('networkidle');

      // Navigate back
      await page.goto(sessionUrl);
      await page.waitForLoadState('networkidle');

      // Verify data persisted
      const firstNameValue = await page.getByTestId('firstName').inputValue();
      expect(firstNameValue).toBe('NavigationTest');
    });
  });

  test.describe('AC-Q3.2-12: Refresh Persistence', () => {
    test('should persist data after browser refresh', async ({ page }) => {
      // Create a new quote session
      const createButton = page.getByRole('button', { name: /new quote/i });
      await createButton.click();

      await page.getByRole('textbox', { name: /prospect name/i }).fill('Refresh Test');
      await page.getByRole('button', { name: /create/i }).click();
      await page.waitForURL(/\/quoting\/[a-f0-9-]+/);

      // Edit client info
      const firstNameInput = page.getByTestId('firstName');
      await firstNameInput.fill('RefreshTest');
      await firstNameInput.blur();

      // Wait for save to complete
      await page.getByText('Saved').waitFor({ state: 'visible', timeout: 5000 });

      // Refresh the page
      await page.reload();
      await page.waitForLoadState('networkidle');

      // Verify data persisted
      const firstNameValue = await page.getByTestId('firstName').inputValue();
      expect(firstNameValue).toBe('RefreshTest');
    });
  });

  test.describe('Debounce Behavior', () => {
    test('should batch rapid changes into single save', async ({ page }) => {
      // Create or open a quote session
      const createButton = page.getByRole('button', { name: /new quote/i });
      await createButton.click();

      await page.getByRole('textbox', { name: /prospect name/i }).fill('Debounce Test');
      await page.getByRole('button', { name: /create/i }).click();
      await page.waitForURL(/\/quoting\/[a-f0-9-]+/);

      // Track network requests
      let saveRequestCount = 0;
      page.on('request', (request) => {
        if (
          request.url().includes('/client-data') &&
          request.method() === 'PATCH'
        ) {
          saveRequestCount++;
        }
      });

      // Make multiple rapid edits
      const firstNameInput = page.getByTestId('firstName');
      const lastNameInput = page.getByTestId('lastName');
      const emailInput = page.getByTestId('email');

      await firstNameInput.fill('J');
      await firstNameInput.fill('Jo');
      await firstNameInput.fill('John');
      await firstNameInput.blur();

      await lastNameInput.fill('Doe');
      await lastNameInput.blur();

      await emailInput.fill('john@example.com');
      await emailInput.blur();

      // Wait for saves to complete
      await page.waitForTimeout(3000);

      // Should have batched some requests (not 6 separate saves)
      expect(saveRequestCount).toBeLessThan(6);
      expect(saveRequestCount).toBeGreaterThan(0);
    });
  });

  test.describe('Tab Switching', () => {
    test('should save data when switching between tabs', async ({ page }) => {
      // Create a bundle quote to have multiple tabs
      const createButton = page.getByRole('button', { name: /new quote/i });
      await createButton.click();

      await page.getByRole('textbox', { name: /prospect name/i }).fill('Tab Switch Test');

      // Select bundle type if available
      const bundleOption = page.getByText('Bundle', { exact: true });
      if (await bundleOption.isVisible()) {
        await bundleOption.click();
      }

      await page.getByRole('button', { name: /create/i }).click();
      await page.waitForURL(/\/quoting\/[a-f0-9-]+/);

      // Edit client info
      const firstNameInput = page.getByTestId('firstName');
      await firstNameInput.fill('TabTest');
      await firstNameInput.blur();

      // Wait for save
      await page.getByText('Saved').waitFor({ state: 'visible', timeout: 5000 });

      // Switch to property tab
      const propertyTab = page.getByTestId('tab-property');
      if (await propertyTab.isVisible()) {
        await propertyTab.click();

        // Switch back to client info
        await page.getByTestId('tab-client-info').click();

        // Verify data is still there
        const firstNameValue = await page.getByTestId('firstName').inputValue();
        expect(firstNameValue).toBe('TabTest');
      }
    });
  });
});
