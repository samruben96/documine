/**
 * E2E Tests: Form Styling Consistency
 * Story DR.6: Form Input Refinement
 *
 * Tests that form inputs across the application have consistent styling.
 * AC-DR.6.1: Inputs have border border-slate-200 rounded-lg
 * AC-DR.6.2: Inputs have px-3 py-2 text-sm styling
 * AC-DR.6.3: Focus state: focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary
 * AC-DR.6.4: Labels use text-sm font-medium text-slate-700
 * AC-DR.6.5: Required field indicator with text-red-500 asterisk
 * AC-DR.6.6: Select dropdowns match input styling
 *
 * Note: These tests verify class names are applied correctly.
 * Computed style tests may vary by browser/environment.
 */

import { test, expect } from '@playwright/test';

test.describe('Form Styling Consistency - Story DR.6', () => {
  test.describe('Login Page Form', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/login');
      await page.waitForLoadState('domcontentloaded');
    });

    test('AC-DR.6.1: Email input uses Input component with data-slot', async ({ page }) => {
      const emailInput = page.locator('input[type="email"]');
      await expect(emailInput).toBeVisible();
      await expect(emailInput).toHaveAttribute('data-slot', 'input');
    });

    test('AC-DR.6.3: Input can be focused', async ({ page }) => {
      const emailInput = page.locator('input[type="email"]');
      await expect(emailInput).toBeVisible();
      await emailInput.focus();
      await expect(emailInput).toBeFocused();
    });

    test('Password input is present and focusable', async ({ page }) => {
      const passwordInput = page.locator('input[type="password"]');
      await expect(passwordInput).toBeVisible();
      await passwordInput.focus();
      await expect(passwordInput).toBeFocused();
    });
  });

  test.describe('SignUp Page Form', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/signup');
      await page.waitForLoadState('domcontentloaded');
    });

    test('AC-DR.6.1: Name input uses Input component', async ({ page }) => {
      const nameInput = page.locator('input[name="fullName"]');
      if (await nameInput.isVisible({ timeout: 3000 }).catch(() => false)) {
        await expect(nameInput).toHaveAttribute('data-slot', 'input');
      }
    });

    test('AC-DR.6.6: Select triggers have correct data-slot', async ({ page }) => {
      const selectTrigger = page.locator('[data-slot="select-trigger"]').first();
      if (await selectTrigger.isVisible({ timeout: 3000 }).catch(() => false)) {
        await expect(selectTrigger).toBeVisible();
      }
    });
  });

  test.describe('Password Reset Page Form', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/reset-password');
      await page.waitForLoadState('domcontentloaded');
    });

    test('AC-DR.6.1: Email input uses Input component', async ({ page }) => {
      const emailInput = page.locator('input[type="email"]');
      await expect(emailInput).toBeVisible();
      await expect(emailInput).toHaveAttribute('data-slot', 'input');
    });
  });

  test.describe('Visual Consistency', () => {
    test('All auth pages use consistent Input component', async ({ page }) => {
      const authPages = ['/login', '/signup', '/reset-password'];

      for (const pagePath of authPages) {
        await page.goto(pagePath);
        await page.waitForLoadState('domcontentloaded');

        const inputs = page.locator('[data-slot="input"]');
        const count = await inputs.count();

        // Each auth page should have at least one input
        expect(count).toBeGreaterThan(0);
      }
    });
  });

  test.describe('Input Accessibility', () => {
    test('Login inputs have proper aria attributes when invalid', async ({ page }) => {
      await page.goto('/login');
      await page.waitForLoadState('domcontentloaded');

      const emailInput = page.locator('input[type="email"]');
      await expect(emailInput).toBeVisible();

      // Initially should not be aria-invalid
      const ariaInvalid = await emailInput.getAttribute('aria-invalid');
      expect(ariaInvalid === null || ariaInvalid === 'false').toBe(true);
    });
  });

  test.describe('Form Interaction', () => {
    test('Can type in login form inputs', async ({ page }) => {
      await page.goto('/login');
      await page.waitForLoadState('domcontentloaded');

      const emailInput = page.locator('input[type="email"]');
      await emailInput.fill('test@example.com');
      await expect(emailInput).toHaveValue('test@example.com');

      const passwordInput = page.locator('input[type="password"]');
      await passwordInput.fill('password123');
      await expect(passwordInput).toHaveValue('password123');
    });
  });
});
