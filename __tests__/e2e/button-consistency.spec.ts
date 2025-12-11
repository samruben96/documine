/**
 * Button Style Standardization E2E Tests
 * Story DR.5: Button Style Standardization
 *
 * Verifies consistent button styling across different pages in the application.
 * AC-DR.5.1: Primary buttons: bg-primary hover:bg-primary/90 text-white rounded-lg
 * AC-DR.5.2: Secondary buttons: border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg
 * AC-DR.5.3: All buttons use px-4 py-2 text-sm font-medium
 * AC-DR.5.4: Icon buttons use p-2 rounded-lg (or rounded-full for circular)
 * AC-DR.5.5: All buttons include transition-colors for smooth hover
 */

import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

// Check if auth state file exists
const authStatePath = path.join(process.cwd(), 'playwright/.auth/user.json');
const hasAuthState = fs.existsSync(authStatePath);

/**
 * Tests for unauthenticated pages (Login, Signup, Reset Password)
 * These can run without auth state
 */
test.describe('Story DR.5: Button Styling - Public Pages', () => {
  test.describe('AC-DR.5.1, DR.5.3: Primary button styling on Login page', () => {
    test('Login button has correct primary styling', async ({ page }) => {
      await page.goto('/login');
      await page.waitForLoadState('networkidle');

      // Find the Sign In button
      const signInButton = page.locator('button[type="submit"]');
      await expect(signInButton).toBeVisible();

      // Verify button has rounded corners (rounded-lg = 8px border-radius)
      const borderRadius = await signInButton.evaluate((el) =>
        window.getComputedStyle(el).borderRadius
      );
      expect(borderRadius).toBe('8px');

      // Verify button has correct font size (text-sm = 14px)
      const fontSize = await signInButton.evaluate((el) =>
        window.getComputedStyle(el).fontSize
      );
      expect(fontSize).toBe('14px');

      // Verify button has font-medium (500)
      const fontWeight = await signInButton.evaluate((el) =>
        window.getComputedStyle(el).fontWeight
      );
      expect(fontWeight).toBe('500');
    });

    test('Login button has white text', async ({ page }) => {
      await page.goto('/login');
      await page.waitForLoadState('networkidle');

      const signInButton = page.locator('button[type="submit"]');
      await expect(signInButton).toBeVisible();

      // Verify button text is white
      const textColor = await signInButton.evaluate((el) =>
        window.getComputedStyle(el).color
      );
      // text-white = rgb(255, 255, 255)
      expect(textColor).toBe('rgb(255, 255, 255)');
    });
  });

  test.describe('AC-DR.5.5: Button transitions', () => {
    test('Login button has smooth color transitions', async ({ page }) => {
      await page.goto('/login');
      await page.waitForLoadState('networkidle');

      const signInButton = page.locator('button[type="submit"]');
      await expect(signInButton).toBeVisible();

      // Check that transition-property includes color
      const transitionProperty = await signInButton.evaluate((el) =>
        window.getComputedStyle(el).transitionProperty
      );
      // transition-colors sets transition-property containing color-related properties
      expect(transitionProperty).toContain('color');
    });
  });

  test.describe('Button accessibility on Login page', () => {
    test('Buttons are focusable with keyboard', async ({ page }) => {
      await page.goto('/login');
      await page.waitForLoadState('networkidle');

      // Tab through the page to find buttons
      let foundButton = false;
      for (let i = 0; i < 15; i++) {
        await page.keyboard.press('Tab');
        const currentFocused = await page.evaluate(() =>
          document.activeElement?.tagName.toLowerCase()
        );
        if (currentFocused === 'button') {
          foundButton = true;
          break;
        }
      }

      expect(foundButton).toBe(true);
    });

    test('Buttons have visible focus indicator', async ({ page }) => {
      await page.goto('/login');
      await page.waitForLoadState('networkidle');

      const signInButton = page.locator('button[type="submit"]');
      await signInButton.focus();

      // Check for focus-visible styles (outline or ring)
      const outlineStyle = await signInButton.evaluate((el) =>
        window.getComputedStyle(el).outlineStyle
      );
      const boxShadow = await signInButton.evaluate((el) =>
        window.getComputedStyle(el).boxShadow
      );

      // Either outline or box-shadow should indicate focus
      const hasFocusIndicator =
        outlineStyle !== 'none' || boxShadow !== 'none';
      expect(hasFocusIndicator).toBe(true);
    });
  });

  test.describe('Signup page button consistency', () => {
    test('Signup button has same styling as Login button', async ({ page }) => {
      await page.goto('/signup');
      await page.waitForLoadState('networkidle');

      const signUpButton = page.locator('button[type="submit"]');
      await expect(signUpButton).toBeVisible();

      // Verify same rounded-lg styling
      const borderRadius = await signUpButton.evaluate((el) =>
        window.getComputedStyle(el).borderRadius
      );
      expect(borderRadius).toBe('8px');

      // Verify same font styling
      const fontSize = await signUpButton.evaluate((el) =>
        window.getComputedStyle(el).fontSize
      );
      expect(fontSize).toBe('14px');

      // Verify white text
      const textColor = await signUpButton.evaluate((el) =>
        window.getComputedStyle(el).color
      );
      expect(textColor).toBe('rgb(255, 255, 255)');
    });
  });
});

