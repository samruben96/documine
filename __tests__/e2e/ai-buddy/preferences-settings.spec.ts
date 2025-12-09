/**
 * E2E Tests: AI Buddy Preferences Settings
 * Story 18.2: Preferences Management
 *
 * End-to-end tests for preferences settings tab.
 *
 * AC-18.2.1: AI Buddy Settings Tab - Dedicated tab in Settings page
 * AC-18.2.2: Preferences Form Load - Shows current preferences
 * AC-18.2.3: Identity Section - Edit display name and role
 * AC-18.2.4: Lines of Business Section - Chip-based multi-select
 * AC-18.2.5: Favorite Carriers Section - Chip-based multi-select with custom
 * AC-18.2.6: Agency Information Section - Read-only agency, editable states
 * AC-18.2.7: Communication Style Toggle - Professional/Casual toggle
 * AC-18.2.8: Save Changes - Save button with success toast
 * AC-18.2.9: Reset Confirmation Dialog - Confirmation before reset
 * AC-18.2.10: Reset Action - Preferences reset to defaults
 * AC-18.2.11: Onboarding Re-Trigger After Reset - Onboarding modal shows
 */

import { test, expect } from '@playwright/test';

test.describe('AI Buddy Preferences Settings', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to settings page
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');
  });

  test.describe('Settings Tab Integration', () => {
    test('AC-18.2.1: AI Buddy tab is visible in Settings page', async ({ page }) => {
      const aiBuddyTab = page.getByTestId('ai-buddy-tab');
      await expect(aiBuddyTab).toBeVisible();
      await expect(aiBuddyTab).toHaveText('AI Buddy');
    });

    test('AC-18.2.1: Can navigate to AI Buddy preferences tab', async ({ page }) => {
      await page.getByTestId('ai-buddy-tab').click();

      // Wait for preferences to load
      const preferencesTab = page.getByTestId('preferences-tab');
      const loadingState = page.getByTestId('preferences-loading');

      // Wait for either preferences or loading state
      await expect(preferencesTab.or(loadingState)).toBeVisible({ timeout: 5000 });

      // If loading, wait for it to finish
      if (await loadingState.isVisible().catch(() => false)) {
        await expect(preferencesTab).toBeVisible({ timeout: 10000 });
      }
    });
  });

  test.describe('Preferences Form', () => {
    test.beforeEach(async ({ page }) => {
      // Navigate to AI Buddy tab
      await page.getByTestId('ai-buddy-tab').click();
      // Wait for form to load
      await page.waitForSelector('[data-testid="preferences-form"]', { timeout: 10000 });
    });

    test('AC-18.2.2: Preferences form loads and displays values', async ({ page }) => {
      await expect(page.getByTestId('preferences-form')).toBeVisible();
      await expect(page.getByTestId('identity-section')).toBeVisible();
      await expect(page.getByTestId('lob-section')).toBeVisible();
      await expect(page.getByTestId('carriers-section')).toBeVisible();
      await expect(page.getByTestId('agency-section')).toBeVisible();
      await expect(page.getByTestId('style-section')).toBeVisible();
    });

    test('AC-18.2.3: Identity section shows display name input', async ({ page }) => {
      const nameInput = page.getByTestId('display-name-input');
      await expect(nameInput).toBeVisible();
      await expect(nameInput).toHaveAttribute('maxlength', '50');
    });

    test('AC-18.2.3: Identity section shows role dropdown', async ({ page }) => {
      const roleSelect = page.getByTestId('role-select');
      await expect(roleSelect).toBeVisible();
    });

    test('AC-18.2.4: Lines of Business section shows chip select', async ({ page }) => {
      const lobSection = page.getByTestId('lob-section');
      await expect(lobSection).toBeVisible();

      // Should have chip grid
      const chipGrid = lobSection.locator('[data-testid="chip-grid"]');
      await expect(chipGrid).toBeVisible();

      // Verify some LOB options exist
      await expect(page.getByTestId('chip-personal-auto')).toBeVisible();
      await expect(page.getByTestId('chip-homeowners')).toBeVisible();
    });

    test('AC-18.2.5: Favorite Carriers section with custom carrier input', async ({ page }) => {
      const carriersSection = page.getByTestId('carriers-section');
      await expect(carriersSection).toBeVisible();

      // Check custom carrier input exists
      const customCarrierInput = page.getByTestId('custom-carrier-input');
      await expect(customCarrierInput).toBeVisible();
      await expect(page.getByTestId('add-carrier-btn')).toBeVisible();
    });

    test('AC-18.2.6: Agency name displays as read-only', async ({ page }) => {
      const agencyInput = page.getByTestId('agency-name-display');
      await expect(agencyInput).toBeVisible();
      await expect(agencyInput).toBeDisabled();
    });

    test('AC-18.2.6: Licensed states selector is available', async ({ page }) => {
      const statesSelect = page.getByTestId('licensed-states-select');
      await expect(statesSelect).toBeVisible();
    });

    test('AC-18.2.7: Communication style toggle is visible', async ({ page }) => {
      const styleToggle = page.getByTestId('communication-style-toggle');
      await expect(styleToggle).toBeVisible();

      // Check both options are displayed
      await expect(page.getByTestId('professional-option')).toBeVisible();
      await expect(page.getByTestId('casual-option')).toBeVisible();
    });

    test('AC-18.2.8: Save button is initially disabled', async ({ page }) => {
      const saveBtn = page.getByTestId('save-btn');
      await expect(saveBtn).toBeVisible();
      await expect(saveBtn).toBeDisabled();
    });

    test('AC-18.2.8: Save button enables after making changes', async ({ page }) => {
      const nameInput = page.getByTestId('display-name-input');
      const saveBtn = page.getByTestId('save-btn');

      // Make a change
      await nameInput.fill('New Test Name');

      // Save button should be enabled
      await expect(saveBtn).toBeEnabled();
    });

    test('AC-18.2.9: Reset button is visible', async ({ page }) => {
      const resetBtn = page.getByTestId('reset-btn');
      await expect(resetBtn).toBeVisible();
      await expect(resetBtn).toHaveText(/Reset to Defaults/);
    });

    test('AC-18.2.9: Reset button shows confirmation dialog', async ({ page }) => {
      await page.getByTestId('reset-btn').click();

      // Wait for dialog
      const dialogTitle = page.getByText('Reset AI Buddy Preferences?');
      await expect(dialogTitle).toBeVisible();

      // Check cancel and confirm buttons
      await expect(page.getByText('Cancel')).toBeVisible();
      await expect(page.getByTestId('confirm-reset-btn')).toBeVisible();
    });

    test('AC-18.2.9: Can cancel reset confirmation', async ({ page }) => {
      await page.getByTestId('reset-btn').click();

      // Click cancel
      await page.getByText('Cancel').click();

      // Dialog should close
      await expect(page.getByText('Reset AI Buddy Preferences?')).not.toBeVisible();
    });
  });

  test.describe('Preferences Interactions', () => {
    test.beforeEach(async ({ page }) => {
      await page.getByTestId('ai-buddy-tab').click();
      await page.waitForSelector('[data-testid="preferences-form"]', { timeout: 10000 });
    });

    test('AC-18.2.3: Can edit display name', async ({ page }) => {
      const nameInput = page.getByTestId('display-name-input');
      await nameInput.fill('Test User Name');
      await expect(nameInput).toHaveValue('Test User Name');
    });

    test('AC-18.2.4: Can select LOB chips', async ({ page }) => {
      // Click a LOB chip
      const personalAutoChip = page.getByTestId('chip-personal-auto');

      // Get initial state
      const initialState = await personalAutoChip.getAttribute('data-selected');

      // Click to toggle
      await personalAutoChip.click();

      // State should have changed
      const newState = await personalAutoChip.getAttribute('data-selected');
      expect(newState).not.toBe(initialState);
    });

    test('AC-18.2.5: Can add custom carrier', async ({ page }) => {
      const customInput = page.getByTestId('custom-carrier-input').locator('input');
      const addBtn = page.getByTestId('add-carrier-btn');

      await customInput.fill('My Test Carrier');
      await addBtn.click();

      // Should see the custom carrier in the list
      await expect(page.getByText('My Test Carrier')).toBeVisible();
    });

    test('AC-18.2.7: Can toggle communication style', async ({ page }) => {
      const toggle = page.getByTestId('style-switch');

      // Get initial state
      const initialState = await toggle.getAttribute('data-state');

      // Click to toggle
      await toggle.click();

      // State should change
      const newState = await toggle.getAttribute('data-state');
      expect(newState).not.toBe(initialState);
    });
  });
});
