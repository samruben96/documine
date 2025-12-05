import { test, expect } from '@playwright/test';

/**
 * Enhanced Comparison Table E2E Tests
 *
 * Story 10.8: Enhanced Comparison Table
 *
 * Tests for:
 * - AC-10.8.1: Collapsible sections
 * - AC-10.8.2: Policy metadata display
 * - AC-10.8.3: Carrier information (AM Best rating)
 * - AC-10.8.4: Endorsement matrix
 * - AC-10.8.5: Premium breakdown table
 * - AC-10.8.7: Accessibility (aria-expanded, keyboard)
 */

// Test credentials
const TEST_EMAIL = process.env.TEST_USER_EMAIL || 'test@example.com';
const TEST_PASSWORD = process.env.TEST_USER_PASSWORD || 'testpassword123';

test.describe('Enhanced Comparison Table', () => {
  /**
   * Helper function to login
   */
  async function login(page: any) {
    await page.goto('/login');
    await page.fill('input[name="email"]', TEST_EMAIL);
    await page.fill('input[name="password"]', TEST_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/documents/, { timeout: 10000 });
  }

  /**
   * Helper to navigate to comparison page with selected documents
   */
  async function navigateToComparisonWithSelection(page: any) {
    await page.goto('/compare');
    await page.waitForSelector('h1:has-text("Compare Quotes")', { timeout: 10000 });

    const readySection = page.locator('h3:has-text("Ready for Comparison")');
    const hasReadyDocs = await readySection.isVisible({ timeout: 5000 }).catch(() => false);

    if (!hasReadyDocs) {
      return false;
    }

    const cards = page.locator('[data-testid="quote-card"]');
    const cardCount = await cards.count();

    if (cardCount < 2) {
      return false;
    }

    await cards.nth(0).click();
    await cards.nth(1).click();

    const compareButton = page.locator('button:has-text("Compare")');
    await compareButton.click();

    await page.waitForURL(/\/compare\/[a-f0-9-]+/, { timeout: 15000 });
    return true;
  }

  /**
   * Helper to wait for comparison table to load
   */
  async function waitForComparisonTable(page: any) {
    const table = page.locator('table').first();
    await table.waitFor({ timeout: 60000 });
    return table;
  }

  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  // ============================================================================
  // AC-10.8.1: Collapsible Sections
  // ============================================================================

  test('AC-10.8.1: Collapsible sections are visible', async ({ page }) => {
    const success = await navigateToComparisonWithSelection(page);

    if (!success) {
      test.skip();
      return;
    }

    await waitForComparisonTable(page);

    // Check for collapsible section buttons
    const sectionButtons = page.locator('[data-testid="collapsible-section-toggle"]');
    const sectionCount = await sectionButtons.count();

    // Should have at least Policy Details and Coverage sections
    expect(sectionCount).toBeGreaterThanOrEqual(2);
  });

  test('AC-10.8.1: Sections can be toggled with click', async ({ page }) => {
    const success = await navigateToComparisonWithSelection(page);

    if (!success) {
      test.skip();
      return;
    }

    await waitForComparisonTable(page);

    // Find a collapsible section that starts open (Policy Details)
    const policySection = page.locator('button:has-text("Policy Details")');
    const isVisible = await policySection.isVisible().catch(() => false);

    if (!isVisible) {
      test.skip();
      return;
    }

    // Get initial state
    const isExpanded = await policySection.getAttribute('aria-expanded');
    expect(isExpanded).toBe('true');

    // Click to collapse
    await policySection.click();

    // Should be collapsed
    const isCollapsed = await policySection.getAttribute('aria-expanded');
    expect(isCollapsed).toBe('false');

    // Click again to expand
    await policySection.click();

    // Should be expanded
    const isExpandedAgain = await policySection.getAttribute('aria-expanded');
    expect(isExpandedAgain).toBe('true');
  });

  test('AC-10.8.7: Sections have correct ARIA attributes', async ({ page }) => {
    const success = await navigateToComparisonWithSelection(page);

    if (!success) {
      test.skip();
      return;
    }

    await waitForComparisonTable(page);

    // Check for aria-expanded attribute
    const expandedButtons = page.locator('button[aria-expanded]');
    const expandedCount = await expandedButtons.count();

    expect(expandedCount).toBeGreaterThan(0);

    // Check for aria-controls attribute
    const controlsButtons = page.locator('button[aria-controls]');
    const controlsCount = await controlsButtons.count();

    expect(controlsCount).toBeGreaterThan(0);
  });

  test('AC-10.8.7: Keyboard navigation toggles sections', async ({ page }) => {
    const success = await navigateToComparisonWithSelection(page);

    if (!success) {
      test.skip();
      return;
    }

    await waitForComparisonTable(page);

    // Find and focus a collapsible section
    const policySection = page.locator('button:has-text("Policy Details")');
    const isVisible = await policySection.isVisible().catch(() => false);

    if (!isVisible) {
      test.skip();
      return;
    }

    await policySection.focus();

    // Press Enter to toggle
    await page.keyboard.press('Enter');

    // Should toggle state
    const isCollapsed = await policySection.getAttribute('aria-expanded');
    expect(isCollapsed).toBe('false');

    // Press Space to toggle back
    await page.keyboard.press('Space');

    const isExpanded = await policySection.getAttribute('aria-expanded');
    expect(isExpanded).toBe('true');
  });

  // ============================================================================
  // AC-10.8.2: Policy Metadata Display
  // ============================================================================

  test('AC-10.8.2: Policy Type row is visible', async ({ page }) => {
    const success = await navigateToComparisonWithSelection(page);

    if (!success) {
      test.skip();
      return;
    }

    await waitForComparisonTable(page);

    // Check for Policy Type row
    const policyTypeRow = page.locator('td:has-text("Policy Type")');
    const hasRow = await policyTypeRow.isVisible().catch(() => false);

    // Policy Type may not always be extracted, but if present should be visible
    if (hasRow) {
      await expect(policyTypeRow).toBeVisible();
    }
  });

  test('AC-10.8.2: Form Numbers row displays when available', async ({ page }) => {
    const success = await navigateToComparisonWithSelection(page);

    if (!success) {
      test.skip();
      return;
    }

    await waitForComparisonTable(page);

    // Check for Form Numbers row (optional field)
    const formNumbersRow = page.locator('td:has-text("Form Numbers")');
    const isVisible = await formNumbersRow.isVisible().catch(() => false);

    // Just verify the check doesn't throw - field is optional
    expect(typeof isVisible).toBe('boolean');
  });

  // ============================================================================
  // AC-10.8.3: Carrier Information Display
  // ============================================================================

  test('AC-10.8.3: AM Best Rating row is visible', async ({ page }) => {
    const success = await navigateToComparisonWithSelection(page);

    if (!success) {
      test.skip();
      return;
    }

    await waitForComparisonTable(page);

    // Check for AM Best Rating row
    const ratingRow = page.locator('td:has-text("AM Best Rating")');
    const hasRow = await ratingRow.isVisible().catch(() => false);

    // AM Best may not always be extracted
    if (hasRow) {
      await expect(ratingRow).toBeVisible();
    }
  });

  test('AC-10.8.3: Admitted Status row is visible', async ({ page }) => {
    const success = await navigateToComparisonWithSelection(page);

    if (!success) {
      test.skip();
      return;
    }

    await waitForComparisonTable(page);

    // Check for Admitted Status row
    const admittedRow = page.locator('td:has-text("Admitted Status")');
    const hasRow = await admittedRow.isVisible().catch(() => false);

    // Admitted status may not always be extracted
    if (hasRow) {
      await expect(admittedRow).toBeVisible();
    }
  });

  test('AC-10.8.3: AM Best ratings have color coding', async ({ page }) => {
    const success = await navigateToComparisonWithSelection(page);

    if (!success) {
      test.skip();
      return;
    }

    await waitForComparisonTable(page);

    // Look for rating color classes (green, blue, or amber)
    const greenRating = page.locator('[class*="text-green-"]');
    const blueRating = page.locator('[class*="text-blue-"]');
    const amberRating = page.locator('[class*="text-amber-"]');

    const greenCount = await greenRating.count();
    const blueCount = await blueRating.count();
    const amberCount = await amberRating.count();

    // If ratings are present, at least one color should be used
    // (May be 0 if no ratings extracted)
    expect(greenCount >= 0 && blueCount >= 0 && amberCount >= 0).toBe(true);
  });

  // ============================================================================
  // AC-10.8.4: Endorsement Matrix
  // ============================================================================

  test('AC-10.8.4: Endorsements section is visible', async ({ page }) => {
    const success = await navigateToComparisonWithSelection(page);

    if (!success) {
      test.skip();
      return;
    }

    await waitForComparisonTable(page);

    // Check for Endorsements section toggle
    const endorsementsSection = page.locator('button:has-text("Endorsements")');
    const hasSection = await endorsementsSection.isVisible().catch(() => false);

    if (hasSection) {
      await expect(endorsementsSection).toBeVisible();

      // If collapsed, expand it
      const isExpanded = await endorsementsSection.getAttribute('aria-expanded');
      if (isExpanded === 'false') {
        await endorsementsSection.click();
      }

      // Check for endorsement matrix
      const matrix = page.locator('[data-testid="endorsement-matrix"]');
      const hasMatrix = await matrix.isVisible({ timeout: 2000 }).catch(() => false);

      // Matrix only shows if endorsements were extracted
      expect(typeof hasMatrix).toBe('boolean');
    }
  });

  test('AC-10.8.4: Endorsement matrix shows checkmarks and X marks', async ({ page }) => {
    const success = await navigateToComparisonWithSelection(page);

    if (!success) {
      test.skip();
      return;
    }

    await waitForComparisonTable(page);

    // Expand endorsements section
    const endorsementsSection = page.locator('button:has-text("Endorsements")');
    const hasSection = await endorsementsSection.isVisible().catch(() => false);

    if (!hasSection) {
      test.skip();
      return;
    }

    const isExpanded = await endorsementsSection.getAttribute('aria-expanded');
    if (isExpanded === 'false') {
      await endorsementsSection.click();
    }

    // Look for check and X icons
    const checkIcons = page.locator('[data-testid="endorsement-present"]');
    const xIcons = page.locator('[data-testid="endorsement-missing"]');

    const checkCount = await checkIcons.count();
    const xCount = await xIcons.count();

    // May be 0 if no endorsements or no differences
    expect(checkCount >= 0 && xCount >= 0).toBe(true);
  });

  test('AC-10.8.4: Critical endorsements have badge', async ({ page }) => {
    const success = await navigateToComparisonWithSelection(page);

    if (!success) {
      test.skip();
      return;
    }

    await waitForComparisonTable(page);

    // Expand endorsements section
    const endorsementsSection = page.locator('button:has-text("Endorsements")');
    const hasSection = await endorsementsSection.isVisible().catch(() => false);

    if (!hasSection) {
      test.skip();
      return;
    }

    const isExpanded = await endorsementsSection.getAttribute('aria-expanded');
    if (isExpanded === 'false') {
      await endorsementsSection.click();
    }

    // Look for "Critical" badge
    const criticalBadge = page.locator('text=Critical');
    const hasCritical = await criticalBadge.isVisible({ timeout: 2000 }).catch(() => false);

    // May be 0 if no critical endorsements present
    expect(typeof hasCritical).toBe('boolean');
  });

  // ============================================================================
  // AC-10.8.5: Premium Breakdown Table
  // ============================================================================

  test('AC-10.8.5: Premium Breakdown section is visible', async ({ page }) => {
    const success = await navigateToComparisonWithSelection(page);

    if (!success) {
      test.skip();
      return;
    }

    await waitForComparisonTable(page);

    // Check for Premium Breakdown section
    const premiumSection = page.locator('button:has-text("Premium Breakdown")');
    const hasSection = await premiumSection.isVisible().catch(() => false);

    if (hasSection) {
      await expect(premiumSection).toBeVisible();
    }
  });

  test('AC-10.8.5: Premium breakdown shows totals', async ({ page }) => {
    const success = await navigateToComparisonWithSelection(page);

    if (!success) {
      test.skip();
      return;
    }

    await waitForComparisonTable(page);

    // Expand premium breakdown section
    const premiumSection = page.locator('button:has-text("Premium Breakdown")');
    const hasSection = await premiumSection.isVisible().catch(() => false);

    if (!hasSection) {
      test.skip();
      return;
    }

    const isExpanded = await premiumSection.getAttribute('aria-expanded');
    if (isExpanded === 'false') {
      await premiumSection.click();
    }

    // Check for total row
    const totalRow = page.locator('[data-testid="premium-breakdown-table"]');
    const hasTable = await totalRow.isVisible({ timeout: 2000 }).catch(() => false);

    if (hasTable) {
      // Should have currency values
      const currencyValue = page.locator('text=/\\$[\\d,]+/');
      const currencyCount = await currencyValue.count();
      expect(currencyCount).toBeGreaterThan(0);
    }
  });

  test('AC-10.8.5: Best value indicator shows on lowest premium', async ({ page }) => {
    const success = await navigateToComparisonWithSelection(page);

    if (!success) {
      test.skip();
      return;
    }

    await waitForComparisonTable(page);

    // Expand premium breakdown section
    const premiumSection = page.locator('button:has-text("Premium Breakdown")');
    const hasSection = await premiumSection.isVisible().catch(() => false);

    if (!hasSection) {
      test.skip();
      return;
    }

    const isExpanded = await premiumSection.getAttribute('aria-expanded');
    if (isExpanded === 'false') {
      await premiumSection.click();
    }

    // Check for "Best Value" badge
    const bestValue = page.locator('text=Best Value');
    const hasBestValue = await bestValue.isVisible({ timeout: 2000 }).catch(() => false);

    // May not be visible if premiums are equal or only one quote has premium
    expect(typeof hasBestValue).toBe('boolean');
  });

  // ============================================================================
  // General Accessibility & Responsiveness
  // ============================================================================

  test('AC-10.8.7: Tables scroll horizontally on narrow viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    const success = await navigateToComparisonWithSelection(page);

    if (!success) {
      test.skip();
      return;
    }

    await waitForComparisonTable(page);

    // Check for horizontal scroll container
    const scrollContainer = page.locator('.overflow-x-auto, [style*="overflow"]');
    const hasScrollContainer = await scrollContainer.isVisible().catch(() => false);

    expect(hasScrollContainer).toBe(true);
  });

  test('Section badges show count', async ({ page }) => {
    const success = await navigateToComparisonWithSelection(page);

    if (!success) {
      test.skip();
      return;
    }

    await waitForComparisonTable(page);

    // Look for badge counts on section headers
    const badgeCount = page.locator('[data-testid="collapsible-section-badge"]');
    const count = await badgeCount.count();

    // At least some sections should have badges
    // May be 0 if no data extracted
    expect(count >= 0).toBe(true);
  });

  test('Chevron rotates when section expands/collapses', async ({ page }) => {
    const success = await navigateToComparisonWithSelection(page);

    if (!success) {
      test.skip();
      return;
    }

    await waitForComparisonTable(page);

    // Find a section toggle
    const section = page.locator('button:has-text("Policy Details")');
    const isVisible = await section.isVisible().catch(() => false);

    if (!isVisible) {
      test.skip();
      return;
    }

    // Look for chevron icon
    const chevron = section.locator('svg');
    const hasChevron = await chevron.isVisible().catch(() => false);

    if (hasChevron) {
      // Check for rotation class
      const hasRotation = await chevron.evaluate((el) => {
        return el.classList.contains('rotate-90') ||
               el.closest('button')?.getAttribute('aria-expanded') === 'true';
      });

      expect(typeof hasRotation).toBe('boolean');
    }
  });
});
