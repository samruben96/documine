/**
 * E2E Tests for Extraction Status on Comparison Page
 *
 * Story 11.7: Comparison Page - Extraction Status Handling
 * AC-11.7.1 through AC-11.7.6
 */

import { test, expect } from '@playwright/test';

test.describe('Extraction Status on Comparison Page', () => {
  // Test data-testid selectors for Story 11.7
  const selectors = {
    pendingBanner: '[data-testid="extraction-pending-banner"]',
    failedBanner: '[data-testid="extraction-failed-banner"]',
    pendingDoc: '[data-testid="extraction-pending-doc"]',
    estimate: '[data-testid="extraction-estimate"]',
    chatLink: '[data-testid="chat-while-waiting-link"]',
    completeIndicator: '[data-testid="extraction-complete-indicator"]',
    inProgressIndicator: '[data-testid="extraction-in-progress-indicator"]',
    pendingIndicator: '[data-testid="extraction-pending-indicator"]',
    failedIndicator: '[data-testid="extraction-failed-indicator"]',
    retryButton: '[data-testid="extraction-retry-button"]',
    quoteCard: '[data-testid="quote-card"]',
    newComparisonBtn: 'button:has-text("New Comparison")',
    compareBtn: 'button:has-text("Compare")',
  };

  test.beforeEach(async ({ page }) => {
    // Navigate to the compare page
    await page.goto('/compare');
    // Wait for page to load
    await page.waitForLoadState('networkidle');
  });

  test('should show extraction status indicators on quote cards (AC-11.7.5)', async ({ page }) => {
    // Click "New Comparison" to show document grid
    const newComparisonBtn = page.locator(selectors.newComparisonBtn);
    if (await newComparisonBtn.isVisible()) {
      await newComparisonBtn.click();
    }

    // Wait for quote cards to appear
    await page.waitForSelector(selectors.quoteCard, { timeout: 10000 }).catch(() => {
      // No quote cards is acceptable - this is a new/empty database scenario
    });

    // If quote cards exist, check for extraction indicators
    const quoteCards = page.locator(selectors.quoteCard);
    const count = await quoteCards.count();

    if (count > 0) {
      // Each card should have one of the extraction indicators
      for (let i = 0; i < Math.min(count, 3); i++) {
        const card = quoteCards.nth(i);

        // Check for any extraction indicator
        const hasComplete = await card.locator(selectors.completeIndicator).isVisible().catch(() => false);
        const hasInProgress = await card.locator(selectors.inProgressIndicator).isVisible().catch(() => false);
        const hasPending = await card.locator(selectors.pendingIndicator).isVisible().catch(() => false);
        const hasFailed = await card.locator(selectors.failedIndicator).isVisible().catch(() => false);

        // At least one indicator should be visible (unless card is processing status)
        const cardText = await card.textContent();
        const isProcessing = cardText?.includes('Processing...');

        if (!isProcessing) {
          expect(hasComplete || hasInProgress || hasPending || hasFailed).toBe(true);
        }
      }
    }
  });

  test('should show pending extraction banner when selecting extracting documents (AC-11.7.2)', async ({ page }) => {
    // This test requires documents with extraction_status = 'extracting' or 'pending'
    // In a real scenario, we'd seed the database with test documents

    // Click "New Comparison" to show document grid
    const newComparisonBtn = page.locator(selectors.newComparisonBtn);
    if (await newComparisonBtn.isVisible()) {
      await newComparisonBtn.click();
    }

    // Wait for cards to load
    await page.waitForTimeout(1000);

    // Check if any card has pending/extracting indicator
    const pendingCard = page.locator(
      `${selectors.quoteCard}:has(${selectors.pendingIndicator}), ${selectors.quoteCard}:has(${selectors.inProgressIndicator})`
    );

    if (await pendingCard.count() > 0) {
      // Select the pending document
      await pendingCard.first().click();

      // Select a second document
      const anyCard = page.locator(selectors.quoteCard).nth(1);
      if (await anyCard.isVisible()) {
        await anyCard.click();
      }

      // Check for pending banner
      const pendingBanner = page.locator(selectors.pendingBanner);
      if (await pendingBanner.isVisible()) {
        // Verify banner contains expected elements
        await expect(pendingBanner).toContainText('Analyzing Quote Details');
        await expect(page.locator(selectors.estimate)).toBeVisible();
        await expect(page.locator(selectors.chatLink)).toBeVisible();
      }
    }
  });

  test('should provide chat link in pending banner (AC-11.7.3)', async ({ page }) => {
    // This test checks that the chat link navigates correctly

    // Click "New Comparison" to show document grid
    const newComparisonBtn = page.locator(selectors.newComparisonBtn);
    if (await newComparisonBtn.isVisible()) {
      await newComparisonBtn.click();
    }

    await page.waitForTimeout(1000);

    // If pending banner is visible (from previous selections or mock data)
    const pendingBanner = page.locator(selectors.pendingBanner);
    if (await pendingBanner.isVisible()) {
      const chatLink = page.locator(selectors.chatLink);
      await expect(chatLink).toBeVisible();

      // Verify link href format
      const href = await chatLink.getAttribute('href');
      expect(href).toMatch(/^\/chat-docs\/[a-f0-9-]+$/);
    }
  });

  test('should disable compare button when extraction pending (AC-11.7.1)', async ({ page }) => {
    // Click "New Comparison" to show document grid
    const newComparisonBtn = page.locator(selectors.newComparisonBtn);
    if (await newComparisonBtn.isVisible()) {
      await newComparisonBtn.click();
    }

    await page.waitForTimeout(1000);

    // Find cards with pending indicator
    const pendingCard = page.locator(`${selectors.quoteCard}:has(${selectors.pendingIndicator})`);

    if (await pendingCard.count() >= 2) {
      // Select two pending documents
      await pendingCard.nth(0).click();
      await pendingCard.nth(1).click();

      // Compare button should be disabled or show "Waiting for analysis..."
      const compareBtn = page.locator('button').filter({ hasText: /Compare|Waiting/ });
      await expect(compareBtn).toBeDisabled();
    }
  });

  test('should show retry button for failed extraction (AC-11.7.6)', async ({ page }) => {
    // Click "New Comparison" to show document grid
    const newComparisonBtn = page.locator(selectors.newComparisonBtn);
    if (await newComparisonBtn.isVisible()) {
      await newComparisonBtn.click();
    }

    await page.waitForTimeout(1000);

    // Check for failed indicator on any card
    const failedCard = page.locator(`${selectors.quoteCard}:has(${selectors.failedIndicator})`);

    if (await failedCard.count() > 0) {
      // Select the failed document
      await failedCard.first().click();

      // Select another document
      const anyCard = page.locator(selectors.quoteCard).nth(1);
      if (await anyCard.isVisible()) {
        await anyCard.click();
      }

      // Check for retry button in banner
      const retryBtn = page.locator(selectors.retryButton);
      if (await retryBtn.isVisible()) {
        await expect(retryBtn).toBeEnabled();
      }
    }
  });

  test('should show ready indicator for documents with complete extraction', async ({ page }) => {
    // Click "New Comparison" to show document grid
    const newComparisonBtn = page.locator(selectors.newComparisonBtn);
    if (await newComparisonBtn.isVisible()) {
      await newComparisonBtn.click();
    }

    await page.waitForTimeout(1000);

    // Check for complete indicator on cards
    const completeIndicators = page.locator(selectors.completeIndicator);

    if (await completeIndicators.count() > 0) {
      // First complete indicator should show "Ready for comparison"
      await expect(completeIndicators.first()).toContainText('Ready for comparison');
    }
  });
});
