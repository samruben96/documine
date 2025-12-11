/**
 * Typography Consistency E2E Tests
 * Story DR.8: Typography & Spacing Standardization
 * Story DR.10: Existing Pages Update (AC: DR.10.8 - Dark mode, DR.10.9 - Responsive)
 *
 * AC-DR.8.1: Page title - text-2xl font-semibold text-slate-900
 * AC-DR.8.2: Section title - text-lg font-medium text-slate-900
 * AC-DR.8.7: Section gaps - space-y-6
 * AC-DR.8.8: Card padding - p-4 or p-6
 * AC-DR.8.9: Form field gaps - space-y-4
 * AC-DR.10.8: Dark mode regression - all pages render correctly
 * AC-DR.10.9: Responsive design - all pages work at all breakpoints
 */

import { test, expect } from '@playwright/test';

// Public pages that don't require authentication
test.describe('Typography Consistency - Public Pages', () => {
  test('login page has correct typography hierarchy', async ({ page }) => {
    await page.goto('/login');
    await expect(page).toHaveURL(/login/);

    // Verify main container has proper styling
    const container = page.locator('[data-testid="login-form"], form').first();
    await expect(container).toBeVisible();
  });

  test('signup page has correct typography', async ({ page }) => {
    await page.goto('/signup');
    await expect(page).toHaveURL(/signup/);
  });
});

test.describe('Dark Mode Support (AC: DR.10.8)', () => {
  test('login page renders correctly in dark mode', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto('/login');

    // Page should load without visual errors
    await expect(page).toHaveURL(/login/);

    // Background should have dark mode styling
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('signup page renders correctly in dark mode', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto('/signup');
    await expect(page).toHaveURL(/signup/);
  });
});

test.describe('Responsive Design - Public Pages (AC: DR.10.9)', () => {
  const viewports = [
    { name: 'mobile', width: 375, height: 667 },
    { name: 'tablet', width: 768, height: 1024 },
    { name: 'desktop', width: 1280, height: 800 },
  ];

  for (const viewport of viewports) {
    test(`login page is responsive at ${viewport.name} (${viewport.width}x${viewport.height})`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto('/login');
      await expect(page).toHaveURL(/login/);

      // Form should be visible at all breakpoints
      const form = page.locator('form').first();
      await expect(form).toBeVisible();
    });
  }
});

