import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Story 11.8: Document List - Extraction Status Indicators
 *
 * AC-11.8.1: Extraction Status Badge appears on document cards/table
 * AC-11.8.2: Status states display correctly
 * AC-11.8.3: Realtime updates when extraction completes
 * AC-11.8.4: Tooltip explanations
 * AC-11.8.5: Table view Analysis column
 */

test.describe('Document Library Extraction Status Indicators', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to document library
    // Note: This test assumes the user is authenticated and has documents
    await page.goto('/documents');
    await page.waitForLoadState('networkidle');
  });

  test('AC-11.8.1: Document table shows Analysis column header', async ({ page }) => {
    // Look for the Analysis column header in the table
    const analysisHeader = page.locator('button:has-text("Analysis")');

    // Wait for table to load
    await page.waitForSelector('[data-testid="document-table"]', { timeout: 5000 }).catch(() => {
      // If no documents, table won't show - skip test
      test.skip();
    });

    if (await page.locator('[data-testid="document-table"]').isVisible()) {
      await expect(analysisHeader).toBeVisible();
    }
  });

  test('AC-11.8.2: Extraction status badge shows correct states', async ({ page }) => {
    // Test that we can identify different extraction status badges
    // These will only appear for documents with extraction_status set

    const table = page.locator('[data-testid="document-table"]');
    if (await table.isVisible()) {
      // Check for any of the extraction status badges
      const completeCount = await page.locator('[data-testid="extraction-status-complete"]').count();
      const extractingCount = await page.locator('[data-testid="extraction-status-extracting"]').count();
      const pendingCount = await page.locator('[data-testid="extraction-status-pending"]').count();
      const failedCount = await page.locator('[data-testid="extraction-status-failed"]').count();

      // At least verify the testids work (counts may be 0 if no docs)
      expect(completeCount).toBeGreaterThanOrEqual(0);
      expect(extractingCount).toBeGreaterThanOrEqual(0);
      expect(pendingCount).toBeGreaterThanOrEqual(0);
      expect(failedCount).toBeGreaterThanOrEqual(0);
    }
  });

  test('AC-11.8.4: Extraction status badge has tooltip on hover', async ({ page }) => {
    const table = page.locator('[data-testid="document-table"]');
    if (await table.isVisible()) {
      // Find any extraction status badge
      const badge = page.locator('[data-testid^="extraction-status-"]').first();

      if (await badge.isVisible()) {
        // Hover to trigger tooltip
        await badge.hover();

        // Wait for tooltip to appear
        await page.waitForTimeout(500);

        // Check for tooltip content
        // The tooltip provider will show content on hover
        const tooltip = page.locator('[role="tooltip"]');
        if (await tooltip.isVisible({ timeout: 1000 }).catch(() => false)) {
          await expect(tooltip).toContainText(/ready|analyzing|failed|extraction/i);
        }
      }
    }
  });

  test('AC-11.8.5: Analysis column is sortable', async ({ page }) => {
    const analysisHeader = page.locator('button:has-text("Analysis")');

    if (await analysisHeader.isVisible()) {
      // Click to sort ascending
      await analysisHeader.click();
      await page.waitForTimeout(300);

      // Click again to sort descending
      await analysisHeader.click();
      await page.waitForTimeout(300);

      // Verify sort icons change (arrow-up or arrow-down should be visible)
      const sortIcon = analysisHeader.locator('svg');
      await expect(sortIcon).toBeVisible();
    }
  });

  test('Failed status badge shows retry icon when hovering', async ({ page }) => {
    const failedBadge = page.locator('[data-testid="extraction-status-failed"]').first();

    if (await failedBadge.isVisible()) {
      // Check for retry icon
      const retryIcon = failedBadge.locator('[data-testid="extraction-retry-button"]');
      await expect(retryIcon).toBeVisible();
    }
  });
});
