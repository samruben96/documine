/**
 * Carrier Copy E2E Tests
 * Story Q4.1: Copy Button & Carrier Formatters
 *
 * Tests AC-Q4.1-1, AC-Q4.1-2, AC-Q4.1-3, AC-Q4.1-7
 *
 * Note: Playwright cannot directly verify clipboard contents,
 * but we can verify UI feedback after copy actions.
 */

import { test, expect } from '@playwright/test';

test.describe('Carrier Copy Flow', () => {
  // Before each test, create a quote session with client data
  test.beforeEach(async ({ page }) => {
    // Navigate to the quoting page
    await page.goto('/quoting');

    // Wait for the page to load
    await page.waitForLoadState('networkidle');
  });

  test.describe('Copy Button UI', () => {
    test('shows Progressive copy button on carriers tab', async ({ page }) => {
      // Create a new quote session first
      await page.getByRole('button', { name: /new quote/i }).click();
      await page.waitForURL(/\/quoting\/[^/]+$/);

      // Navigate to carriers tab
      await page.getByRole('tab', { name: /carriers/i }).click();

      // Should see Progressive copy button
      await expect(page.getByTestId('copy-button-progressive')).toBeVisible();
      await expect(page.getByText('Copy for Progressive')).toBeVisible();
    });

    test('shows Travelers copy button on carriers tab', async ({ page }) => {
      // Create a new quote session
      await page.getByRole('button', { name: /new quote/i }).click();
      await page.waitForURL(/\/quoting\/[^/]+$/);

      // Navigate to carriers tab
      await page.getByRole('tab', { name: /carriers/i }).click();

      // Should see Travelers copy button
      await expect(page.getByTestId('copy-button-travelers')).toBeVisible();
      await expect(page.getByText('Copy for Travelers')).toBeVisible();
    });

    test('copy buttons are disabled without minimum client data', async ({ page }) => {
      // Create a new quote session (without filling data)
      await page.getByRole('button', { name: /new quote/i }).click();
      await page.waitForURL(/\/quoting\/[^/]+$/);

      // Navigate to carriers tab
      await page.getByRole('tab', { name: /carriers/i }).click();

      // Copy buttons should be disabled
      await expect(page.getByTestId('copy-button-progressive')).toBeDisabled();
      await expect(page.getByTestId('copy-button-travelers')).toBeDisabled();
    });

    test('shows informational message when data is missing', async ({ page }) => {
      // Create a new quote session
      await page.getByRole('button', { name: /new quote/i }).click();
      await page.waitForURL(/\/quoting\/[^/]+$/);

      // Navigate to carriers tab
      await page.getByRole('tab', { name: /carriers/i }).click();

      // Should show message about minimum data
      await expect(
        page.getByText(/enter at least the client.*first and last name/i)
      ).toBeVisible();
    });
  });

  test.describe('Copy Button States (AC-Q4.1-3)', () => {
    test.beforeEach(async ({ page }) => {
      // Create quote session with client data
      await page.getByRole('button', { name: /new quote/i }).click();
      await page.waitForURL(/\/quoting\/[^/]+$/);

      // Fill in minimum required data
      // Stay on Client Info tab and fill name
      await page.getByLabel(/first name/i).fill('John');
      await page.getByLabel(/last name/i).fill('Doe');

      // Wait for auto-save
      await page.waitForTimeout(1000);

      // Navigate to carriers tab
      await page.getByRole('tab', { name: /carriers/i }).click();
    });

    test('copy buttons are enabled with minimum client data', async ({ page }) => {
      await expect(page.getByTestId('copy-button-progressive')).toBeEnabled();
      await expect(page.getByTestId('copy-button-travelers')).toBeEnabled();
    });

    test('shows "Copied" state after clicking Progressive copy (AC-Q4.1-1, AC-Q4.1-3)', async ({
      page,
    }) => {
      // Grant clipboard permission
      await page.context().grantPermissions(['clipboard-write', 'clipboard-read']);

      // Click Progressive copy button
      await page.getByTestId('copy-button-progressive').click();

      // Should show "Copied" text
      await expect(page.getByText('Copied')).toBeVisible();

      // Button should have green styling
      const button = page.getByTestId('copy-button-progressive');
      await expect(button).toHaveClass(/bg-green/);
    });

    test('shows "Copied" state after clicking Travelers copy (AC-Q4.1-2, AC-Q4.1-3)', async ({
      page,
    }) => {
      // Grant clipboard permission
      await page.context().grantPermissions(['clipboard-write', 'clipboard-read']);

      // Click Travelers copy button
      await page.getByTestId('copy-button-travelers').click();

      // Should show "Copied" text
      await expect(page.getByText('Copied')).toBeVisible();
    });

    test('resets to default state after 2 seconds (AC-Q4.1-4)', async ({ page }) => {
      // Grant clipboard permission
      await page.context().grantPermissions(['clipboard-write', 'clipboard-read']);

      // Click copy button
      await page.getByTestId('copy-button-progressive').click();

      // Verify "Copied" state
      await expect(page.getByText('Copied')).toBeVisible();

      // Wait for reset (2 seconds + buffer)
      await page.waitForTimeout(2500);

      // Should show default text again
      await expect(page.getByText('Copy for Progressive')).toBeVisible();
    });

    test('shows success toast after copy', async ({ page }) => {
      // Grant clipboard permission
      await page.context().grantPermissions(['clipboard-write', 'clipboard-read']);

      // Click copy button
      await page.getByTestId('copy-button-progressive').click();

      // Should show success toast
      await expect(page.getByText(/copied for progressive/i)).toBeVisible();
    });
  });

  test.describe('Keyboard Navigation (AC-Q4.1-7)', () => {
    test.beforeEach(async ({ page }) => {
      // Create quote session with client data
      await page.getByRole('button', { name: /new quote/i }).click();
      await page.waitForURL(/\/quoting\/[^/]+$/);

      // Fill in minimum required data
      await page.getByLabel(/first name/i).fill('Jane');
      await page.getByLabel(/last name/i).fill('Smith');
      await page.waitForTimeout(1000);

      // Navigate to carriers tab
      await page.getByRole('tab', { name: /carriers/i }).click();

      // Grant clipboard permission
      await page.context().grantPermissions(['clipboard-write', 'clipboard-read']);
    });

    test('copy button can be triggered with Enter key', async ({ page }) => {
      // Focus the Progressive copy button
      await page.getByTestId('copy-button-progressive').focus();

      // Press Enter
      await page.keyboard.press('Enter');

      // Should show "Copied" state
      await expect(page.getByText('Copied')).toBeVisible();
    });

    test('copy button can be triggered with Space key', async ({ page }) => {
      // Focus the Travelers copy button
      await page.getByTestId('copy-button-travelers').focus();

      // Press Space
      await page.keyboard.press('Space');

      // Should show "Copied" state
      await expect(page.getByText('Copied')).toBeVisible();
    });

    test('copy buttons are in tab order', async ({ page }) => {
      // Tab to first copy button
      // Note: The exact number of tabs may vary based on page structure
      await page.keyboard.press('Tab');

      // Keep tabbing until we reach a copy button
      for (let i = 0; i < 10; i++) {
        const focusedElement = await page.evaluate(() => document.activeElement?.getAttribute('data-testid'));
        if (focusedElement?.startsWith('copy-button-')) {
          break;
        }
        await page.keyboard.press('Tab');
      }

      // Should have focused one of the copy buttons
      const focusedTestId = await page.evaluate(() => document.activeElement?.getAttribute('data-testid'));
      expect(focusedTestId).toMatch(/copy-button-(progressive|travelers)/);
    });
  });

  test.describe('Portal Links', () => {
    test('shows portal link for each carrier', async ({ page }) => {
      // Create quote session
      await page.getByRole('button', { name: /new quote/i }).click();
      await page.waitForURL(/\/quoting\/[^/]+$/);

      // Navigate to carriers tab
      await page.getByRole('tab', { name: /carriers/i }).click();

      // Should show portal links
      await expect(page.getByRole('link', { name: /open progressive portal/i })).toBeVisible();
      await expect(page.getByRole('link', { name: /open travelers portal/i })).toBeVisible();
    });

    test('portal links open in new tab', async ({ page }) => {
      // Create quote session
      await page.getByRole('button', { name: /new quote/i }).click();
      await page.waitForURL(/\/quoting\/[^/]+$/);

      // Navigate to carriers tab
      await page.getByRole('tab', { name: /carriers/i }).click();

      // Get the Progressive portal link
      const portalLink = page.getByRole('link', { name: /open progressive portal/i });

      // Should have target="_blank"
      await expect(portalLink).toHaveAttribute('target', '_blank');
      await expect(portalLink).toHaveAttribute('rel', 'noopener noreferrer');
    });
  });

  test.describe('Copy with Full Client Data', () => {
    test('can copy after filling all sections', async ({ page }) => {
      // Create quote session
      await page.getByRole('button', { name: /new quote/i }).click();
      await page.waitForURL(/\/quoting\/[^/]+$/);

      // Fill Client Info
      await page.getByLabel(/first name/i).fill('Test');
      await page.getByLabel(/last name/i).fill('User');
      await page.getByLabel(/email/i).fill('test@example.com');
      await page.getByLabel(/phone/i).fill('5551234567');

      // Wait for auto-save
      await page.waitForTimeout(1000);

      // Navigate to carriers tab
      await page.getByRole('tab', { name: /carriers/i }).click();

      // Grant clipboard permission
      await page.context().grantPermissions(['clipboard-write', 'clipboard-read']);

      // Click copy button
      await page.getByTestId('copy-button-progressive').click();

      // Should show success
      await expect(page.getByText('Copied')).toBeVisible();
    });
  });
});
