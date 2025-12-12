/**
 * Carriers Tab E2E Tests
 * Story Q4.2: Carriers Tab UI & Actions
 *
 * Tests AC-Q4.2-1, AC-Q4.2-5, AC-Q4.2-6, AC-Q4.2-7, AC-Q4.2-10
 *
 * Tests the carriers tab UI, status badge system, portal links, and filtering.
 */

import { test, expect } from '@playwright/test';

test.describe('Carriers Tab UI & Actions', () => {
  test.describe('Carrier List Display (AC-Q4.2-1)', () => {
    test('carriers tab renders Progressive and Travelers', async ({ page }) => {
      // Navigate to quoting
      await page.goto('/quoting');
      await page.waitForLoadState('networkidle');

      // Create a new quote session
      await page.getByRole('button', { name: /new quote/i }).click();
      await page.waitForURL(/\/quoting\/[^/]+$/);

      // Navigate to carriers tab
      await page.getByRole('tab', { name: /carriers/i }).click();

      // Both carriers should be visible
      await expect(page.getByTestId('carrier-row-progressive')).toBeVisible();
      await expect(page.getByTestId('carrier-row-travelers')).toBeVisible();

      // Should show carrier names
      await expect(page.getByText('Progressive')).toBeVisible();
      await expect(page.getByText('Travelers')).toBeVisible();
    });

    test('each carrier row shows logo (AC-Q4.2-2)', async ({ page }) => {
      await page.goto('/quoting');
      await page.waitForLoadState('networkidle');

      await page.getByRole('button', { name: /new quote/i }).click();
      await page.waitForURL(/\/quoting\/[^/]+$/);
      await page.getByRole('tab', { name: /carriers/i }).click();

      // Progressive logo should be visible
      const progressiveLogo = page.getByTestId('carrier-row-progressive').locator('img[alt*="Progressive logo"]');
      await expect(progressiveLogo).toBeVisible();

      // Travelers logo should be visible
      const travelersLogo = page.getByTestId('carrier-row-travelers').locator('img[alt*="Travelers logo"]');
      await expect(travelersLogo).toBeVisible();
    });
  });

  test.describe('Portal Integration (AC-Q4.2-5)', () => {
    test('portal link opens in new tab', async ({ page }) => {
      await page.goto('/quoting');
      await page.waitForLoadState('networkidle');

      await page.getByRole('button', { name: /new quote/i }).click();
      await page.waitForURL(/\/quoting\/[^/]+$/);
      await page.getByRole('tab', { name: /carriers/i }).click();

      // Get Progressive portal link
      const portalLink = page.getByTestId('portal-link-progressive');

      // Should have target="_blank" and security attributes
      await expect(portalLink).toHaveAttribute('target', '_blank');
      await expect(portalLink).toHaveAttribute('rel', 'noopener noreferrer');
    });

    test('portal links have correct URLs', async ({ page }) => {
      await page.goto('/quoting');
      await page.waitForLoadState('networkidle');

      await page.getByRole('button', { name: /new quote/i }).click();
      await page.waitForURL(/\/quoting\/[^/]+$/);
      await page.getByRole('tab', { name: /carriers/i }).click();

      // Check Progressive URL
      const progressiveLink = page.getByTestId('portal-link-progressive');
      await expect(progressiveLink).toHaveAttribute('href', 'https://www.foragentsonly.com');

      // Check Travelers URL
      const travelersLink = page.getByTestId('portal-link-travelers');
      await expect(travelersLink).toHaveAttribute('href', 'https://www.travelers.com/agent');
    });
  });

  test.describe('Status Tracking (AC-Q4.2-6, AC-Q4.2-7)', () => {
    test('initial status badge shows "Not Started"', async ({ page }) => {
      await page.goto('/quoting');
      await page.waitForLoadState('networkidle');

      await page.getByRole('button', { name: /new quote/i }).click();
      await page.waitForURL(/\/quoting\/[^/]+$/);
      await page.getByRole('tab', { name: /carriers/i }).click();

      // Status badge should show "Not Started"
      const progressiveBadge = page.getByTestId('status-badge-progressive');
      await expect(progressiveBadge).toContainText('Not Started');

      // Should have gray styling (status-default)
      await expect(progressiveBadge).toHaveClass(/bg-slate-100/);
    });

    test('status changes to "Copied" after copy action (AC-Q4.2-7)', async ({ page }) => {
      await page.goto('/quoting');
      await page.waitForLoadState('networkidle');

      await page.getByRole('button', { name: /new quote/i }).click();
      await page.waitForURL(/\/quoting\/[^/]+$/);

      // Fill minimum data first
      await page.getByLabel(/first name/i).fill('Test');
      await page.getByLabel(/last name/i).fill('User');
      await page.waitForTimeout(1000);

      // Navigate to carriers tab
      await page.getByRole('tab', { name: /carriers/i }).click();

      // Grant clipboard permission
      await page.context().grantPermissions(['clipboard-write', 'clipboard-read']);

      // Click copy for Progressive
      await page.getByTestId('copy-button-progressive').click();

      // Wait for status update
      await page.waitForTimeout(500);

      // Status should change to "Copied"
      const badge = page.getByTestId('status-badge-progressive');
      await expect(badge).toContainText('Copied');

      // Should have blue styling (status-info)
      await expect(badge).toHaveClass(/bg-blue-100/);
    });

    test('status persists when navigating between tabs (AC-Q4.2-9)', async ({ page }) => {
      await page.goto('/quoting');
      await page.waitForLoadState('networkidle');

      await page.getByRole('button', { name: /new quote/i }).click();
      await page.waitForURL(/\/quoting\/[^/]+$/);

      // Fill minimum data
      await page.getByLabel(/first name/i).fill('Test');
      await page.getByLabel(/last name/i).fill('User');
      await page.waitForTimeout(1000);

      await page.getByRole('tab', { name: /carriers/i }).click();

      // Grant clipboard permission and copy
      await page.context().grantPermissions(['clipboard-write', 'clipboard-read']);
      await page.getByTestId('copy-button-progressive').click();
      await page.waitForTimeout(500);

      // Navigate away to another tab
      await page.getByRole('tab', { name: /client info/i }).click();
      await page.waitForTimeout(300);

      // Navigate back to carriers
      await page.getByRole('tab', { name: /carriers/i }).click();

      // Status should still be "Copied"
      const badge = page.getByTestId('status-badge-progressive');
      await expect(badge).toContainText('Copied');
    });
  });

  test.describe('Ready Indicator (AC-Q4.2-11)', () => {
    test('shows missing data indicator when no client data', async ({ page }) => {
      await page.goto('/quoting');
      await page.waitForLoadState('networkidle');

      await page.getByRole('button', { name: /new quote/i }).click();
      await page.waitForURL(/\/quoting\/[^/]+$/);
      await page.getByRole('tab', { name: /carriers/i }).click();

      // Should show "Missing" indicator
      await expect(page.getByText(/missing.*first name/i)).toBeVisible();
    });

    test('shows "Ready to copy" when data is complete', async ({ page }) => {
      await page.goto('/quoting');
      await page.waitForLoadState('networkidle');

      await page.getByRole('button', { name: /new quote/i }).click();
      await page.waitForURL(/\/quoting\/[^/]+$/);

      // Fill minimum data
      await page.getByLabel(/first name/i).fill('Test');
      await page.getByLabel(/last name/i).fill('User');
      await page.waitForTimeout(1000);

      await page.getByRole('tab', { name: /carriers/i }).click();

      // Should show "Ready to copy"
      await expect(page.getByText(/ready to copy/i)).toBeVisible();
    });

    test('copy buttons are enabled when data is ready', async ({ page }) => {
      await page.goto('/quoting');
      await page.waitForLoadState('networkidle');

      await page.getByRole('button', { name: /new quote/i }).click();
      await page.waitForURL(/\/quoting\/[^/]+$/);

      // Fill minimum data
      await page.getByLabel(/first name/i).fill('Test');
      await page.getByLabel(/last name/i).fill('User');
      await page.waitForTimeout(1000);

      await page.getByRole('tab', { name: /carriers/i }).click();

      // Copy buttons should be enabled
      await expect(page.getByTestId('copy-button-progressive')).toBeEnabled();
      await expect(page.getByTestId('copy-button-travelers')).toBeEnabled();
    });

    test('copy buttons are disabled when data is missing', async ({ page }) => {
      await page.goto('/quoting');
      await page.waitForLoadState('networkidle');

      await page.getByRole('button', { name: /new quote/i }).click();
      await page.waitForURL(/\/quoting\/[^/]+$/);
      await page.getByRole('tab', { name: /carriers/i }).click();

      // Copy buttons should be disabled
      await expect(page.getByTestId('copy-button-progressive')).toBeDisabled();
      await expect(page.getByTestId('copy-button-travelers')).toBeDisabled();
    });
  });

  test.describe('Carriers Filtering by Quote Type (AC-Q4.2-10)', () => {
    test('home quote type shows carriers that support home', async ({ page }) => {
      await page.goto('/quoting');
      await page.waitForLoadState('networkidle');

      // Create a new quote with 'home' type
      await page.getByRole('button', { name: /new quote/i }).click();

      // Fill in the new quote form (modal)
      await page.getByLabel(/prospect name/i).fill('Home Quote Test');

      // Select home quote type
      const homeOption = page.getByRole('radio', { name: /home/i });
      if (await homeOption.isVisible()) {
        await homeOption.click();
      }

      // Submit
      await page.getByRole('button', { name: /create|submit/i }).click();
      await page.waitForURL(/\/quoting\/[^/]+$/);

      // Navigate to carriers tab
      await page.getByRole('tab', { name: /carriers/i }).click();

      // Both Progressive and Travelers support home, so both should be visible
      await expect(page.getByTestId('carrier-row-progressive')).toBeVisible();
      await expect(page.getByTestId('carrier-row-travelers')).toBeVisible();
    });
  });

  test.describe('Copy Summary Badge', () => {
    test('shows copied count after copying carriers', async ({ page }) => {
      await page.goto('/quoting');
      await page.waitForLoadState('networkidle');

      await page.getByRole('button', { name: /new quote/i }).click();
      await page.waitForURL(/\/quoting\/[^/]+$/);

      // Fill minimum data
      await page.getByLabel(/first name/i).fill('Test');
      await page.getByLabel(/last name/i).fill('User');
      await page.waitForTimeout(1000);

      await page.getByRole('tab', { name: /carriers/i }).click();
      await page.context().grantPermissions(['clipboard-write', 'clipboard-read']);

      // Copy for Progressive
      await page.getByTestId('copy-button-progressive').click();
      await page.waitForTimeout(500);

      // Should show "1 copied" badge
      await expect(page.getByText(/1 copied/i)).toBeVisible();

      // Copy for Travelers
      await page.getByTestId('copy-button-travelers').click();
      await page.waitForTimeout(500);

      // Should show "2 copied" badge
      await expect(page.getByText(/2 copied/i)).toBeVisible();
    });
  });
});