/**
 * Tests for authenticated pages
 * These require auth state file to exist
 */
test.describe('Story DR.5: Button Styling - Authenticated Pages', () => {
  test.skip(!hasAuthState, 'Skipping authenticated tests - no auth state file');

  test.use({
    storageState: hasAuthState ? authStatePath : undefined,
  });

  test.describe('AC-DR.5.4: Icon button styling', () => {
    test('Header icon buttons have correct styling', async ({ page }) => {
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      // Find notification bell icon button in header
      const bellButton = page.locator('button[aria-label="Notifications (coming soon)"]');

      if (await bellButton.count() > 0) {
        await expect(bellButton).toBeVisible();

        // Icon buttons in header use rounded-full for circular look
        const borderRadius = await bellButton.evaluate((el) =>
          window.getComputedStyle(el).borderRadius
        );
        // rounded-full = 9999px
        expect(borderRadius).toBe('9999px');
      }
    });

    test('Avatar button has circular styling', async ({ page }) => {
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      // Find user menu avatar button
      const avatarButton = page.locator('button[aria-label="User menu"]');

      if (await avatarButton.count() > 0) {
        await expect(avatarButton).toBeVisible();

        // Avatar button should be circular (rounded-full)
        const borderRadius = await avatarButton.evaluate((el) =>
          window.getComputedStyle(el).borderRadius
        );
        expect(borderRadius).toBe('9999px');
      }
    });
  });

  test.describe('AC-DR.5.1: Settings page buttons', () => {
    test('Settings Save button has correct primary styling', async ({ page }) => {
      await page.goto('/settings');
      await page.waitForLoadState('networkidle');

      const saveButton = page.locator('button[type="submit"]').first();

      if (await saveButton.count() > 0) {
        await expect(saveButton).toBeVisible();

        const borderRadius = await saveButton.evaluate((el) =>
          window.getComputedStyle(el).borderRadius
        );
        expect(borderRadius).toBe('8px');

        const textColor = await saveButton.evaluate((el) =>
          window.getComputedStyle(el).color
        );
        expect(textColor).toBe('rgb(255, 255, 255)');
      }
    });
  });

  test.describe('Ghost button styling', () => {
    test('Header ghost buttons have subtle hover background', async ({ page }) => {
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      const bellButton = page.locator('button[aria-label="Notifications (coming soon)"]');

      if (await bellButton.count() > 0) {
        await expect(bellButton).toBeVisible();

        // Get background before hover (should be transparent or very subtle)
        const bgBeforeHover = await bellButton.evaluate((el) =>
          window.getComputedStyle(el).backgroundColor
        );

        // Ghost buttons should have transparent or no background initially
        expect(['rgba(0, 0, 0, 0)', 'transparent']).toContain(bgBeforeHover);

        // Hover over button
        await bellButton.hover();
        await page.waitForTimeout(250);

        // After hover, background should change to slate-100 equivalent
        const bgAfterHover = await bellButton.evaluate((el) =>
          window.getComputedStyle(el).backgroundColor
        );

        // Background should be different after hover
        expect(bgAfterHover).not.toBe(bgBeforeHover);
      }
    });
  });
});
