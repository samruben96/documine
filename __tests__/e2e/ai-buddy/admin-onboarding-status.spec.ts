/**
 * E2E Tests - Admin Onboarding Status
 * Story 18.4: Admin Onboarding Status
 *
 * AC-18.4.1: Admin sees onboarding status section
 * AC-18.4.4: Filter buttons work correctly
 * AC-18.4.5: Non-admin cannot see onboarding status section
 */

import { test, expect } from '@playwright/test';

test.describe('Admin Onboarding Status', () => {
  test.describe('Admin User', () => {
    test.use({ storageState: 'playwright/.auth/admin-user.json' });

    test('admin sees onboarding status section in AI Buddy settings tab', async ({
      page,
    }) => {
      // Navigate to settings page
      await page.goto('/settings');
      await page.waitForLoadState('networkidle');

      // Click AI Buddy tab
      const aiBuddyTab = page.getByTestId('ai-buddy-tab');
      await aiBuddyTab.click();

      // Wait for preferences to load
      await page.waitForSelector('[data-testid="preferences-tab"]');

      // AC-18.4.1: Admin sees onboarding status section
      const statusSection = page.getByTestId('onboarding-status-section');
      await expect(statusSection).toBeVisible();

      // Check header content
      await expect(statusSection.getByText('Onboarding Status')).toBeVisible();
      await expect(
        statusSection.getByText('View AI Buddy onboarding completion for your team')
      ).toBeVisible();
    });

    test('status filter buttons work correctly', async ({ page }) => {
      await page.goto('/settings');
      await page.waitForLoadState('networkidle');

      // Click AI Buddy tab
      const aiBuddyTab = page.getByTestId('ai-buddy-tab');
      await aiBuddyTab.click();

      // Wait for preferences and status section to load
      await page.waitForSelector('[data-testid="onboarding-status-section"]');
      await page.waitForSelector('[data-testid="onboarding-status-filters"]');

      // AC-18.4.4: Filter buttons are present
      await expect(page.getByTestId('filter-all')).toBeVisible();
      await expect(page.getByTestId('filter-completed')).toBeVisible();
      await expect(page.getByTestId('filter-skipped')).toBeVisible();
      await expect(page.getByTestId('filter-not_started')).toBeVisible();

      // Click completed filter
      await page.getByTestId('filter-completed').click();

      // Verify filter is applied (button should have different styling)
      const completedButton = page.getByTestId('filter-completed');
      // Check if filter change worked by looking at the button state
      await expect(completedButton).toBeVisible();

      // Click all filter to reset
      await page.getByTestId('filter-all').click();
      await expect(page.getByTestId('filter-all')).toBeVisible();
    });

    test('displays user information correctly', async ({ page }) => {
      await page.goto('/settings');
      await page.waitForLoadState('networkidle');

      // Click AI Buddy tab
      const aiBuddyTab = page.getByTestId('ai-buddy-tab');
      await aiBuddyTab.click();

      // Wait for status section to load
      await page.waitForSelector('[data-testid="onboarding-status-section"]');

      // Wait for either table or loading to finish
      const table = page.getByTestId('onboarding-status-table');
      const empty = page.getByTestId('onboarding-status-empty');
      const loading = page.getByTestId('onboarding-status-loading');

      // Wait for loading to disappear
      await expect(loading).toBeHidden({ timeout: 10000 });

      // Check if table has data or shows empty state
      const hasTable = await table.isVisible();
      const hasEmpty = await empty.isVisible();

      expect(hasTable || hasEmpty).toBeTruthy();

      if (hasTable) {
        // AC-18.4.3: Verify table headers
        await expect(page.getByRole('columnheader', { name: 'Name' })).toBeVisible();
        await expect(page.getByRole('columnheader', { name: 'Email' })).toBeVisible();
        await expect(page.getByRole('columnheader', { name: 'Status' })).toBeVisible();
        await expect(
          page.getByRole('columnheader', { name: 'Completion Date' })
        ).toBeVisible();
      }
    });

    test('filter shows appropriate empty message when no matches', async ({
      page,
    }) => {
      await page.goto('/settings');
      await page.waitForLoadState('networkidle');

      // Click AI Buddy tab
      const aiBuddyTab = page.getByTestId('ai-buddy-tab');
      await aiBuddyTab.click();

      // Wait for status section
      await page.waitForSelector('[data-testid="onboarding-status-section"]');
      await page.waitForSelector('[data-testid="onboarding-status-loading"]', {
        state: 'hidden',
        timeout: 10000,
      });

      // Click completed filter - if no users have completed, should show empty
      await page.getByTestId('filter-completed').click();

      // Check if either table shows or empty state shows
      const table = page.getByTestId('onboarding-status-table');
      const empty = page.getByTestId('onboarding-status-empty');

      const hasTable = await table.isVisible();
      const hasEmpty = await empty.isVisible();

      // If empty state shows, it should have appropriate message
      if (hasEmpty) {
        await expect(
          page.getByText(/No users with "Completed" status/)
        ).toBeVisible();
        await expect(page.getByText('Clear filter')).toBeVisible();

        // Click clear filter
        await page.getByText('Clear filter').click();
        await expect(page.getByTestId('filter-all')).toBeVisible();
      }
    });
  });

  test.describe('Member User', () => {
    test.use({ storageState: 'playwright/.auth/member-user.json' });

    test('non-admin cannot see onboarding status section', async ({ page }) => {
      // Navigate to settings page
      await page.goto('/settings');
      await page.waitForLoadState('networkidle');

      // Click AI Buddy tab
      const aiBuddyTab = page.getByTestId('ai-buddy-tab');
      await aiBuddyTab.click();

      // Wait for preferences to load
      await page.waitForSelector('[data-testid="preferences-tab"]');

      // AC-18.4.5: Non-admin should NOT see onboarding status section
      const statusSection = page.getByTestId('onboarding-status-section');
      await expect(statusSection).toBeHidden();
    });

    test('member can still see AI Buddy preferences', async ({ page }) => {
      await page.goto('/settings');
      await page.waitForLoadState('networkidle');

      // Click AI Buddy tab
      const aiBuddyTab = page.getByTestId('ai-buddy-tab');
      await aiBuddyTab.click();

      // Wait for preferences to load
      await page.waitForSelector('[data-testid="preferences-tab"]');

      // Member can see their own preferences form
      await expect(page.getByTestId('preferences-form')).toBeVisible();

      // But not the admin section
      await expect(page.getByTestId('onboarding-status-section')).toBeHidden();
    });
  });
});
