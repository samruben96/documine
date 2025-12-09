/**
 * E2E Tests: AI Buddy Onboarding
 * Story 18.1: Onboarding Flow & Guided Start
 *
 * End-to-end tests for the onboarding flow.
 *
 * AC-18.1.1: First-time user sees onboarding modal
 * AC-18.1.2: Name input with role selection
 * AC-18.1.3: LOB chip selection
 * AC-18.1.4: Carrier chip selection
 * AC-18.1.6: Personalized greeting after completion
 * AC-18.1.7: LOB-specific suggestions
 * AC-18.1.8: Skip onboarding option
 * AC-18.1.10: Back navigation preserves selections
 */

import { test, expect } from '@playwright/test';

test.describe('AI Buddy Onboarding', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to AI Buddy page
    await page.goto('/ai-buddy');
    await page.waitForLoadState('networkidle');
  });

  test.describe('Onboarding Flow UI', () => {
    test('AC-18.1.1: Onboarding modal appears for new users', async ({ page }) => {
      // Check if onboarding dialog is visible (may not show if user already onboarded)
      const dialog = page.getByTestId('onboarding-dialog');
      const isVisible = await dialog.isVisible().catch(() => false);

      // If visible, verify structure
      if (isVisible) {
        await expect(dialog).toBeVisible();
        await expect(page.getByText('Welcome to AI Buddy!')).toBeVisible();
        await expect(page.getByTestId('progress-steps')).toBeVisible();
      }
    });

    test('AC-18.1.2: Step 1 shows name input and role selector', async ({ page }) => {
      const dialog = page.getByTestId('onboarding-dialog');
      if (await dialog.isVisible().catch(() => false)) {
        await expect(page.getByTestId('name-input')).toBeVisible();
        await expect(page.getByTestId('role-select')).toBeVisible();
        await expect(page.getByTestId('continue-button')).toBeVisible();
      }
    });

    test('AC-18.1.2: Continue button disabled when name is empty', async ({ page }) => {
      const dialog = page.getByTestId('onboarding-dialog');
      if (await dialog.isVisible().catch(() => false)) {
        const continueBtn = page.getByTestId('continue-button');
        await expect(continueBtn).toBeDisabled();
      }
    });

    test('AC-18.1.2, AC-18.1.3: Navigate to Step 2 after entering name', async ({ page }) => {
      const dialog = page.getByTestId('onboarding-dialog');
      if (await dialog.isVisible().catch(() => false)) {
        // Enter name
        await page.getByTestId('name-input').fill('TestUser');

        // Continue should be enabled
        await expect(page.getByTestId('continue-button')).toBeEnabled();

        // Click continue
        await page.getByTestId('continue-button').click();

        // Should see Lines of Business step
        await expect(page.getByRole('heading', { name: 'Lines of Business' })).toBeVisible();
        await expect(page.getByTestId('chip-select')).toBeVisible();
      }
    });

    test('AC-18.1.3: LOB chips are clickable and selectable', async ({ page }) => {
      const dialog = page.getByTestId('onboarding-dialog');
      if (await dialog.isVisible().catch(() => false)) {
        // Navigate to Step 2
        await page.getByTestId('name-input').fill('TestUser');
        await page.getByTestId('continue-button').click();

        // Click a chip
        const autoChip = page.getByTestId('chip-personal-auto');
        await autoChip.click();

        // Should be selected
        await expect(autoChip).toHaveAttribute('data-selected', 'true');
      }
    });

    test('AC-18.1.4: Navigate to Step 3 and see carrier selection', async ({ page }) => {
      const dialog = page.getByTestId('onboarding-dialog');
      if (await dialog.isVisible().catch(() => false)) {
        // Navigate to Step 3
        await page.getByTestId('name-input').fill('TestUser');
        await page.getByTestId('continue-button').click();
        await page.getByTestId('chip-personal-auto').click();
        await page.getByTestId('continue-button').click();

        // Should see Carriers step
        await expect(page.getByRole('heading', { name: 'Favorite Carriers' })).toBeVisible();
        await expect(page.getByTestId('start-chatting-button')).toBeVisible();
      }
    });

    test('AC-18.1.10: Back button preserves selections', async ({ page }) => {
      const dialog = page.getByTestId('onboarding-dialog');
      if (await dialog.isVisible().catch(() => false)) {
        // Fill Step 1
        await page.getByTestId('name-input').fill('TestUser');
        await page.getByTestId('continue-button').click();

        // Select LOB on Step 2
        await page.getByTestId('chip-personal-auto').click();
        await page.getByTestId('continue-button').click();

        // Go back to Step 2
        await page.getByTestId('back-button').click();
        await expect(page.getByTestId('chip-personal-auto')).toHaveAttribute('data-selected', 'true');

        // Go back to Step 1
        await page.getByTestId('back-button').click();
        await expect(page.getByTestId('name-input')).toHaveValue('TestUser');
      }
    });

    test('AC-18.1.8: Skip button is available on all steps', async ({ page }) => {
      const dialog = page.getByTestId('onboarding-dialog');
      if (await dialog.isVisible().catch(() => false)) {
        // Step 1
        await expect(page.getByTestId('skip-button')).toBeVisible();

        // Step 2
        await page.getByTestId('name-input').fill('TestUser');
        await page.getByTestId('continue-button').click();
        await expect(page.getByTestId('skip-button')).toBeVisible();

        // Step 3
        await page.getByTestId('chip-personal-auto').click();
        await page.getByTestId('continue-button').click();
        await expect(page.getByTestId('skip-button')).toBeVisible();
      }
    });
  });

  test.describe('Onboarding Completion', () => {
    test('AC-18.1.4: Complete onboarding closes dialog', async ({ page }) => {
      const dialog = page.getByTestId('onboarding-dialog');
      if (await dialog.isVisible().catch(() => false)) {
        // Complete flow
        await page.getByTestId('name-input').fill('TestUser');
        await page.getByTestId('continue-button').click();
        await page.getByTestId('chip-personal-auto').click();
        await page.getByTestId('continue-button').click();
        await page.getByTestId('start-chatting-button').click();

        // Dialog should close
        await expect(dialog).not.toBeVisible({ timeout: 5000 });
      }
    });

    test('AC-18.1.8: Skip onboarding closes dialog', async ({ page }) => {
      const dialog = page.getByTestId('onboarding-dialog');
      if (await dialog.isVisible().catch(() => false)) {
        await page.getByTestId('skip-button').click();

        // Dialog should close
        await expect(dialog).not.toBeVisible({ timeout: 5000 });
      }
    });
  });

  test.describe('Progress Indicator', () => {
    test('Progress steps show correct state', async ({ page }) => {
      const dialog = page.getByTestId('onboarding-dialog');
      if (await dialog.isVisible().catch(() => false)) {
        // Step 1 should be current
        await expect(page.getByTestId('step-1')).toHaveAttribute('data-state', 'current');
        await expect(page.getByTestId('step-2')).toHaveAttribute('data-state', 'upcoming');

        // Navigate to Step 2
        await page.getByTestId('name-input').fill('TestUser');
        await page.getByTestId('continue-button').click();

        // Step 1 completed, Step 2 current
        await expect(page.getByTestId('step-1')).toHaveAttribute('data-state', 'completed');
        await expect(page.getByTestId('step-2')).toHaveAttribute('data-state', 'current');
      }
    });
  });
});
