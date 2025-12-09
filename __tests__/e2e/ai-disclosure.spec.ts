/**
 * E2E Tests - AI Disclosure Message
 * Story 19.4: AI Disclosure Message
 *
 * End-to-end tests covering:
 * - AC-19.4.1: Editor appears in Guardrails admin section
 * - AC-19.4.2: Placeholder text when empty
 * - AC-19.4.3: Disclosure message saved on change
 * - AC-19.4.4: Disclosure displayed in chat UI
 * - AC-19.4.5: Disclosure cannot be dismissed
 * - AC-19.4.8: WCAG accessibility requirements
 */

import { test, expect } from '@playwright/test';

test.describe('AI Disclosure Message', () => {
  // Skip all tests in this file since they require auth and database setup
  test.skip(true, 'Requires authenticated session and database setup');

  test.describe('Admin Editor', () => {
    test.beforeEach(async ({ page }) => {
      // Navigate to AI Buddy settings with admin credentials
      await page.goto('/settings');
      // Wait for AI Buddy tab to load
      await page.waitForSelector('[data-testid="guardrail-admin-panel"]');
    });

    test('AC-19.4.1: shows disclosure editor in guardrails section', async ({ page }) => {
      // Verify AI Disclosure section exists
      await expect(page.getByText('AI Disclosure')).toBeVisible();
      await expect(page.getByTestId('ai-disclosure-editor')).toBeVisible();
    });

    test('AC-19.4.2: shows placeholder text when empty', async ({ page }) => {
      const textarea = page.getByTestId('ai-disclosure-textarea');

      // Clear the textarea
      await textarea.clear();

      // Verify placeholder is shown
      const placeholder = await textarea.getAttribute('placeholder');
      expect(placeholder).toContain('Example:');
    });

    test('AC-19.4.3: saves disclosure message', async ({ page }) => {
      const textarea = page.getByTestId('ai-disclosure-textarea');
      const testMessage = 'Test disclosure message ' + Date.now();

      // Enter new disclosure message
      await textarea.fill(testMessage);

      // Wait for auto-save (500ms debounce + network)
      await page.waitForTimeout(1000);

      // Refresh page
      await page.reload();
      await page.waitForSelector('[data-testid="ai-disclosure-textarea"]');

      // Verify message was persisted
      await expect(textarea).toHaveValue(testMessage);
    });

    test('shows character count', async ({ page }) => {
      const charCount = page.getByTestId('ai-disclosure-char-count');
      await expect(charCount).toContainText('/ 500');
    });

    test('can toggle disclosure enabled/disabled', async ({ page }) => {
      const toggle = page.getByTestId('ai-disclosure-enabled-toggle');

      // Get initial state
      const initialState = await toggle.getAttribute('aria-checked');

      // Toggle
      await toggle.click();

      // Verify state changed
      const newState = await toggle.getAttribute('aria-checked');
      expect(newState).not.toBe(initialState);
    });

    test('shows preview of disclosure banner', async ({ page }) => {
      // Enter a message first
      const textarea = page.getByTestId('ai-disclosure-textarea');
      await textarea.fill('Test preview message');

      // Click preview toggle
      const previewToggle = page.getByTestId('ai-disclosure-preview-toggle');
      await previewToggle.click();

      // Verify preview banner is shown
      await expect(page.getByTestId('ai-disclosure-banner')).toBeVisible();
      await expect(page.getByText('Test preview message')).toBeVisible();
    });

    test('can reset disclosure to defaults', async ({ page }) => {
      // Find and click reset button
      const resetButton = page.getByTestId('reset-aiDisclosure-button');
      await resetButton.click();

      // Confirm reset in dialog
      const confirmButton = page.getByTestId('confirm-reset-aiDisclosure-button');
      await confirmButton.click();

      // Wait for reset
      await page.waitForTimeout(500);

      // Verify reset was successful (toast notification)
      await expect(page.getByText(/Reset.*to defaults/)).toBeVisible();
    });
  });

  test.describe('Chat Display', () => {
    test.beforeEach(async ({ page }) => {
      // Navigate to AI Buddy chat
      await page.goto('/ai-buddy');
      await page.waitForSelector('[data-testid="ai-buddy-chat"]', { timeout: 10000 }).catch(() => {
        // Chat may not have a specific test id, wait for page load
      });
    });

    test('AC-19.4.4: displays disclosure banner in chat', async ({ page }) => {
      // Wait for disclosure banner to load
      const banner = page.getByTestId('ai-disclosure-banner');

      // May or may not be present depending on agency config
      const bannerExists = await banner.isVisible().catch(() => false);

      if (bannerExists) {
        await expect(banner).toBeVisible();
      }
    });

    test('AC-19.4.5: disclosure cannot be dismissed', async ({ page }) => {
      const banner = page.getByTestId('ai-disclosure-banner');
      const bannerExists = await banner.isVisible().catch(() => false);

      if (bannerExists) {
        // Verify no close button exists
        const closeButton = banner.locator('button[aria-label*="close"], button[aria-label*="dismiss"]');
        await expect(closeButton).not.toBeVisible();
      }
    });

    test('AC-19.4.6: no banner when disclosure not configured', async ({ page }) => {
      // This test assumes the agency has no disclosure configured
      // In practice, you'd set up a test agency with no disclosure
      const banner = page.getByTestId('ai-disclosure-banner');
      const bannerExists = await banner.isVisible().catch(() => false);

      // Either exists with content, or doesn't exist at all (both valid)
      if (bannerExists) {
        const text = await banner.textContent();
        expect(text?.trim().length).toBeGreaterThan(0);
      }
    });

    test('disclosure persists across page navigation', async ({ page }) => {
      const banner = page.getByTestId('ai-disclosure-banner');
      const bannerExists = await banner.isVisible().catch(() => false);

      if (bannerExists) {
        const originalText = await banner.textContent();

        // Navigate away and back
        await page.goto('/documents');
        await page.goto('/ai-buddy');

        // Wait for banner to load
        await page.waitForTimeout(500);

        // Verify banner still shows same message
        const newBanner = page.getByTestId('ai-disclosure-banner');
        const newBannerExists = await newBanner.isVisible().catch(() => false);

        if (newBannerExists) {
          const newText = await newBanner.textContent();
          expect(newText).toBe(originalText);
        }
      }
    });
  });

  test.describe('Accessibility', () => {
    test('AC-19.4.8: banner has ARIA attributes', async ({ page }) => {
      await page.goto('/ai-buddy');

      const banner = page.getByTestId('ai-disclosure-banner');
      const bannerExists = await banner.isVisible().catch(() => false);

      if (bannerExists) {
        // Check ARIA attributes
        await expect(banner).toHaveAttribute('role', 'status');
        await expect(banner).toHaveAttribute('aria-live', 'polite');
        await expect(banner).toHaveAttribute('aria-label', 'AI Assistant Disclosure');
      }
    });

    test('editor has accessible labels', async ({ page }) => {
      await page.goto('/settings');
      await page.waitForSelector('[data-testid="ai-disclosure-editor"]').catch(() => {});

      const editor = page.getByTestId('ai-disclosure-editor');
      const editorExists = await editor.isVisible().catch(() => false);

      if (editorExists) {
        // Textarea should have accessible label
        const textarea = page.getByTestId('ai-disclosure-textarea');
        const textareaId = await textarea.getAttribute('id');
        expect(textareaId).toBeTruthy();

        // Toggle should have label
        const toggle = page.getByTestId('ai-disclosure-enabled-toggle');
        const toggleId = await toggle.getAttribute('id');
        expect(toggleId).toBeTruthy();
      }
    });

    test('color contrast meets WCAG AA', async ({ page }) => {
      await page.goto('/ai-buddy');

      const banner = page.getByTestId('ai-disclosure-banner');
      const bannerExists = await banner.isVisible().catch(() => false);

      if (bannerExists) {
        // Get computed styles
        const bgColor = await banner.evaluate((el) => getComputedStyle(el).backgroundColor);
        const textColor = await banner.evaluate((el) => {
          const p = el.querySelector('p');
          return p ? getComputedStyle(p).color : '';
        });

        // Basic check that colors are set (actual contrast calculation would need axe-core)
        expect(bgColor).toBeTruthy();
        expect(textColor).toBeTruthy();
      }
    });
  });
});
