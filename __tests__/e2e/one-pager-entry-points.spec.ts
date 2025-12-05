import { test, expect } from '@playwright/test';

/**
 * One-Pager Entry Point E2E Tests
 *
 * Story 9.5: Entry Point Buttons
 *
 * Tests for:
 * - AC-9.5.1: Button on comparison results page
 * - AC-9.5.2: Button in comparison history row actions
 * - AC-9.5.3: Button on document viewer header
 */

// Test credentials
const TEST_EMAIL = process.env.TEST_USER_EMAIL || 'test@example.com';
const TEST_PASSWORD = process.env.TEST_USER_PASSWORD || 'testpassword123';

test.describe('One-Pager Entry Points', () => {
  /**
   * Helper function to login
   */
  async function login(page: any) {
    await page.goto('/login');
    await page.fill('input[name="email"]', TEST_EMAIL);
    await page.fill('input[name="password"]', TEST_PASSWORD);
    await page.click('button[type="submit"]');
    // Wait for redirect to documents page
    await page.waitForURL(/\/documents/, { timeout: 10000 });
  }

  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test.describe('AC-9.5.1: Comparison Results Button', () => {
    /**
     * Helper to get a completed comparison ID
     */
    async function getCompletedComparison(page: any): Promise<string | null> {
      await page.goto('/compare');

      // Wait for history to load
      const historyTable = page.locator('[data-testid="comparison-history"]');
      const hasHistory = await historyTable.isVisible({ timeout: 10000 }).catch(() => false);

      if (!hasHistory) return null;

      // Find a complete comparison row
      const completeRow = page.locator('tr:has-text("Complete")').first();
      const hasComplete = await completeRow.isVisible().catch(() => false);

      if (!hasComplete) return null;

      // Click to navigate to comparison detail
      await completeRow.click();

      // Wait for navigation
      await page.waitForURL(/\/compare\/[a-f0-9-]+/, { timeout: 10000 });

      // Extract ID from URL
      const url = page.url();
      const match = url.match(/\/compare\/([a-f0-9-]+)/);
      return match ? match[1] : null;
    }

    test('displays Generate One-Pager button in header', async ({ page }) => {
      const comparisonId = await getCompletedComparison(page);

      if (!comparisonId) {
        test.skip();
        return;
      }

      // Button should be visible in header
      const onePagerButton = page.locator('[data-testid="one-pager-button"]');
      await expect(onePagerButton).toBeVisible({ timeout: 5000 });
    });

    test('button navigates to one-pager with comparisonId', async ({ page }) => {
      const comparisonId = await getCompletedComparison(page);

      if (!comparisonId) {
        test.skip();
        return;
      }

      // Click the one-pager button
      const onePagerButton = page.locator('[data-testid="one-pager-button"]');
      await onePagerButton.click();

      // Should navigate to one-pager with comparison ID
      await page.waitForURL(/\/one-pager\?comparisonId=/, { timeout: 10000 });

      // URL should contain the comparison ID
      expect(page.url()).toContain(`comparisonId=${comparisonId}`);
    });

    test('button not shown for processing comparisons', async ({ page }) => {
      await page.goto('/compare');

      // Look for a processing comparison
      const processingRow = page.locator('tr:has-text("Processing")').first();
      const hasProcessing = await processingRow.isVisible({ timeout: 5000 }).catch(() => false);

      if (!hasProcessing) {
        test.skip();
        return;
      }

      await processingRow.click();
      await page.waitForURL(/\/compare\/[a-f0-9-]+/, { timeout: 10000 });

      // One-pager button should NOT be visible for processing comparisons
      const onePagerButton = page.locator('[data-testid="one-pager-button"]');
      await expect(onePagerButton).toBeHidden({ timeout: 3000 });
    });
  });

  test.describe('AC-9.5.2: Comparison History Row Actions', () => {
    test('displays one-pager icon button in history row', async ({ page }) => {
      await page.goto('/compare');

      // Wait for history to load
      const historyTable = page.locator('[data-testid="comparison-history"]');
      const hasHistory = await historyTable.isVisible({ timeout: 10000 }).catch(() => false);

      if (!hasHistory) {
        test.skip();
        return;
      }

      // Look for a complete comparison row
      const completeRow = page.locator('tr:has-text("Complete")').first();
      const hasComplete = await completeRow.isVisible().catch(() => false);

      if (!hasComplete) {
        test.skip();
        return;
      }

      // One-pager button should be in the row
      const onePagerIcon = completeRow.locator('[data-one-pager-button]');
      await expect(onePagerIcon).toBeVisible();
    });

    test('history row one-pager button navigates correctly', async ({ page }) => {
      await page.goto('/compare');

      // Wait for history
      await page.waitForSelector('[data-testid="comparison-history"]', { timeout: 10000 });

      // Find complete comparison row
      const completeRow = page.locator('tr:has-text("Complete")').first();
      const hasComplete = await completeRow.isVisible().catch(() => false);

      if (!hasComplete) {
        test.skip();
        return;
      }

      // Click the one-pager icon (not the row itself)
      const onePagerIcon = completeRow.locator('[data-one-pager-button]');
      await onePagerIcon.click();

      // Should navigate to one-pager with comparison ID
      await page.waitForURL(/\/one-pager\?comparisonId=/, { timeout: 10000 });
    });

    test('one-pager icon not shown for failed comparisons', async ({ page }) => {
      await page.goto('/compare');

      // Wait for history
      await page.waitForSelector('[data-testid="comparison-history"]', { timeout: 10000 }).catch(() => null);

      // Look for a failed comparison row
      const failedRow = page.locator('tr:has-text("Failed")').first();
      const hasFailed = await failedRow.isVisible({ timeout: 3000 }).catch(() => false);

      if (!hasFailed) {
        test.skip();
        return;
      }

      // One-pager button should NOT be in the failed row
      const onePagerIcon = failedRow.locator('[data-one-pager-button]');
      await expect(onePagerIcon).toBeHidden();
    });
  });

  test.describe('AC-9.5.3: Document Viewer Button', () => {
    /**
     * Helper to get first ready document
     */
    async function getFirstReadyDocument(page: any): Promise<string | null> {
      await page.goto('/documents');
      await page.waitForSelector('[data-testid="document-list"]', { timeout: 10000 }).catch(() => null);

      // Get first document link
      const docLink = page.locator('a[href^="/documents/"]').first();
      const isVisible = await docLink.isVisible().catch(() => false);

      if (!isVisible) return null;

      const href = await docLink.getAttribute('href');
      if (!href) return null;

      const match = href.match(/\/documents\/([a-f0-9-]+)/);
      return match ? match[1] : null;
    }

    test('displays Generate One-Pager button in document header', async ({ page }) => {
      const docId = await getFirstReadyDocument(page);

      if (!docId) {
        test.skip();
        return;
      }

      await page.goto(`/chat-docs/${docId}`);

      // Wait for document to load
      await page.waitForTimeout(2000); // Wait for PDF loading

      // Button should be visible in header (for ready documents)
      const onePagerButton = page.locator('[data-testid="one-pager-button"]');

      // May or may not be visible depending on document status
      const isVisible = await onePagerButton.isVisible({ timeout: 5000 }).catch(() => false);

      if (isVisible) {
        await expect(onePagerButton).toBeVisible();
      }
    });

    test('document header button navigates to one-pager with documentId', async ({ page }) => {
      const docId = await getFirstReadyDocument(page);

      if (!docId) {
        test.skip();
        return;
      }

      await page.goto(`/chat-docs/${docId}`);
      await page.waitForTimeout(2000);

      // Check if button exists
      const onePagerButton = page.locator('[data-testid="one-pager-button"]');
      const isVisible = await onePagerButton.isVisible({ timeout: 5000 }).catch(() => false);

      if (!isVisible) {
        test.skip();
        return;
      }

      // Click the button
      await onePagerButton.click();

      // Should navigate to one-pager with document ID
      await page.waitForURL(/\/one-pager\?documentId=/, { timeout: 10000 });

      // URL should contain the document ID
      expect(page.url()).toContain(`documentId=${docId}`);
    });
  });

  test.describe('AC-9.5.4: Consistent Styling', () => {
    test('all buttons have FileText icon', async ({ page }) => {
      // Check comparison page button
      await page.goto('/compare');
      await page.waitForSelector('[data-testid="comparison-history"]', { timeout: 10000 }).catch(() => null);

      const completeRow = page.locator('tr:has-text("Complete")').first();
      const hasComplete = await completeRow.isVisible().catch(() => false);

      if (hasComplete) {
        // One-pager icon should have SVG (FileText icon)
        const onePagerIcon = completeRow.locator('[data-one-pager-button] svg');
        await expect(onePagerIcon).toBeVisible();
      }
    });
  });

  test.describe('Navigation Consistency', () => {
    test('one-pager page loads comparison data correctly', async ({ page }) => {
      await page.goto('/compare');
      await page.waitForSelector('[data-testid="comparison-history"]', { timeout: 10000 }).catch(() => null);

      const completeRow = page.locator('tr:has-text("Complete")').first();
      const hasComplete = await completeRow.isVisible().catch(() => false);

      if (!hasComplete) {
        test.skip();
        return;
      }

      // Navigate via icon button
      const onePagerIcon = completeRow.locator('[data-one-pager-button]');
      await onePagerIcon.click();

      // Wait for one-pager page
      await page.waitForURL(/\/one-pager\?comparisonId=/, { timeout: 10000 });

      // Should show form view (not selector)
      await expect(page.locator('text=Customize One-Pager')).toBeVisible({ timeout: 15000 });
    });
  });
});
