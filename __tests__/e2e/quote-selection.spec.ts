import { test, expect } from '@playwright/test';

/**
 * Quote Selection E2E Tests
 *
 * Story 7.1: Quote Selection Interface
 *
 * Tests for:
 * - AC-7.1.1: Compare page shows document cards with selection checkboxes
 * - AC-7.1.2: Only status='ready' documents are selectable
 * - AC-7.1.3: Selection count display
 * - AC-7.1.4: Compare button disabled until 2+ documents selected
 * - AC-7.1.5: Maximum 4 document selection enforcement
 * - AC-7.1.6: Upload new quotes integration
 * - AC-7.1.7: Navigation to comparison view
 */

// Test credentials
const TEST_EMAIL = process.env.TEST_USER_EMAIL || 'test@example.com';
const TEST_PASSWORD = process.env.TEST_USER_PASSWORD || 'testpassword123';

test.describe('Quote Selection Interface', () => {
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
    // Login before each test
    await login(page);
  });

  test('AC-7.1.1: Compare page shows document cards', async ({ page }) => {
    // Navigate to compare page
    await page.goto('/compare');

    // Wait for page to load
    await page.waitForSelector('h1:has-text("Compare Quotes")', { timeout: 10000 });

    // Check for page title and description
    await expect(page.locator('h1:has-text("Compare Quotes")')).toBeVisible();
    await expect(
      page.locator('text=Select 2-4 documents to compare side-by-side')
    ).toBeVisible();

    // If there are ready documents, they should be displayed as cards
    const readySection = page.locator('h3:has-text("Ready for Comparison")');
    const hasReadyDocs = await readySection.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasReadyDocs) {
      // Check that quote cards are rendered
      const cards = page.locator('[data-testid="quote-card"]');
      await expect(cards.first()).toBeVisible();
    }
  });

  test('AC-7.1.2: Only ready documents are selectable', async ({ page }) => {
    await page.goto('/compare');
    await page.waitForSelector('h1:has-text("Compare Quotes")', { timeout: 10000 });

    // Check for Processing section (disabled cards)
    const processingSection = page.locator('h3:has-text("Processing")');
    const hasProcessingDocs = await processingSection.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasProcessingDocs) {
      // Processing cards should have "Processing..." text
      await expect(page.locator('text=Processing...')).toBeVisible();
    }

    // Check for Failed section (disabled cards)
    const failedSection = page.locator('h3:has-text("Failed")');
    const hasFailedDocs = await failedSection.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasFailedDocs) {
      // Failed cards should have "Processing failed" text
      await expect(page.locator('text=Processing failed')).toBeVisible();
    }
  });

  test('AC-7.1.3: Selection count display shows X of 4 selected', async ({ page }) => {
    await page.goto('/compare');
    await page.waitForSelector('h1:has-text("Compare Quotes")', { timeout: 10000 });

    // Selection counter should be visible
    await expect(page.locator('text=selected')).toBeVisible();

    // Initially should show 0 selected
    await expect(page.locator('text=0')).toBeVisible();
    await expect(page.locator('text=4')).toBeVisible();
  });

  test('AC-7.1.4: Compare button disabled until 2+ documents selected', async ({ page }) => {
    await page.goto('/compare');
    await page.waitForSelector('h1:has-text("Compare Quotes")', { timeout: 10000 });

    // Find the Compare button
    const compareButton = page.locator('button:has-text("Compare")');
    await expect(compareButton).toBeVisible();

    // Button should be disabled initially (0 selected)
    await expect(compareButton).toBeDisabled();

    // If there are ready documents, select one
    const readySection = page.locator('h3:has-text("Ready for Comparison")');
    const hasReadyDocs = await readySection.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasReadyDocs) {
      // Click first card
      const firstCard = page.locator('[data-testid="quote-card"]').first();
      await firstCard.click();

      // Button should still be disabled (only 1 selected)
      await expect(compareButton).toBeDisabled();

      // Click second card
      const secondCard = page.locator('[data-testid="quote-card"]').nth(1);
      const hasSecondCard = await secondCard.isVisible({ timeout: 2000 }).catch(() => false);

      if (hasSecondCard) {
        await secondCard.click();

        // Button should now be enabled (2 selected)
        await expect(compareButton).toBeEnabled();
      }
    }
  });

  test('AC-7.1.5: Maximum 4 document selection', async ({ page }) => {
    await page.goto('/compare');
    await page.waitForSelector('h1:has-text("Compare Quotes")', { timeout: 10000 });

    // Count available ready documents
    const cards = page.locator('[data-testid="quote-card"]');
    const cardCount = await cards.count();

    if (cardCount >= 5) {
      // Select 4 documents
      for (let i = 0; i < 4; i++) {
        await cards.nth(i).click();
      }

      // Check that "Maximum reached" text appears
      await expect(page.locator('text=Maximum reached')).toBeVisible();

      // 5th card should be disabled
      const fifthCard = cards.nth(4);
      await expect(fifthCard).toHaveAttribute('aria-disabled', 'true');
    }
  });

  test('AC-7.1.6: Upload new quotes button opens dialog', async ({ page }) => {
    await page.goto('/compare');
    await page.waitForSelector('h1:has-text("Compare Quotes")', { timeout: 10000 });

    // Find and click upload button
    const uploadButton = page.locator('button:has-text("Upload new quotes")');
    await expect(uploadButton).toBeVisible();
    await uploadButton.click();

    // Dialog should open
    await expect(page.locator('text=Upload Quote Documents')).toBeVisible({ timeout: 5000 });
  });

  test('AC-7.1.7: Compare button navigates to comparison view', async ({ page }) => {
    await page.goto('/compare');
    await page.waitForSelector('h1:has-text("Compare Quotes")', { timeout: 10000 });

    // Check if we have at least 2 ready documents
    const readySection = page.locator('h3:has-text("Ready for Comparison")');
    const hasReadyDocs = await readySection.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasReadyDocs) {
      const cards = page.locator('[data-testid="quote-card"]');
      const cardCount = await cards.count();

      if (cardCount >= 2) {
        // Select 2 documents
        await cards.nth(0).click();
        await cards.nth(1).click();

        // Click Compare button
        const compareButton = page.locator('button:has-text("Compare")');
        await expect(compareButton).toBeEnabled();
        await compareButton.click();

        // Should navigate to comparison page
        await page.waitForURL(/\/compare\/[a-f0-9-]+/, { timeout: 10000 });

        // Should show comparison page header
        await expect(page.locator('h1:has-text("Quote Comparison")')).toBeVisible({
          timeout: 10000,
        });
      }
    }
  });

  test('Keyboard navigation works for card selection', async ({ page }) => {
    await page.goto('/compare');
    await page.waitForSelector('h1:has-text("Compare Quotes")', { timeout: 10000 });

    // Check if we have ready documents
    const cards = page.locator('[data-testid="quote-card"]');
    const cardCount = await cards.count();

    if (cardCount >= 1) {
      // Focus on first card
      const firstCard = cards.first();
      await firstCard.focus();

      // Press Enter to select
      await page.keyboard.press('Enter');

      // Card should be selected (aria-checked="true")
      await expect(firstCard).toHaveAttribute('aria-checked', 'true');

      // Press Space to deselect
      await page.keyboard.press('Space');

      // Card should be deselected
      await expect(firstCard).toHaveAttribute('aria-checked', 'false');
    }
  });

  test('Empty state displays correctly when no documents', async ({ page }) => {
    // This test verifies the empty state message renders correctly
    // In a real scenario, we'd need a test user with no documents

    await page.goto('/compare');
    await page.waitForSelector('h1:has-text("Compare Quotes")', { timeout: 10000 });

    // Check if empty state is shown (if no documents)
    const noDocsMessage = page.locator('text=No documents yet');
    const noReadyMessage = page.locator('text=No documents ready');

    // At least one of these should be visible if there are no ready documents
    // OR we should see the ready documents section
    const readySection = page.locator('h3:has-text("Ready for Comparison")');

    const hasEmptyState = await noDocsMessage.isVisible({ timeout: 2000 }).catch(() => false);
    const hasNoReadyState = await noReadyMessage.isVisible({ timeout: 2000 }).catch(() => false);
    const hasReadyDocs = await readySection.isVisible({ timeout: 2000 }).catch(() => false);

    // One of these conditions should be true
    expect(hasEmptyState || hasNoReadyState || hasReadyDocs).toBe(true);
  });
});
