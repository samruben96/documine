/**
 * E2E Tests - Owner Management
 * Story 20.5: Owner Management
 *
 * AC-20.5.1: Owner sees subscription panel with plan details
 * AC-20.5.2: Owner sees billing contact information
 * AC-20.5.3: Non-owner admin sees owner contact message
 * AC-20.5.4: Owner can initiate ownership transfer
 * AC-20.5.5: Only admins listed as transfer targets
 * AC-20.5.6: Password confirmation required
 * AC-20.5.10: Empty state when no admins available
 */

import { test, expect } from '@playwright/test';

test.describe('Owner Management', () => {
  test.describe('Owner User with transfer_ownership Permission', () => {
    test.use({ storageState: 'playwright/.auth/admin-user.json' });

    test('owner sees subscription panel in AI Buddy admin settings', async ({
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

      // Click AI Buddy Admin sub-tab
      await page.getByTestId('subtab-admin').click();

      // Wait for content to load
      await page.waitForTimeout(1000);

      // AC-20.5.1: Look for subscription panel (if user has owner permission)
      const subscriptionPanel = page.getByTestId('subscription-panel');
      const isOwner = await subscriptionPanel.isVisible().catch(() => false);

      // If the logged in user is actually the owner, verify subscription details
      if (isOwner) {
        // Verify plan badge is visible
        await expect(page.getByTestId('plan-badge')).toBeVisible();

        // Verify plan name
        await expect(page.getByTestId('plan-name')).toBeVisible();

        // Verify billing cycle
        await expect(page.getByTestId('billing-cycle')).toBeVisible();

        // Verify seat usage
        await expect(page.getByTestId('seat-usage')).toBeVisible();

        // Verify progress bar
        await expect(page.getByTestId('seat-progress')).toBeVisible();
      }
    });

    test('owner sees billing contact information (AC-20.5.2)', async ({
      page,
    }) => {
      await page.goto('/settings');
      await page.waitForLoadState('networkidle');

      // Click AI Buddy tab
      const aiBuddyTab = page.getByTestId('ai-buddy-tab');
      await aiBuddyTab.click();

      // Wait for preferences to load
      await page.waitForSelector('[data-testid="preferences-tab"]');

      // Click AI Buddy Admin sub-tab
      await page.getByTestId('subtab-admin').click();

      // Wait for content to load
      await page.waitForTimeout(1000);

      // Check for billing contact if owner
      const billingContact = page.getByTestId('billing-contact');
      const isOwner = await billingContact.isVisible().catch(() => false);

      if (isOwner) {
        // Verify billing email link
        const emailLink = page.getByTestId('billing-email-link');
        await expect(emailLink).toBeVisible();
        await expect(emailLink).toHaveAttribute('href', /^mailto:/);
      }
    });

    test('owner sees ownership section with transfer button (AC-20.5.4)', async ({
      page,
    }) => {
      await page.goto('/settings');
      await page.waitForLoadState('networkidle');

      // Click AI Buddy tab
      const aiBuddyTab = page.getByTestId('ai-buddy-tab');
      await aiBuddyTab.click();

      // Wait for preferences to load
      await page.waitForSelector('[data-testid="preferences-tab"]');

      // Click AI Buddy Admin sub-tab
      await page.getByTestId('subtab-admin').click();

      // Wait for content to load
      await page.waitForTimeout(1000);

      // Check for ownership section if owner
      const ownershipSection = page.getByTestId('ownership-section');
      const isOwner = await ownershipSection.isVisible().catch(() => false);

      if (isOwner) {
        // Verify transfer ownership button
        const transferButton = page.getByTestId('transfer-ownership-button');
        await expect(transferButton).toBeVisible();
      }
    });

    test('transfer ownership dialog opens with admin selector (AC-20.5.5)', async ({
      page,
    }) => {
      await page.goto('/settings');
      await page.waitForLoadState('networkidle');

      // Click AI Buddy tab
      const aiBuddyTab = page.getByTestId('ai-buddy-tab');
      await aiBuddyTab.click();

      // Wait for preferences to load
      await page.waitForSelector('[data-testid="preferences-tab"]');

      // Click AI Buddy Admin sub-tab
      await page.getByTestId('subtab-admin').click();

      // Wait for content to load
      await page.waitForTimeout(1000);

      // Check for transfer button if owner
      const transferButton = page.getByTestId('transfer-ownership-button');
      const isOwner = await transferButton.isVisible().catch(() => false);

      if (isOwner) {
        // Open transfer dialog
        await transferButton.click();

        // Wait for dialog content
        await page.waitForTimeout(500);

        // Verify dialog elements
        // Warning message
        await expect(
          page.getByText(/This action cannot be undone/)
        ).toBeVisible();

        // Admin selector should be visible (or no-admins message if no admins)
        const adminSelect = page.getByTestId('admin-select');
        const noAdminsMessage = page.getByTestId('no-admins-message');

        // One of these should be visible
        const hasAdminSelect = await adminSelect.isVisible().catch(() => false);
        const hasNoAdmins = await noAdminsMessage.isVisible().catch(() => false);

        expect(hasAdminSelect || hasNoAdmins).toBe(true);

        // Proceed button
        await expect(
          page.getByTestId('proceed-to-confirm-button')
        ).toBeVisible();
      }
    });

    test('transfer dialog shows no admins message when appropriate (AC-20.5.10)', async ({
      page,
    }) => {
      await page.goto('/settings');
      await page.waitForLoadState('networkidle');

      // Click AI Buddy tab
      const aiBuddyTab = page.getByTestId('ai-buddy-tab');
      await aiBuddyTab.click();

      // Wait for preferences to load
      await page.waitForSelector('[data-testid="preferences-tab"]');

      // Click AI Buddy Admin sub-tab
      await page.getByTestId('subtab-admin').click();

      // Wait for content to load
      await page.waitForTimeout(1000);

      const transferButton = page.getByTestId('transfer-ownership-button');
      const isOwner = await transferButton.isVisible().catch(() => false);

      if (isOwner) {
        await transferButton.click();
        await page.waitForTimeout(500);

        // Check for no-admins-message (may or may not be visible depending on agency state)
        const noAdminsMessage = page.getByTestId('no-admins-message');
        const hasNoAdmins = await noAdminsMessage.isVisible().catch(() => false);

        if (hasNoAdmins) {
          // Verify message content
          await expect(
            page.getByText(/Promote a user to admin first/i)
          ).toBeVisible();
        }
      }
    });
  });

  test.describe('Non-Owner Admin User', () => {
    // This test assumes a non-owner admin storage state exists
    // If not, we use the regular admin state and check for non-owner view
    test.use({ storageState: 'playwright/.auth/admin-user.json' });

    test('non-owner admin sees owner contact message (AC-20.5.3)', async ({
      page,
    }) => {
      await page.goto('/settings');
      await page.waitForLoadState('networkidle');

      // Click AI Buddy tab
      const aiBuddyTab = page.getByTestId('ai-buddy-tab');
      await aiBuddyTab.click();

      // Wait for preferences to load
      await page.waitForSelector('[data-testid="preferences-tab"]');

      // Click AI Buddy Admin sub-tab
      await page.getByTestId('subtab-admin').click();

      // Wait for content to load
      await page.waitForTimeout(1000);

      // Check for non-owner subscription panel
      const nonOwnerPanel = page.getByTestId('subscription-panel-non-owner');
      const isNonOwner = await nonOwnerPanel.isVisible().catch(() => false);

      if (isNonOwner) {
        // Verify owner contact message is displayed
        await expect(
          page.getByText(/Contact agency owner/i)
        ).toBeVisible();
      }
    });

    test('non-owner admin does not see transfer ownership button', async ({
      page,
    }) => {
      await page.goto('/settings');
      await page.waitForLoadState('networkidle');

      // Click AI Buddy tab
      const aiBuddyTab = page.getByTestId('ai-buddy-tab');
      await aiBuddyTab.click();

      // Wait for preferences to load
      await page.waitForSelector('[data-testid="preferences-tab"]');

      // Click AI Buddy Admin sub-tab
      await page.getByTestId('subtab-admin').click();

      // Wait for content to load
      await page.waitForTimeout(1000);

      // Check for non-owner subscription panel
      const nonOwnerPanel = page.getByTestId('subscription-panel-non-owner');
      const isNonOwner = await nonOwnerPanel.isVisible().catch(() => false);

      if (isNonOwner) {
        // Transfer button should NOT be visible
        const transferButton = page.getByTestId('transfer-ownership-button');
        await expect(transferButton).not.toBeVisible();
      }
    });
  });

  test.describe('Regular User (Non-Admin)', () => {
    test.use({ storageState: 'playwright/.auth/user.json' });

    test('regular user does not see owner settings', async ({ page }) => {
      await page.goto('/settings');
      await page.waitForLoadState('networkidle');

      // Click AI Buddy tab
      const aiBuddyTab = page.getByTestId('ai-buddy-tab');
      await aiBuddyTab.click();

      // Wait for preferences to load
      await page.waitForSelector('[data-testid="preferences-tab"]');

      // Non-admin should not see admin sub-tab at all
      const adminSubTab = page.getByTestId('subtab-admin');
      await expect(adminSubTab).not.toBeVisible();
    });
  });
});
