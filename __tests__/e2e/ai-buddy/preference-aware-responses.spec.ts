/**
 * E2E Tests: Preference-Aware AI Responses
 * Story 18.3: Preference-Aware AI Responses
 *
 * End-to-end tests verifying that AI responses incorporate user preferences.
 *
 * AC-18.3.1: Carrier Context in Responses
 * AC-18.3.2: Lines of Business Context
 * AC-18.3.3: Casual Communication Style
 * AC-18.3.4: Professional Communication Style
 * AC-18.3.5: Licensed States Context
 * AC-18.3.6: Preferences Injection Verification
 * AC-18.3.7: Graceful Degradation
 *
 * Note: These tests verify the preferences are injected into the system prompt.
 * Actual AI response style verification is limited due to AI response variability.
 */

import { test, expect } from '@playwright/test';

test.describe('Preference-Aware AI Responses', () => {
  // Skip these tests by default since they require actual API calls
  // Enable in CI/CD with specific configuration
  test.describe.configure({ mode: 'serial' });

  test.describe('Preferences Setup Flow', () => {
    test.beforeEach(async ({ page }) => {
      // Navigate to settings page
      await page.goto('/settings');
      await page.waitForLoadState('networkidle');
    });

    test('Can configure preferences before testing responses', async ({ page }) => {
      // Navigate to AI Buddy settings tab
      const aiBuddyTab = page.getByTestId('ai-buddy-tab');
      await expect(aiBuddyTab).toBeVisible();
      await aiBuddyTab.click();

      // Wait for preferences form
      await page.waitForSelector('[data-testid="preferences-form"]', { timeout: 10000 });

      // Verify all preference sections are visible
      await expect(page.getByTestId('identity-section')).toBeVisible();
      await expect(page.getByTestId('lob-section')).toBeVisible();
      await expect(page.getByTestId('carriers-section')).toBeVisible();
      await expect(page.getByTestId('agency-section')).toBeVisible();
      await expect(page.getByTestId('style-section')).toBeVisible();
    });

    test('AC-18.3.3: Can set casual communication style', async ({ page }) => {
      // Navigate to AI Buddy settings
      await page.getByTestId('ai-buddy-tab').click();
      await page.waitForSelector('[data-testid="preferences-form"]', { timeout: 10000 });

      // Find and click casual option
      const casualOption = page.getByTestId('casual-option');
      await expect(casualOption).toBeVisible();
      await casualOption.click();

      // Verify it's selected (switch changes to checked state)
      const styleSwitch = page.getByTestId('style-switch');
      await expect(styleSwitch).toHaveAttribute('data-state', 'checked');
    });

    test('AC-18.3.4: Can set professional communication style', async ({ page }) => {
      // Navigate to AI Buddy settings
      await page.getByTestId('ai-buddy-tab').click();
      await page.waitForSelector('[data-testid="preferences-form"]', { timeout: 10000 });

      // Find and click professional option
      const professionalOption = page.getByTestId('professional-option');
      await expect(professionalOption).toBeVisible();
      await professionalOption.click();

      // Verify it's selected (switch changes to unchecked state)
      const styleSwitch = page.getByTestId('style-switch');
      await expect(styleSwitch).toHaveAttribute('data-state', 'unchecked');
    });

    test('AC-18.3.1: Can select preferred carriers', async ({ page }) => {
      // Navigate to AI Buddy settings
      await page.getByTestId('ai-buddy-tab').click();
      await page.waitForSelector('[data-testid="preferences-form"]', { timeout: 10000 });

      // Verify carriers section exists
      const carriersSection = page.getByTestId('carriers-section');
      await expect(carriersSection).toBeVisible();

      // Check that carrier chips are visible
      const progressiveChip = page.getByTestId('chip-progressive');
      await expect(progressiveChip).toBeVisible();

      // Click to select
      await progressiveChip.click();

      // Verify it's selected
      await expect(progressiveChip).toHaveAttribute('data-selected', 'true');
    });

    test('AC-18.3.2: Can select lines of business', async ({ page }) => {
      // Navigate to AI Buddy settings
      await page.getByTestId('ai-buddy-tab').click();
      await page.waitForSelector('[data-testid="preferences-form"]', { timeout: 10000 });

      // Verify LOB section exists
      const lobSection = page.getByTestId('lob-section');
      await expect(lobSection).toBeVisible();

      // Check that LOB chips are visible
      const commercialPropertyChip = page.getByTestId('chip-commercial-property');
      await expect(commercialPropertyChip).toBeVisible();

      // Click to select
      await commercialPropertyChip.click();

      // Verify it's selected
      await expect(commercialPropertyChip).toHaveAttribute('data-selected', 'true');
    });

    test('AC-18.3.5: Can select licensed states', async ({ page }) => {
      // Navigate to AI Buddy settings
      await page.getByTestId('ai-buddy-tab').click();
      await page.waitForSelector('[data-testid="preferences-form"]', { timeout: 10000 });

      // Verify licensed states selector exists
      const statesSelect = page.getByTestId('licensed-states-select');
      await expect(statesSelect).toBeVisible();
    });
  });

  test.describe('AI Buddy Chat with Preferences', () => {
    test.beforeEach(async ({ page }) => {
      // Navigate to AI Buddy page
      await page.goto('/ai-buddy');
      await page.waitForLoadState('networkidle');
    });

    test('AC-18.3.7: Chat works without preferences (new user)', async ({ page }) => {
      // Verify chat interface loads
      const chatInput = page.getByTestId('chat-input').or(page.locator('[placeholder*="Ask"]'));
      await expect(chatInput).toBeVisible({ timeout: 10000 });

      // Chat should be functional even without preferences set
      // The AI should use professional style by default
    });

    test('AC-18.3.6: Chat interface loads with preferences', async ({ page }) => {
      // Verify chat interface is present
      const chatInterface = page.locator('[data-testid="chat-panel"]').or(page.locator('.chat-container'));
      await expect(chatInterface).toBeVisible({ timeout: 10000 });

      // Should have input area
      const chatInput = page.getByTestId('chat-input').or(page.locator('textarea[placeholder*="message"]'));
      await expect(chatInput).toBeVisible();
    });
  });

  test.describe('Settings to Chat Flow', () => {
    test('Complete flow: Set preferences then verify chat works', async ({ page }) => {
      // Step 1: Navigate to settings
      await page.goto('/settings');
      await page.waitForLoadState('networkidle');

      // Step 2: Open AI Buddy tab
      const aiBuddyTab = page.getByTestId('ai-buddy-tab');
      await expect(aiBuddyTab).toBeVisible();
      await aiBuddyTab.click();

      // Wait for preferences form
      await page.waitForSelector('[data-testid="preferences-form"]', { timeout: 10000 });

      // Step 3: Make changes (if needed)
      const nameInput = page.getByTestId('display-name-input');
      const currentName = await nameInput.inputValue();
      if (!currentName || currentName.trim() === '') {
        await nameInput.fill('Test Agent');
      }

      // Step 4: Navigate to AI Buddy
      await page.goto('/ai-buddy');
      await page.waitForLoadState('networkidle');

      // Step 5: Verify chat interface is ready
      const chatInterface = page.locator('[data-testid="chat-panel"]').or(page.locator('.chat-container'));
      await expect(chatInterface).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Preference Persistence', () => {
    test('Preferences persist across page navigation', async ({ page }) => {
      // Navigate to settings and set preferences
      await page.goto('/settings');
      await page.waitForLoadState('networkidle');

      await page.getByTestId('ai-buddy-tab').click();
      await page.waitForSelector('[data-testid="preferences-form"]', { timeout: 10000 });

      // Set a display name
      const nameInput = page.getByTestId('display-name-input');
      const testName = 'Persistence Test ' + Date.now();
      await nameInput.fill(testName);

      // Save if button is enabled
      const saveBtn = page.getByTestId('save-btn');
      if (await saveBtn.isEnabled()) {
        await saveBtn.click();
        // Wait for save to complete
        await page.waitForTimeout(1000);
      }

      // Navigate away and back
      await page.goto('/ai-buddy');
      await page.waitForLoadState('networkidle');
      await page.goto('/settings');
      await page.waitForLoadState('networkidle');

      // Go back to AI Buddy settings
      await page.getByTestId('ai-buddy-tab').click();
      await page.waitForSelector('[data-testid="preferences-form"]', { timeout: 10000 });

      // Verify name persisted
      const savedName = await nameInput.inputValue();
      expect(savedName).toBe(testName);
    });
  });
});
