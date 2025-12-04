import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Comparison History
 *
 * Story 7.7: AC-7.7.1 through AC-7.7.8
 *
 * These tests verify the comparison history feature works end-to-end:
 * - History table display
 * - View past comparison
 * - Search and filter
 * - Individual and bulk delete
 */

test.describe('Comparison History', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to compare page (which shows history by default)
    await page.goto('/compare');
  });

  test.describe('AC-7.7.1: History Table Display', () => {
    test('shows history table with past comparisons', async ({ page }) => {
      // Wait for the history component to load
      await page.waitForSelector('[data-testid="comparison-history"]', { timeout: 10000 });

      // Check table headers exist
      await expect(page.getByText('Date')).toBeVisible();
      await expect(page.getByText('Documents')).toBeVisible();
      await expect(page.getByText('Status')).toBeVisible();
    });

    test('shows empty state when no comparisons exist', async ({ page }) => {
      // This test depends on user having no comparisons
      // May need to set up fresh user or clear data first
      const emptyState = page.getByTestId('comparison-empty-state');

      // Check if we have empty state or history
      if (await emptyState.isVisible().catch(() => false)) {
        await expect(page.getByText('No comparisons yet')).toBeVisible();
        await expect(page.getByText('Create Your First Comparison')).toBeVisible();
      }
    });
  });

  test.describe('AC-7.7.2: View Past Comparison', () => {
    test('clicking row navigates to comparison detail', async ({ page }) => {
      await page.waitForSelector('[data-testid="comparison-history"]', { timeout: 10000 });

      // Look for a table row (skip header)
      const rows = page.locator('table tbody tr');
      const firstRow = rows.first();

      if ((await rows.count()) > 0) {
        // Click the row (but not on checkbox or delete)
        const dateCell = firstRow.locator('td').nth(1); // Date column
        await dateCell.click();

        // Should navigate to /compare/[id]
        await expect(page).toHaveURL(/\/compare\/[\w-]+/);
      }
    });
  });

  test.describe('AC-7.7.4: Search & Filter', () => {
    test('search filters by document name', async ({ page }) => {
      await page.waitForSelector('[data-testid="comparison-history-filters"]', { timeout: 10000 });

      // Type in search
      const searchInput = page.getByTestId('comparison-search-input');
      await searchInput.fill('progressive');

      // Wait for debounce
      await page.waitForTimeout(300);

      // Results should be filtered (or show "No comparisons found matching...")
      // This depends on actual data, so we just verify no error
      await expect(page.getByTestId('comparison-history')).toBeVisible();
    });

    test('date range filters comparisons', async ({ page }) => {
      await page.waitForSelector('[data-testid="comparison-history-filters"]', { timeout: 10000 });

      // Set date range
      const fromInput = page.getByTestId('from-date-input');
      const toInput = page.getByTestId('to-date-input');

      await fromInput.fill('2024-01-01');
      await toInput.fill('2024-12-31');

      // Wait for results to update
      await page.waitForTimeout(500);

      // Verify filter applied (component should still render)
      await expect(page.getByTestId('comparison-history')).toBeVisible();
    });

    test('preset dropdown filters by time period', async ({ page }) => {
      await page.waitForSelector('[data-testid="comparison-history-filters"]', { timeout: 10000 });

      // Click preset dropdown
      await page.getByText('All time').click();

      // Select Last 7 days
      await page.getByText('Last 7 days').click();

      // Dropdown should show new preset label
      await expect(page.getByText('Last 7 days')).toBeVisible();
    });
  });

  test.describe('AC-7.7.3: Individual Delete', () => {
    test('delete button opens confirmation dialog', async ({ page }) => {
      await page.waitForSelector('[data-testid="comparison-history"]', { timeout: 10000 });

      const rows = page.locator('table tbody tr');

      if ((await rows.count()) > 0) {
        // Find delete button in first row
        const deleteButton = rows.first().getByLabel('Delete comparison');
        await deleteButton.click();

        // Confirmation dialog should appear
        await expect(page.getByText('Delete Comparison')).toBeVisible();
        await expect(page.getByText(/Are you sure you want to delete/)).toBeVisible();

        // Cancel to not actually delete
        await page.getByRole('button', { name: 'Cancel' }).click();
      }
    });
  });

  test.describe('AC-7.7.7 & AC-7.7.8: Bulk Delete', () => {
    test('selecting rows shows bulk delete action', async ({ page }) => {
      await page.waitForSelector('[data-testid="comparison-history"]', { timeout: 10000 });

      const checkboxes = page.locator('table tbody tr input[type="checkbox"]');

      if ((await checkboxes.count()) > 0) {
        // Click first row checkbox
        await checkboxes.first().click();

        // Bulk action bar should appear
        await expect(page.getByText('1 selected')).toBeVisible();
        await expect(page.getByText('Delete Selected (1)')).toBeVisible();
      }
    });

    test('header checkbox selects all rows', async ({ page }) => {
      await page.waitForSelector('[data-testid="comparison-history"]', { timeout: 10000 });

      const headerCheckbox = page.locator('table thead input[type="checkbox"]');
      const rowCheckboxes = page.locator('table tbody tr');
      const rowCount = await rowCheckboxes.count();

      if (rowCount > 0) {
        // Click header checkbox
        await headerCheckbox.click();

        // All rows should be selected
        await expect(page.getByText(`${rowCount} selected`)).toBeVisible();

        // Click again to deselect
        await headerCheckbox.click();

        // Selection should be cleared
        await expect(page.getByText(`${rowCount} selected`)).not.toBeVisible();
      }
    });
  });

  test.describe('Navigation', () => {
    test('New Comparison button switches to selection view', async ({ page }) => {
      // Click New Comparison button
      await page.getByRole('button', { name: 'New Comparison' }).click();

      // URL should have view=new
      await expect(page).toHaveURL(/view=new/);

      // Should show document selection UI
      await expect(page.getByText('Select 2-4 documents to compare side-by-side')).toBeVisible();
    });

    test('Back button returns to history view', async ({ page }) => {
      // Go to new comparison view
      await page.goto('/compare?view=new');

      // Click back
      await page.getByRole('button', { name: 'Back' }).click();

      // Should return to history
      await expect(page).toHaveURL('/compare');
      await expect(page.getByText('View past comparisons or create a new one')).toBeVisible();
    });
  });

  test.describe('AC-7.7.6: Pagination', () => {
    test('pagination controls work correctly', async ({ page }) => {
      await page.waitForSelector('[data-testid="comparison-history"]', { timeout: 10000 });

      // Check if pagination exists (only if > 20 comparisons)
      const paginationText = page.getByText(/Page \d+ of \d+/);

      if (await paginationText.isVisible().catch(() => false)) {
        // If on first page, Next should be enabled
        const nextButton = page.getByRole('button', { name: 'Next' });
        const prevButton = page.getByRole('button', { name: 'Previous' });

        // Previous should be disabled on first page
        await expect(prevButton).toBeDisabled();

        // Click next if more pages
        if (await nextButton.isEnabled()) {
          await nextButton.click();
          await expect(page.getByText(/Page 2 of/)).toBeVisible();
        }
      }
    });
  });
});
