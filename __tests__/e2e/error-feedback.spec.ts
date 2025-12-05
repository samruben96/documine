import { test, expect } from '@playwright/test';

/**
 * Story 11.5: Error Handling & User Feedback E2E Tests
 *
 * Tests error display, toast notifications, and failed document filtering.
 * Note: Tests handle cases where failed documents may or may not exist.
 */

test.describe('Error Handling & User Feedback', () => {
  test.describe('Error Display in Document List (AC-11.5.3, AC-11.5.5)', () => {
    test('shows error indicator for failed documents', async ({ page }) => {
      await page.goto('/documents');
      await page.waitForSelector('[data-testid="document-table"], [data-testid="empty-state"]');

      // Look for failed status badges
      const failedBadge = page.locator('[data-testid="status-failed"]');
      const count = await failedBadge.count();

      if (count > 0) {
        // Failed badge should be visible with red styling
        await expect(failedBadge.first()).toBeVisible();
        await expect(failedBadge.first()).toContainText('Failed');
      }
    });

    test('shows error tooltip on hover for failed documents', async ({ page }) => {
      await page.goto('/documents');
      await page.waitForSelector('[data-testid="document-table"], [data-testid="empty-state"]');

      // Look for failed status badges
      const failedBadge = page.locator('[data-testid="status-failed"]');
      const count = await failedBadge.count();

      if (count > 0) {
        // Hover over the failed badge to show tooltip
        await failedBadge.first().hover();

        // Wait for tooltip to appear
        await page.waitForTimeout(500);

        // Tooltip should show user-friendly message (not raw error)
        const tooltip = page.locator('[role="tooltip"]');
        const isVisible = await tooltip.isVisible().catch(() => false);

        if (isVisible) {
          const tooltipText = await tooltip.textContent();
          // Should NOT contain raw error patterns
          expect(tooltipText).not.toMatch(/ECONNRESET|500|Error at line/i);
          // Should contain user-friendly language
          expect(tooltipText).toMatch(/(failed|error|processing|try|please)/i);
        }
      }
    });

    test('displays error icon with proper styling', async ({ page }) => {
      await page.goto('/documents');
      await page.waitForSelector('[data-testid="document-table"], [data-testid="empty-state"]');

      const failedBadge = page.locator('[data-testid="status-failed"]');
      const count = await failedBadge.count();

      if (count > 0) {
        // Should have red color styling
        const badge = failedBadge.first();
        await expect(badge).toHaveClass(/red/);
      }
    });
  });

  test.describe('Processing Summary with Failed Filter (AC-11.5.4)', () => {
    test('shows failed count in queue summary', async ({ page }) => {
      await page.goto('/documents');
      await page.waitForSelector('[data-testid="document-table"], [data-testid="empty-state"]');

      const queueSummary = page.locator('[data-testid="queue-summary"]');
      const isVisible = await queueSummary.isVisible().catch(() => false);

      if (isVisible) {
        const failedCount = page.locator('[data-testid="queue-failed-count"]');
        const failedVisible = await failedCount.isVisible().catch(() => false);

        if (failedVisible) {
          // Should show a number
          const text = await failedCount.textContent();
          expect(text).toMatch(/\d+/);
        }
      }
    });

    test('clicking failed count filters to show only failed documents', async ({ page }) => {
      await page.goto('/documents');
      await page.waitForSelector('[data-testid="document-table"], [data-testid="empty-state"]');

      const queueSummary = page.locator('[data-testid="queue-summary"]');
      const isVisible = await queueSummary.isVisible().catch(() => false);

      if (isVisible) {
        const failedCount = page.locator('[data-testid="queue-failed-count"]');
        const failedVisible = await failedCount.isVisible().catch(() => false);

        if (failedVisible) {
          // Click the failed count to filter
          await failedCount.click();

          // Should show filter indicator
          const filterIndicator = page.locator('[data-testid="failed-filter-active"]');
          await expect(filterIndicator).toBeVisible();
          await expect(filterIndicator).toContainText(/failed/i);
        }
      }
    });

    test('can clear failed filter to show all documents', async ({ page }) => {
      await page.goto('/documents');
      await page.waitForSelector('[data-testid="document-table"], [data-testid="empty-state"]');

      const queueSummary = page.locator('[data-testid="queue-summary"]');
      const isVisible = await queueSummary.isVisible().catch(() => false);

      if (isVisible) {
        const failedCount = page.locator('[data-testid="queue-failed-count"]');
        const failedVisible = await failedCount.isVisible().catch(() => false);

        if (failedVisible) {
          // Activate filter
          await failedCount.click();

          // Find and click clear button
          const clearButton = page.locator('[data-testid="clear-filter-button"]');
          await clearButton.click();

          // Filter indicator should be hidden
          const filterIndicator = page.locator('[data-testid="failed-filter-active"]');
          await expect(filterIndicator).not.toBeVisible();
        }
      }
    });

    test('failed filter in expanded queue details works', async ({ page }) => {
      await page.goto('/documents');
      await page.waitForSelector('[data-testid="document-table"], [data-testid="empty-state"]');

      const queueSummary = page.locator('[data-testid="queue-summary"]');
      const isVisible = await queueSummary.isVisible().catch(() => false);

      if (isVisible) {
        // Expand queue details
        await queueSummary.locator('button[aria-expanded]').click();

        // Wait for details to appear
        const details = page.locator('[data-testid="queue-details"]');
        await expect(details).toBeVisible();

        // Click the failed detail row to filter
        const failedDetail = page.locator('[data-testid="queue-failed-detail"]');
        const failedDetailVisible = await failedDetail.isVisible().catch(() => false);

        if (failedDetailVisible) {
          await failedDetail.click();

          // Should show filter indicator
          const filterIndicator = page.locator('[data-testid="failed-filter-active"]');
          await expect(filterIndicator).toBeVisible();
        }
      }
    });
  });

  test.describe('Error Categories (AC-11.5.1, AC-11.5.2)', () => {
    test('transient errors show auto-retry message', async ({ page }) => {
      await page.goto('/documents');
      await page.waitForSelector('[data-testid="document-table"], [data-testid="empty-state"]');

      // Look for any transient error indicators
      const transientError = page.locator('[data-testid="error-category-transient"]');
      const count = await transientError.count();

      if (count > 0) {
        // Transient errors should mention automatic retry
        await transientError.first().hover();
        await page.waitForTimeout(300);

        const tooltip = page.locator('[role="tooltip"]');
        const isVisible = await tooltip.isVisible().catch(() => false);

        if (isVisible) {
          // Should not have manual action since it auto-retries
          const text = await tooltip.textContent();
          expect(text).not.toMatch(/please upload|contact support/i);
        }
      }
    });

    test('recoverable errors show suggested action', async ({ page }) => {
      await page.goto('/documents');
      await page.waitForSelector('[data-testid="document-table"], [data-testid="empty-state"]');

      // Look for failed badges that might have recoverable errors
      const failedBadge = page.locator('[data-testid="status-failed"]');
      const count = await failedBadge.count();

      // Check all failed badges for suggested actions
      for (let i = 0; i < Math.min(count, 3); i++) {
        await failedBadge.nth(i).hover();
        await page.waitForTimeout(300);

        const tooltip = page.locator('[role="tooltip"]');
        const isVisible = await tooltip.isVisible().catch(() => false);

        if (isVisible) {
          const text = await tooltip.textContent() || '';
          // If this is a recoverable error, it should have a suggestion
          if (text.match(/format|protected|corrupted|large/i)) {
            expect(text).toMatch(/try|please|upload|convert/i);
          }
        }

        // Move away to close tooltip
        await page.mouse.move(0, 0);
        await page.waitForTimeout(200);
      }
    });

    test('permanent errors suggest contacting support', async ({ page }) => {
      await page.goto('/documents');
      await page.waitForSelector('[data-testid="document-table"], [data-testid="empty-state"]');

      const failedBadge = page.locator('[data-testid="status-failed"]');
      const count = await failedBadge.count();

      // Check for permanent errors
      for (let i = 0; i < Math.min(count, 3); i++) {
        await failedBadge.nth(i).hover();
        await page.waitForTimeout(300);

        const tooltip = page.locator('[role="tooltip"]');
        const isVisible = await tooltip.isVisible().catch(() => false);

        if (isVisible) {
          const text = await tooltip.textContent() || '';
          // If this is a permanent error mentioning "unexpected", should suggest support
          if (text.match(/unexpected|multiple attempts/i)) {
            expect(text).toMatch(/contact support/i);
          }
        }

        await page.mouse.move(0, 0);
        await page.waitForTimeout(200);
      }
    });
  });

  test.describe('Toast Notifications (AC-11.5.3)', () => {
    test('page loads toast container', async ({ page }) => {
      await page.goto('/documents');
      await page.waitForSelector('[data-testid="document-table"], [data-testid="empty-state"]');

      // Sonner toast container should be present in the DOM
      const toaster = page.locator('[data-sonner-toaster]');
      await expect(toaster).toBeVisible();
    });

    test('no errors during page load', async ({ page }) => {
      const errors: string[] = [];
      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          errors.push(msg.text());
        }
      });

      await page.goto('/documents');
      await page.waitForSelector('[data-testid="document-table"], [data-testid="empty-state"]');

      // Wait for realtime subscriptions
      await page.waitForTimeout(2000);

      // Filter expected auth errors
      const unexpectedErrors = errors.filter(
        (e) =>
          !e.includes('auth') &&
          !e.includes('401') &&
          !e.includes('not authenticated') &&
          !e.includes('Failed to fetch')
      );

      expect(unexpectedErrors).toHaveLength(0);
    });
  });

  test.describe('User-Friendly Messages (AC-11.5.2)', () => {
    test('error messages do not expose technical details', async ({ page }) => {
      await page.goto('/documents');
      await page.waitForSelector('[data-testid="document-table"], [data-testid="empty-state"]');

      const failedBadge = page.locator('[data-testid="status-failed"]');
      const count = await failedBadge.count();

      for (let i = 0; i < Math.min(count, 5); i++) {
        await failedBadge.nth(i).hover();
        await page.waitForTimeout(300);

        const tooltip = page.locator('[role="tooltip"]');
        const isVisible = await tooltip.isVisible().catch(() => false);

        if (isVisible) {
          const text = await tooltip.textContent() || '';
          // Should NOT contain technical jargon
          expect(text).not.toMatch(/ECONNRESET|stack trace|at line|TypeError|ReferenceError/i);
          expect(text).not.toMatch(/undefined is not|cannot read property/i);
          expect(text).not.toMatch(/HTTP [45]\d\d:/i);
        }

        await page.mouse.move(0, 0);
        await page.waitForTimeout(200);
      }
    });
  });
});