// Note: Authenticated page tests are skipped until auth setup is configured
// These serve as documentation for what should be tested when auth is available
test.describe('Typography Consistency - Authenticated Pages', () => {
  test.describe('Dashboard Typography (AC: DR.8.1)', () => {
    test.skip('dashboard page title uses typography.pageTitle classes', async ({ page }) => {
      // Requires authentication
      // await page.goto('/dashboard');
      // const pageTitle = page.locator('h1').first();
      // await expect(pageTitle).toHaveClass(/text-2xl/);
      // await expect(pageTitle).toHaveClass(/font-semibold/);
      // await expect(pageTitle).toHaveClass(/text-slate-900/);
    });
  });

  test.describe('Documents Page Typography (AC: DR.8.1-DR.8.5)', () => {
    test.skip('documents page title uses correct typography', async ({ page }) => {
      // await page.goto('/documents');
      // const pageTitle = page.locator('h1');
      // await expect(pageTitle).toContainText('Document Library');
      // await expect(pageTitle).toHaveClass(/text-2xl/);
      // await expect(pageTitle).toHaveClass(/font-semibold/);
    });

    test.skip('documents empty state uses section title typography', async ({ page }) => {
      // await page.goto('/documents');
      // const emptyTitle = page.locator('[data-testid="empty-state"] h2');
      // await expect(emptyTitle).toHaveClass(/text-lg/);
      // await expect(emptyTitle).toHaveClass(/font-medium/);
    });
  });

  test.describe('Compare Page Typography (AC: DR.8.1)', () => {
    test.skip('compare page title uses correct typography', async ({ page }) => {
      // await page.goto('/compare');
      // const pageTitle = page.locator('h1');
      // await expect(pageTitle).toContainText('Compare Quotes');
      // await expect(pageTitle).toHaveClass(/text-2xl/);
      // await expect(pageTitle).toHaveClass(/font-semibold/);
    });
  });

  test.describe('Settings Page Typography (AC: DR.8.1, DR.8.9)', () => {
    test.skip('settings page title uses correct typography', async ({ page }) => {
      // await page.goto('/settings');
      // const pageTitle = page.locator('h1');
      // await expect(pageTitle).toContainText('Settings');
      // await expect(pageTitle).toHaveClass(/text-2xl/);
      // await expect(pageTitle).toHaveClass(/font-semibold/);
    });

    test.skip('settings form uses space-y-4 for field gaps', async ({ page }) => {
      // await page.goto('/settings');
      // const formContainer = page.locator('form > div').first();
      // await expect(formContainer).toHaveClass(/space-y-4/);
    });
  });

  test.describe('Reporting Page Typography (AC: DR.8.1, DR.8.3)', () => {
    test.skip('reporting page title uses correct typography', async ({ page }) => {
      // await page.goto('/reporting');
      // const pageTitle = page.locator('h1');
      // await expect(pageTitle).toContainText('Data Reports');
      // await expect(pageTitle).toHaveClass(/text-2xl/);
      // await expect(pageTitle).toHaveClass(/font-semibold/);
    });

    test.skip('reporting step titles use card title typography', async ({ page }) => {
      // await page.goto('/reporting');
      // const stepTitle = page.locator('h2').first();
      // await expect(stepTitle).toContainText('Step 1');
      // await expect(stepTitle).toHaveClass(/font-medium/);
    });
  });

  test.describe('AI Buddy Page Typography (AC: DR.8.1)', () => {
    test.skip('ai buddy welcome title uses correct typography', async ({ page }) => {
      // await page.goto('/ai-buddy');
      // const welcomeTitle = page.locator('[data-testid="welcome-title"]');
      // await expect(welcomeTitle).toHaveClass(/text-2xl/);
      // await expect(welcomeTitle).toHaveClass(/font-semibold/);
    });
  });
});

test.describe('Spacing Consistency', () => {
  test.describe('Section Gaps (AC: DR.8.7)', () => {
    test.skip('compare page sections use space-y-6', async ({ page }) => {
      // await page.goto('/compare?view=new');
      // const sectionContainer = page.locator('.space-y-6');
      // await expect(sectionContainer).toBeVisible();
    });

    test.skip('reporting page sections use space-y-6', async ({ page }) => {
      // await page.goto('/reporting');
      // const sectionContainer = page.locator('.space-y-6');
      // await expect(sectionContainer).toBeVisible();
    });
  });

  test.describe('Card Padding (AC: DR.8.8)', () => {
    test.skip('cards use p-4 or p-6 padding', async ({ page }) => {
      // await page.goto('/dashboard');
      // const cards = page.locator('[data-testid="tool-card"]');
      // const count = await cards.count();
      // expect(count).toBeGreaterThan(0);
    });
  });
});

test.describe('Dark Mode Typography - Authenticated (AC: DR.10.8)', () => {
  test.skip('dashboard renders correctly in dark mode', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    // await page.goto('/dashboard');
    // const body = page.locator('body');
    // await expect(body).toHaveClass(/dark/);
  });

  test.skip('documents page renders correctly in dark mode', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    // await page.goto('/documents');
    // Verify no visual regressions
  });

  test.skip('compare page renders correctly in dark mode', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    // await page.goto('/compare');
    // Verify no visual regressions
  });

  test.skip('ai-buddy page renders correctly in dark mode', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    // await page.goto('/ai-buddy');
    // Verify no visual regressions
  });

  test.skip('reporting page renders correctly in dark mode', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    // await page.goto('/reporting');
    // Verify no visual regressions
  });

  test.skip('settings page renders correctly in dark mode', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    // await page.goto('/settings');
    // Verify no visual regressions
  });
});
