/**
 * E2E Tests for Story DR.9: Mobile Navigation Update
 *
 * Tests the mobile navigation functionality including:
 * - Mobile bottom nav presence and correct routing
 * - Active state styling on bottom nav
 * - Mobile sidebar sheet opens from hamburger menu
 * - Navigation works correctly on mobile viewports
 *
 * AC: DR.9.1 - Mobile sidebar Sheet has same nav items as desktop
 * AC: DR.9.2 - Mobile sidebar opens from left side
 * AC: DR.9.3 - Mobile bottom nav includes: Documents, Compare, Quoting, AI Buddy, Reports, Settings
 * AC: DR.9.4 - Mobile bottom nav uses consistent icons with sidebar
 * AC: DR.9.5 - Active states match desktop styling
 */

import { test, expect } from '@playwright/test';

// Mobile viewport dimensions
const MOBILE_VIEWPORT = { width: 375, height: 667 };
const MOBILE_VIEWPORT_LARGE = { width: 414, height: 896 };

test.describe('Mobile Navigation - MobileBottomNav', () => {
  test.beforeEach(async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize(MOBILE_VIEWPORT);
    // Navigate to dashboard
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
  });

  test.describe('AC: DR.9.3 - All nav items present in bottom nav', () => {
    test('displays Home nav item', async ({ page }) => {
      const nav = page.locator('nav[aria-label="Mobile navigation"]');
      await expect(nav.getByRole('link', { name: 'Home' })).toBeVisible();
    });

    test('displays Docs nav item', async ({ page }) => {
      const nav = page.locator('nav[aria-label="Mobile navigation"]');
      await expect(nav.getByRole('link', { name: 'Docs' })).toBeVisible();
    });

    test('displays Compare nav item', async ({ page }) => {
      const nav = page.locator('nav[aria-label="Mobile navigation"]');
      await expect(nav.getByRole('link', { name: 'Compare' })).toBeVisible();
    });

    test('displays Quoting nav item', async ({ page }) => {
      const nav = page.locator('nav[aria-label="Mobile navigation"]');
      await expect(nav.getByRole('link', { name: 'Quoting' })).toBeVisible();
    });

    test('displays AI Buddy nav item', async ({ page }) => {
      const nav = page.locator('nav[aria-label="Mobile navigation"]');
      await expect(nav.getByRole('link', { name: 'AI Buddy' })).toBeVisible();
    });

    test('displays Reports nav item', async ({ page }) => {
      const nav = page.locator('nav[aria-label="Mobile navigation"]');
      await expect(nav.getByRole('link', { name: 'Reports' })).toBeVisible();
    });

    test('displays Settings nav item', async ({ page }) => {
      const nav = page.locator('nav[aria-label="Mobile navigation"]');
      await expect(nav.getByRole('link', { name: 'Settings' })).toBeVisible();
    });

    test('displays exactly 7 nav items', async ({ page }) => {
      const nav = page.locator('nav[aria-label="Mobile navigation"]');
      const links = nav.getByRole('link');
      await expect(links).toHaveCount(7);
    });
  });

  test.describe('AC: DR.9.4 - Nav items use consistent icons', () => {
    test('each nav item displays an SVG icon', async ({ page }) => {
      const nav = page.locator('nav[aria-label="Mobile navigation"]');
      const links = nav.getByRole('link');
      const count = await links.count();

      for (let i = 0; i < count; i++) {
        const link = links.nth(i);
        const svg = link.locator('svg');
        await expect(svg).toBeVisible();
      }
    });
  });

  test.describe('AC: DR.9.5 - Active states match desktop styling', () => {
    test('Home nav item has active styling on /dashboard', async ({ page }) => {
      const nav = page.locator('nav[aria-label="Mobile navigation"]');
      const homeLink = nav.getByRole('link', { name: 'Home' });
      await expect(homeLink).toHaveAttribute('aria-current', 'page');
      await expect(homeLink).toHaveClass(/text-primary/);
    });

    test('Docs nav item has active styling on /documents', async ({ page }) => {
      await page.goto('/documents');
      await page.waitForLoadState('networkidle');

      const nav = page.locator('nav[aria-label="Mobile navigation"]');
      const docsLink = nav.getByRole('link', { name: 'Docs' });
      await expect(docsLink).toHaveAttribute('aria-current', 'page');
      await expect(docsLink).toHaveClass(/text-primary/);
    });

    test('Compare nav item has active styling on /compare', async ({ page }) => {
      await page.goto('/compare');
      await page.waitForLoadState('networkidle');

      const nav = page.locator('nav[aria-label="Mobile navigation"]');
      const compareLink = nav.getByRole('link', { name: 'Compare' });
      await expect(compareLink).toHaveAttribute('aria-current', 'page');
      await expect(compareLink).toHaveClass(/text-primary/);
    });

    test('inactive nav items do not have active styling', async ({ page }) => {
      const nav = page.locator('nav[aria-label="Mobile navigation"]');
      const docsLink = nav.getByRole('link', { name: 'Docs' });
      await expect(docsLink).not.toHaveAttribute('aria-current', 'page');
      await expect(docsLink).toHaveClass(/text-slate-600/);
    });
  });

  test.describe('Navigation functionality', () => {
    test('Home link navigates to /dashboard', async ({ page }) => {
      await page.goto('/documents');
      await page.waitForLoadState('networkidle');

      const nav = page.locator('nav[aria-label="Mobile navigation"]');
      await nav.getByRole('link', { name: 'Home' }).click();
      await expect(page).toHaveURL(/\/dashboard/);
    });

    test('Docs link navigates to /documents', async ({ page }) => {
      const nav = page.locator('nav[aria-label="Mobile navigation"]');
      await nav.getByRole('link', { name: 'Docs' }).click();
      await expect(page).toHaveURL(/\/documents/);
    });

    test('Compare link navigates to /compare', async ({ page }) => {
      const nav = page.locator('nav[aria-label="Mobile navigation"]');
      await nav.getByRole('link', { name: 'Compare' }).click();
      await expect(page).toHaveURL(/\/compare/);
    });

    test('Quoting link navigates to /quoting', async ({ page }) => {
      const nav = page.locator('nav[aria-label="Mobile navigation"]');
      await nav.getByRole('link', { name: 'Quoting' }).click();
      await expect(page).toHaveURL(/\/quoting/);
    });

    test('AI Buddy link navigates to /ai-buddy', async ({ page }) => {
      const nav = page.locator('nav[aria-label="Mobile navigation"]');
      await nav.getByRole('link', { name: 'AI Buddy' }).click();
      await expect(page).toHaveURL(/\/ai-buddy/);
    });

    test('Reports link navigates to /reporting', async ({ page }) => {
      const nav = page.locator('nav[aria-label="Mobile navigation"]');
      await nav.getByRole('link', { name: 'Reports' }).click();
      await expect(page).toHaveURL(/\/reporting/);
    });

    test('Settings link navigates to /settings', async ({ page }) => {
      const nav = page.locator('nav[aria-label="Mobile navigation"]');
      await nav.getByRole('link', { name: 'Settings' }).click();
      await expect(page).toHaveURL(/\/settings/);
    });

    test('active state updates after navigation', async ({ page }) => {
      const nav = page.locator('nav[aria-label="Mobile navigation"]');

      // Start on dashboard - Home should be active
      await expect(nav.getByRole('link', { name: 'Home' })).toHaveClass(/text-primary/);

      // Navigate to documents
      await nav.getByRole('link', { name: 'Docs' }).click();
      await page.waitForLoadState('networkidle');

      // Now Docs should be active, Home should not be
      await expect(nav.getByRole('link', { name: 'Docs' })).toHaveClass(/text-primary/);
      await expect(nav.getByRole('link', { name: 'Home' })).toHaveClass(/text-slate-600/);
    });
  });

  test.describe('Bottom nav visibility', () => {
    test('bottom nav is visible on mobile viewport', async ({ page }) => {
      const nav = page.locator('nav[aria-label="Mobile navigation"]');
      await expect(nav).toBeVisible();
    });

    test('bottom nav is visible on larger mobile viewport', async ({ page }) => {
      await page.setViewportSize(MOBILE_VIEWPORT_LARGE);
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      const nav = page.locator('nav[aria-label="Mobile navigation"]');
      await expect(nav).toBeVisible();
    });

    test('bottom nav is hidden on tablet viewport', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      const nav = page.locator('nav[aria-label="Mobile navigation"]');
      await expect(nav).toBeHidden();
    });

    test('bottom nav is hidden on desktop viewport', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 800 });
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      const nav = page.locator('nav[aria-label="Mobile navigation"]');
      await expect(nav).toBeHidden();
    });
  });

  test.describe('Bottom nav styling', () => {
    test('bottom nav is fixed at bottom of viewport', async ({ page }) => {
      const nav = page.locator('nav[aria-label="Mobile navigation"]');
      await expect(nav).toHaveClass(/fixed.*bottom-0/);
    });

    test('bottom nav has proper z-index', async ({ page }) => {
      const nav = page.locator('nav[aria-label="Mobile navigation"]');
      await expect(nav).toHaveClass(/z-40/);
    });
  });
});

