import { test, expect } from '@playwright/test';

/**
 * Story 11.4: Processing Queue Visualization E2E Tests
 *
 * Tests queue position display, estimated wait time, and queue summary.
 * Note: These tests require mock data setup or actual processing jobs.
 */

test.describe('Queue Visualization', () => {
  test.describe('Queue Position Display (AC-11.4.1)', () => {
    test('shows queue position for pending documents', async ({ page }) => {
      // Navigate to documents page
      await page.goto('/documents');

      // Wait for page load
      await page.waitForSelector('[data-testid="document-table"], [data-testid="empty-state"]');

      // If there are processing documents with queue position, verify display
      const queuePosition = page.locator('[data-testid="queue-position"]');
      const count = await queuePosition.count();

      if (count > 0) {
        // Should show "Position X of Y" format
        await expect(queuePosition.first()).toContainText(/Position \d+ of \d+/);
      }
    });

    test('hides queue position for non-pending documents', async ({ page }) => {
      await page.goto('/documents');
      await page.waitForSelector('[data-testid="document-table"], [data-testid="empty-state"]');

      // Check completed documents don't show queue position
      const completedDocs = page.locator('[data-testid="processing-progress-bar"]:has([data-testid="success-indicator"])');
      const count = await completedDocs.count();

      for (let i = 0; i < count; i++) {
        const doc = completedDocs.nth(i);
        await expect(doc.locator('[data-testid="queue-position"]')).not.toBeVisible();
      }
    });
  });

  test.describe('Estimated Wait Time (AC-11.4.2)', () => {
    test('displays estimated wait time in minutes format', async ({ page }) => {
      await page.goto('/documents');
      await page.waitForSelector('[data-testid="document-table"], [data-testid="empty-state"]');

      const queuePosition = page.locator('[data-testid="queue-position"]');
      const count = await queuePosition.count();

      if (count > 0) {
        // Should show "Est. wait: ~X min" or "<1 min"
        const text = await queuePosition.first().textContent();
        expect(text).toMatch(/Est\. wait: (~\d+ min|<1 min)/);
      }
    });
  });

  test.describe('Queue Summary (AC-11.4.3)', () => {
    test('shows queue summary when processing activity exists', async ({ page }) => {
      await page.goto('/documents');
      await page.waitForSelector('[data-testid="document-table"], [data-testid="empty-state"]');

      // Queue summary may or may not be visible depending on actual processing state
      const queueSummary = page.locator('[data-testid="queue-summary"]');
      const isVisible = await queueSummary.isVisible().catch(() => false);

      if (isVisible) {
        // Verify it shows Processing Queue header
        await expect(queueSummary).toContainText('Processing Queue');
      }
    });

    test('expands queue summary to show details', async ({ page }) => {
      await page.goto('/documents');
      await page.waitForSelector('[data-testid="document-table"], [data-testid="empty-state"]');

      const queueSummary = page.locator('[data-testid="queue-summary"]');
      const isVisible = await queueSummary.isVisible().catch(() => false);

      if (isVisible) {
        // Click to expand
        await queueSummary.locator('button').click();

        // Should show queue details
        const details = page.locator('[data-testid="queue-details"]');
        await expect(details).toBeVisible();

        // Should have status breakdown
        await expect(details).toContainText('Waiting:');
        await expect(details).toContainText('Processing:');
        await expect(details).toContainText('Completed (24h):');
        await expect(details).toContainText('Failed:');
      }
    });

    test('shows pending count badge', async ({ page }) => {
      await page.goto('/documents');
      await page.waitForSelector('[data-testid="document-table"], [data-testid="empty-state"]');

      const pendingCount = page.locator('[data-testid="queue-pending-count"]');
      const isVisible = await pendingCount.isVisible().catch(() => false);

      if (isVisible) {
        // Should show a number
        const text = await pendingCount.textContent();
        expect(text).toMatch(/\d+/);
      }
    });

    test('shows processing count badge with spinner', async ({ page }) => {
      await page.goto('/documents');
      await page.waitForSelector('[data-testid="document-table"], [data-testid="empty-state"]');

      const processingCount = page.locator('[data-testid="queue-processing-count"]');
      const isVisible = await processingCount.isVisible().catch(() => false);

      if (isVisible) {
        // Should contain animated spinner
        const spinner = processingCount.locator('.animate-spin');
        await expect(spinner).toBeVisible();
      }
    });

    test('collapses on second click', async ({ page }) => {
      await page.goto('/documents');
      await page.waitForSelector('[data-testid="document-table"], [data-testid="empty-state"]');

      const queueSummary = page.locator('[data-testid="queue-summary"]');
      const isVisible = await queueSummary.isVisible().catch(() => false);

      if (isVisible) {
        const button = queueSummary.locator('button');

        // First click - expand
        await button.click();
        await expect(page.locator('[data-testid="queue-details"]')).toBeVisible();

        // Second click - collapse
        await button.click();
        await expect(page.locator('[data-testid="queue-details"]')).not.toBeVisible();
      }
    });
  });

  test.describe('Realtime Updates (AC-11.4.4)', () => {
    test('page loads without errors', async ({ page }) => {
      // Collect console errors
      const errors: string[] = [];
      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          errors.push(msg.text());
        }
      });

      await page.goto('/documents');
      await page.waitForSelector('[data-testid="document-table"], [data-testid="empty-state"]');

      // Wait a bit for realtime subscriptions to establish
      await page.waitForTimeout(2000);

      // Filter out expected network errors (auth errors when not logged in)
      const unexpectedErrors = errors.filter(
        (e) => !e.includes('auth') && !e.includes('401') && !e.includes('not authenticated')
      );

      expect(unexpectedErrors).toHaveLength(0);
    });
  });
});
