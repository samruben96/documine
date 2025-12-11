import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Header Component
 *
 * Story DR.1: Header Redesign
 * Tests header appearance and functionality after redesign.
 */
test.describe('Header Component', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login and authenticate
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    // Check if we need to login
    const loginForm = page.locator('form');
    if (await loginForm.isVisible({ timeout: 2000 }).catch(() => false)) {
      await page.fill('input[type="email"]', process.env.TEST_USER_EMAIL || 'test@example.com');
      await page.fill('input[type="password"]', process.env.TEST_USER_PASSWORD || 'testpassword');
      await page.click('button[type="submit"]');
      await page.waitForURL(/\/(documents|dashboard)/, { timeout: 10000 });
    }
  });

  test.describe('AC: DR.1.1-3 - Logo', () => {
    test('displays logo with dM text and docuMINE', async ({ page }) => {
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      // Check for dM text in logo
      await expect(page.locator('header >> text=dM')).toBeVisible();

      // Check for docuMINE brand text
      await expect(page.locator('header >> text=docuMINE')).toBeVisible();
    });

    test('logo links to dashboard', async ({ page }) => {
      await page.goto('/documents');
      await page.waitForLoadState('networkidle');

      // Click on logo/docuMINE link
      await page.click('header >> text=docuMINE');

      // Should navigate to /dashboard
      await page.waitForURL('**/dashboard');
      expect(page.url()).toContain('/dashboard');
    });
  });

  test.describe('AC: DR.1.4 - Notification bell', () => {
    test('displays notification bell icon', async ({ page }) => {
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      // Check for bell button with aria-label
      await expect(
        page.locator('header >> button[aria-label*="Notifications"]')
      ).toBeVisible();
    });
  });

  test.describe('AC: DR.1.5-6 - Avatar dropdown', () => {
    test('displays user avatar with initials', async ({ page }) => {
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      // Avatar button should be visible
      await expect(page.locator('header >> button[aria-label="User menu"]')).toBeVisible();
    });

    test('avatar dropdown shows logout option', async ({ page }) => {
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      // Click avatar to open dropdown
      await page.click('header >> button[aria-label="User menu"]');

      // Wait for dropdown to appear
      await expect(page.locator('[role="menuitem"]:has-text("Logout")')).toBeVisible();
    });

    test('logout option works', async ({ page }) => {
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      // Click avatar to open dropdown
      await page.click('header >> button[aria-label="User menu"]');

      // Click logout
      await page.click('[role="menuitem"]:has-text("Logout")');

      // Should redirect to login page
      await page.waitForURL('**/login', { timeout: 10000 });
      expect(page.url()).toContain('/login');
    });
  });

  test.describe('AC: DR.1.7 - No navigation links', () => {
    test('header does not contain navigation links', async ({ page }) => {
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      // Header should NOT contain navigation element with old nav links
      const headerNav = page.locator('header >> nav');
      await expect(headerNav).not.toBeVisible();

      // Header should NOT contain Documents, Compare, Settings links
      await expect(page.locator('header >> text=Documents')).not.toBeVisible();
      await expect(page.locator('header >> text=Compare')).not.toBeVisible();
      await expect(page.locator('header >> text=Settings')).not.toBeVisible();
    });
  });

  test.describe('AC: DR.1.10 - Mobile hamburger', () => {
    test('mobile hamburger opens sidebar', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });

      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      // Find and click the sidebar toggle button
      const sidebarToggle = page.locator('header button').first();
      await sidebarToggle.click();

      // Sidebar should become visible (look for aside element or sidebar content)
      await expect(page.locator('aside')).toBeVisible({ timeout: 5000 });
    });
  });
});
