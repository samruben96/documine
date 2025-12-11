/**
 * E2E Tests for Story DR.2: Sidebar Navigation
 *
 * Tests the app navigation sidebar functionality including:
 * - Navigation item presence and correct routing
 * - Active state styling for current page
 * - Responsive behavior (desktop sidebar visibility)
 * - Mobile sidebar via hamburger menu
 */

import { test, expect } from '@playwright/test';

// Test requires authenticated session
test.describe('Sidebar Navigation', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to dashboard (requires auth - will redirect to login if not logged in)
    await page.goto('/dashboard');

    // If redirected to login, we need to mock or skip
    // For E2E tests against real app, ensure test user is logged in
    // This test suite assumes authenticated state
  });

  test.describe('AC: DR.2.1-2.2 - Sidebar visibility and styling', () => {
    test('sidebar is visible on desktop viewport', async ({ page }) => {
      // Set desktop viewport
      await page.setViewportSize({ width: 1280, height: 800 });

      // Wait for page to load
      await page.waitForLoadState('networkidle');

      // The sidebar should be visible (not hidden via CSS)
      const sidebar = page.locator('aside').filter({ hasText: 'Dashboard' }).first();
      await expect(sidebar).toBeVisible();
    });

    test('sidebar has correct width on desktop', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 800 });
      await page.waitForLoadState('networkidle');

      // The desktop sidebar should have w-56 (224px)
      const sidebar = page.locator('aside.w-56').first();
      await expect(sidebar).toBeVisible();
    });
  });

  test.describe('AC: DR.2.3 - Navigation items', () => {
    test('displays all main navigation items', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 800 });
      await page.waitForLoadState('networkidle');

      // Check all main nav items are present
      await expect(page.getByRole('link', { name: /dashboard/i })).toBeVisible();
      await expect(page.getByRole('link', { name: /documents/i })).toBeVisible();
      await expect(page.getByRole('link', { name: /chat w\/ docs/i })).toBeVisible();
      await expect(page.getByRole('link', { name: /compare/i })).toBeVisible();
      await expect(page.getByRole('link', { name: /quoting/i })).toBeVisible();
      await expect(page.getByRole('link', { name: /ai buddy/i })).toBeVisible();
      await expect(page.getByRole('link', { name: /reporting/i })).toBeVisible();
    });

    test('Dashboard link navigates to /dashboard', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 800 });
      await page.goto('/documents'); // Start from different page
      await page.waitForLoadState('networkidle');

      await page.getByRole('link', { name: /dashboard/i }).first().click();
      await expect(page).toHaveURL(/\/dashboard/);
    });

    test('Documents link navigates to /documents', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 800 });
      await page.waitForLoadState('networkidle');

      await page.getByRole('link', { name: /documents/i }).first().click();
      await expect(page).toHaveURL(/\/documents/);
    });

    test('Chat w/ Docs link navigates to /chat-docs', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 800 });
      await page.waitForLoadState('networkidle');

      await page.getByRole('link', { name: /chat w\/ docs/i }).first().click();
      await expect(page).toHaveURL(/\/chat-docs/);
    });

    test('Compare link navigates to /compare', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 800 });
      await page.waitForLoadState('networkidle');

      await page.getByRole('link', { name: /compare/i }).first().click();
      await expect(page).toHaveURL(/\/compare/);
    });

    test('Quoting link navigates to /quoting', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 800 });
      await page.waitForLoadState('networkidle');

      await page.getByRole('link', { name: /quoting/i }).first().click();
      await expect(page).toHaveURL(/\/quoting/);
    });

    test('AI Buddy link navigates to /ai-buddy', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 800 });
      await page.waitForLoadState('networkidle');

      await page.getByRole('link', { name: /ai buddy/i }).first().click();
      await expect(page).toHaveURL(/\/ai-buddy/);
    });

    test('Reporting link navigates to /reporting', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 800 });
      await page.waitForLoadState('networkidle');

      await page.getByRole('link', { name: /reporting/i }).first().click();
      await expect(page).toHaveURL(/\/reporting/);
    });
  });

  test.describe('AC: DR.2.4 - Settings at bottom', () => {
    test('displays Settings navigation item', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 800 });
      await page.waitForLoadState('networkidle');

      await expect(page.getByRole('link', { name: /settings/i })).toBeVisible();
    });

    test('Settings link navigates to /settings', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 800 });
      await page.waitForLoadState('networkidle');

      await page.getByRole('link', { name: /settings/i }).first().click();
      await expect(page).toHaveURL(/\/settings/);
    });
  });

  test.describe('AC: DR.2.6 - Active state styling', () => {
    test('Dashboard nav item has active styling when on /dashboard', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 800 });
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      const dashboardLink = page.getByRole('link', { name: /dashboard/i }).first();
      await expect(dashboardLink).toHaveClass(/bg-blue-50/);
      await expect(dashboardLink).toHaveAttribute('aria-current', 'page');
    });

    test('Documents nav item has active styling when on /documents', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 800 });
      await page.goto('/documents');
      await page.waitForLoadState('networkidle');

      const documentsLink = page.getByRole('link', { name: /documents/i }).first();
      await expect(documentsLink).toHaveClass(/bg-blue-50/);
    });

    test('inactive nav items do not have active styling', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 800 });
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      const documentsLink = page.getByRole('link', { name: /documents/i }).first();
      await expect(documentsLink).not.toHaveClass(/bg-blue-50/);
    });
  });

  test.describe('AC: DR.2.9-2.10 - Responsive behavior', () => {
    test('sidebar is hidden on tablet viewport', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.waitForLoadState('networkidle');

      // The desktop sidebar (with lg:flex) should not be visible
      const desktopSidebar = page.locator('aside.lg\\:flex.hidden').first();
      // Check the computed style - it should be hidden
      await expect(desktopSidebar).toBeHidden();
    });

    test('sidebar is hidden on mobile viewport', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.waitForLoadState('networkidle');

      // The desktop sidebar should be hidden on mobile
      const desktopSidebar = page.locator('aside.lg\\:flex.hidden').first();
      await expect(desktopSidebar).toBeHidden();
    });

    test('hamburger menu opens mobile sidebar', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.waitForLoadState('networkidle');

      // Find and click the hamburger menu button
      const hamburgerButton = page.getByRole('button', { name: /toggle sidebar/i });
      await hamburgerButton.click();

      // The mobile sheet should now show navigation items
      await expect(page.locator('[data-state="open"]')).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('Quoting placeholder page', () => {
    test('Quoting page shows coming soon message', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 800 });
      await page.goto('/quoting');
      await page.waitForLoadState('networkidle');

      await expect(page.getByText('Quoting Helper')).toBeVisible();
      await expect(page.getByText('Coming Soon')).toBeVisible();
    });
  });
});