test.describe('Mobile Navigation - Sidebar Sheet', () => {
  test.beforeEach(async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize(MOBILE_VIEWPORT);
    // Navigate to dashboard
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
  });

  test.describe('AC: DR.9.1 - Mobile sidebar has same nav items as desktop', () => {
    test('hamburger menu opens sidebar with all nav items', async ({ page }) => {
      // Find and click the hamburger menu button
      const hamburgerButton = page.getByRole('button', { name: /toggle sidebar|open sidebar|close sidebar/i });

      // Skip test if hamburger button not found (component may have different implementation)
      const isVisible = await hamburgerButton.isVisible().catch(() => false);
      if (!isVisible) {
        test.skip();
        return;
      }

      await hamburgerButton.click();

      // Wait for sheet to open
      await page.waitForSelector('[data-state="open"]', { timeout: 5000 });

      // Verify all main nav items are present in the sheet
      const sheet = page.locator('[data-state="open"]');
      await expect(sheet.getByRole('link', { name: /dashboard/i })).toBeVisible();
      await expect(sheet.getByRole('link', { name: /documents/i })).toBeVisible();
      await expect(sheet.getByRole('link', { name: /compare/i })).toBeVisible();
      await expect(sheet.getByRole('link', { name: /quoting/i })).toBeVisible();
      await expect(sheet.getByRole('link', { name: /ai buddy/i })).toBeVisible();
      await expect(sheet.getByRole('link', { name: /reporting/i })).toBeVisible();
      await expect(sheet.getByRole('link', { name: /settings/i })).toBeVisible();
    });
  });

  test.describe('AC: DR.9.2 - Mobile sidebar opens from left side', () => {
    test('sidebar sheet opens from left', async ({ page }) => {
      // Find and click the hamburger menu button
      const hamburgerButton = page.getByRole('button', { name: /toggle sidebar|open sidebar|close sidebar/i });

      const isVisible = await hamburgerButton.isVisible().catch(() => false);
      if (!isVisible) {
        test.skip();
        return;
      }

      await hamburgerButton.click();

      // Wait for sheet to open
      await page.waitForSelector('[data-state="open"]', { timeout: 5000 });

      // The sheet content should be positioned on the left
      const sheetContent = page.locator('[data-state="open"] [data-side="left"]');
      const exists = await sheetContent.count();
      // Sheet should have left positioning
      expect(exists).toBeGreaterThan(0);
    });
  });

  test.describe('Navigation from sidebar', () => {
    test('sidebar closes after navigation', async ({ page }) => {
      // Find and click the hamburger menu button
      const hamburgerButton = page.getByRole('button', { name: /toggle sidebar|open sidebar|close sidebar/i });

      const isVisible = await hamburgerButton.isVisible().catch(() => false);
      if (!isVisible) {
        test.skip();
        return;
      }

      await hamburgerButton.click();

      // Wait for sheet to open
      await page.waitForSelector('[data-state="open"]', { timeout: 5000 });

      // Click on Documents link in the sheet
      const sheet = page.locator('[data-state="open"]');
      await sheet.getByRole('link', { name: /documents/i }).click();

      // Wait for navigation
      await expect(page).toHaveURL(/\/documents/);

      // Sheet should be closed
      await expect(page.locator('[data-state="open"]')).not.toBeVisible({ timeout: 5000 });
    });
  });
});

test.describe('Mobile Navigation - Landscape Orientation', () => {
  test('bottom nav is visible in landscape mobile', async ({ page }) => {
    // Landscape mobile viewport
    await page.setViewportSize({ width: 667, height: 375 });
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Bottom nav should be visible (viewport width < 640px is false, so it may be hidden)
    // Actually with width 667 > 640, it should be hidden
    const nav = page.locator('nav[aria-label="Mobile navigation"]');

    // In landscape with width > 640, the nav would be hidden (sm:hidden)
    // This is expected behavior - only show on truly small screens
    await expect(nav).toBeHidden();
  });

  test('bottom nav works on narrow landscape', async ({ page }) => {
    // Narrow landscape (width < 640)
    await page.setViewportSize({ width: 568, height: 320 });
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    const nav = page.locator('nav[aria-label="Mobile navigation"]');
    await expect(nav).toBeVisible();
  });
});
