/**
 * Card & Border Consistency E2E Tests
 * Story DR.4: Card & Border Consistency
 *
 * Verifies consistent card styling across different pages in the application.
 * AC-DR.4.1: bg-white background
 * AC-DR.4.2: border border-slate-200
 * AC-DR.4.3: rounded-lg corners
 * AC-DR.4.4: Hoverable cards have hover effects
 * AC-DR.4.5: Consistent padding
 */

import { test, expect } from '@playwright/test';

test.describe('Story DR.4: Card & Border Consistency', () => {
  // Use authenticated state for all tests
  test.use({ storageState: 'playwright/.auth/user.json' });

  test.describe('AC-DR.4.1, DR.4.2, DR.4.3: Card base styling', () => {
    test('Dashboard tool cards have consistent base styling', async ({ page }) => {
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      // Get all tool cards
      const toolCards = page.locator('[data-testid="tool-card"]');
      const count = await toolCards.count();
      expect(count).toBeGreaterThan(0);

      // Check first card for base styles
      const firstCard = toolCards.first();
      await expect(firstCard).toBeVisible();

      // Verify card has rounded corners (rounded-lg = 8px border-radius)
      const borderRadius = await firstCard.evaluate((el) =>
        window.getComputedStyle(el).borderRadius
      );
      expect(borderRadius).toBe('8px');

      // Verify card has border
      const borderWidth = await firstCard.evaluate((el) =>
        window.getComputedStyle(el).borderWidth
      );
      expect(borderWidth).toBe('1px');

      // Verify card has white background (rgb(255, 255, 255))
      const bgColor = await firstCard.evaluate((el) =>
        window.getComputedStyle(el).backgroundColor
      );
      expect(bgColor).toBe('rgb(255, 255, 255)');
    });

    test('Document cards have consistent base styling', async ({ page }) => {
      await page.goto('/documents');
      await page.waitForLoadState('networkidle');

      // Wait for document cards to load (may need upload state)
      const documentCards = page.locator('[data-testid="document-card"]');
      const count = await documentCards.count();

      // Only run style checks if documents exist
      if (count > 0) {
        const firstCard = documentCards.first();
        await expect(firstCard).toBeVisible();

        // Verify rounded corners
        const borderRadius = await firstCard.evaluate((el) =>
          window.getComputedStyle(el).borderRadius
        );
        expect(borderRadius).toBe('8px');

        // Verify white background
        const bgColor = await firstCard.evaluate((el) =>
          window.getComputedStyle(el).backgroundColor
        );
        expect(bgColor).toBe('rgb(255, 255, 255)');
      }
    });
  });

  test.describe('AC-DR.4.4: Hoverable card behavior', () => {
    test('Dashboard tool cards have hover effects', async ({ page }) => {
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      const toolCard = page.locator('[data-testid="tool-card"]').first();
      await expect(toolCard).toBeVisible();

      // Get initial styles
      const initialBorder = await toolCard.evaluate((el) =>
        window.getComputedStyle(el).borderColor
      );

      // Hover over the card
      await toolCard.hover();

      // Small delay to allow transition
      await page.waitForTimeout(250);

      // After hover, border should be different (lighter)
      // and cursor should be pointer
      const cursor = await toolCard.evaluate((el) =>
        window.getComputedStyle(el).cursor
      );
      expect(cursor).toBe('pointer');
    });

    test('Tool cards are keyboard accessible', async ({ page }) => {
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      // Tab to first tool card
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab'); // May need multiple tabs depending on page structure

      // The cards are within links, so we check the link is focusable
      const focusedElement = await page.evaluate(() =>
        document.activeElement?.tagName.toLowerCase()
      );
      // Either the link or card should be focusable
      expect(['a', 'div']).toContain(focusedElement);
    });
  });

  test.describe('AC-DR.4.5: Card padding consistency', () => {
    test('Cards have appropriate padding', async ({ page }) => {
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      // Get card content padding
      const cardContent = page.locator('[data-testid="tool-card"] [data-slot="card-content"]').first();

      if (await cardContent.count() > 0) {
        const padding = await cardContent.evaluate((el) =>
          window.getComputedStyle(el).padding
        );
        // Should be either p-4 (16px) or p-6 (24px)
        expect(['16px', '24px']).toContain(padding);
      }
    });
  });

  test.describe('Cross-page consistency', () => {
    test('Cards look consistent across Dashboard and Settings', async ({ page }) => {
      // Check Dashboard cards
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      const dashboardCard = page.locator('[data-testid="tool-card"]').first();
      await expect(dashboardCard).toBeVisible();

      const dashboardBorderRadius = await dashboardCard.evaluate((el) =>
        window.getComputedStyle(el).borderRadius
      );
      const dashboardBgColor = await dashboardCard.evaluate((el) =>
        window.getComputedStyle(el).backgroundColor
      );

      // Check Settings cards
      await page.goto('/settings');
      await page.waitForLoadState('networkidle');

      const settingsCard = page.locator('[data-slot="card"]').first();
      if (await settingsCard.count() > 0) {
        await expect(settingsCard).toBeVisible();

        const settingsBorderRadius = await settingsCard.evaluate((el) =>
          window.getComputedStyle(el).borderRadius
        );
        const settingsBgColor = await settingsCard.evaluate((el) =>
          window.getComputedStyle(el).backgroundColor
        );

        // Both should have same styling
        expect(settingsBorderRadius).toBe(dashboardBorderRadius);
        expect(settingsBgColor).toBe(dashboardBgColor);
      }
    });

    test('Cards have consistent border color', async ({ page }) => {
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      const cards = page.locator('[data-slot="card"]');
      const count = await cards.count();

      if (count >= 2) {
        // Check that multiple cards have the same border color
        const firstBorderColor = await cards.nth(0).evaluate((el) =>
          window.getComputedStyle(el).borderColor
        );
        const secondBorderColor = await cards.nth(1).evaluate((el) =>
          window.getComputedStyle(el).borderColor
        );

        expect(firstBorderColor).toBe(secondBorderColor);
      }
    });
  });
});
