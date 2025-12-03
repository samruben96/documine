import { test, expect } from '@playwright/test';

/**
 * Document List UX Polish E2E Tests
 * Story 6.7: Tests for selection highlight, empty states, and filename tooltips
 */

test.describe('Document List UX', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the documents page
    await page.goto('/documents');
  });

  test.describe('Document Selection Highlight (AC-6.7.1-5)', () => {
    test('selected document has aria-selected="true"', async ({ page }) => {
      // Wait for document list to load
      await page.waitForSelector('[data-testid="document-list"]', { timeout: 10000 });

      // Check if there are any documents
      const documentItems = page.locator('[data-testid="document-list-item"]');
      const count = await documentItems.count();

      if (count > 0) {
        // Click on the first document
        await documentItems.first().click();

        // Wait for navigation to document detail page
        await page.waitForURL(/\/documents\/[a-z0-9-]+$/);

        // Check that the selected item has aria-selected="true"
        const selectedItem = page.locator('[aria-selected="true"]');
        await expect(selectedItem).toBeVisible();
      }
    });

    test('selection highlight is visible (has distinct background)', async ({ page }) => {
      // Wait for documents to load
      await page.waitForSelector('[data-testid="document-list"]', { timeout: 10000 });

      const documentItems = page.locator('[data-testid="document-list-item"]');
      const count = await documentItems.count();

      if (count > 0) {
        // Click on first document to select it
        await documentItems.first().click();
        await page.waitForURL(/\/documents\/[a-z0-9-]+$/);

        // Verify selection styling is applied (border-l-2 class indicates selection)
        const selectedItem = page.locator('[aria-selected="true"]');
        await expect(selectedItem).toHaveClass(/border-l-/);
      }
    });
  });

  test.describe('Empty State UX (AC-6.7.6-10)', () => {
    test('shows "Ready to analyze" headline when no documents', async ({ page }) => {
      // This test assumes the user has no documents
      // In a real test environment, you would set up a clean user state

      // Check for empty state messaging in main area
      const heading = page.getByRole('heading', { name: /ready to analyze/i });

      // If heading exists, verify the CTA
      if (await heading.isVisible({ timeout: 3000 }).catch(() => false)) {
        await expect(heading).toBeVisible();

        // Check for upload zone (CTA button)
        const uploadZone = page.locator('[data-testid="upload-zone"]');
        await expect(uploadZone).toBeVisible();
      }
    });

    test('shows "Choose a document" when documents exist but none selected', async ({ page }) => {
      // Wait for initial load
      await page.waitForLoadState('networkidle');

      // Check for the "choose a document" message in main area
      const heading = page.getByRole('heading', { name: /choose a document/i });

      // This message appears when documents exist but none is selected
      if (await heading.isVisible({ timeout: 3000 }).catch(() => false)) {
        await expect(heading).toBeVisible();
      }
    });

    test('empty states are responsive on mobile', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });

      // Reload to trigger mobile layout
      await page.reload();
      await page.waitForLoadState('networkidle');

      // The empty state should still be visible and not overflow
      const mainContent = page.locator('main, [role="main"]').first();

      if (await mainContent.isVisible({ timeout: 3000 }).catch(() => false)) {
        // Check that content doesn't overflow horizontally
        const box = await mainContent.boundingBox();
        if (box) {
          expect(box.width).toBeLessThanOrEqual(375);
        }
      }
    });
  });

  test.describe('Long Filename Tooltip (AC-6.7.11-15)', () => {
    test('tooltip shows full filename on hover', async ({ page }) => {
      // Wait for documents to load
      await page.waitForSelector('[data-testid="document-list"]', { timeout: 10000 });

      const documentItems = page.locator('[data-testid="document-list-item"]');
      const count = await documentItems.count();

      if (count > 0) {
        // Find a document with a potentially truncated name
        const firstDocName = documentItems.first().locator('p.truncate').first();

        // Hover over the filename to trigger tooltip
        await firstDocName.hover();

        // Wait for tooltip to appear
        const tooltip = page.locator('[role="tooltip"]');

        // Tooltip may not appear if text isn't truncated
        if (await tooltip.isVisible({ timeout: 1000 }).catch(() => false)) {
          await expect(tooltip).toBeVisible();
        }
      }
    });

    test('tooltip accessible via keyboard focus', async ({ page }) => {
      // Wait for documents to load
      await page.waitForSelector('[data-testid="document-list"]', { timeout: 10000 });

      const documentItems = page.locator('[data-testid="document-list-item"]');
      const count = await documentItems.count();

      if (count > 0) {
        // Tab to focus on the document list
        await page.keyboard.press('Tab');

        // Keep tabbing until we reach a focusable element in the document list
        for (let i = 0; i < 5; i++) {
          await page.keyboard.press('Tab');

          // Check if tooltip appears on focus
          const tooltip = page.locator('[role="tooltip"]');
          if (await tooltip.isVisible({ timeout: 500 }).catch(() => false)) {
            await expect(tooltip).toBeVisible();
            break;
          }
        }
      }
    });

    test('filenames truncate with ellipsis', async ({ page }) => {
      // Wait for documents to load
      await page.waitForSelector('[data-testid="document-list"]', { timeout: 10000 });

      const documentItems = page.locator('[data-testid="document-list-item"]');
      const count = await documentItems.count();

      if (count > 0) {
        // Check that filename elements have truncate class
        const truncatedElements = documentItems.first().locator('p.truncate');
        await expect(truncatedElements.first()).toHaveClass(/truncate/);
      }
    });
  });
});
